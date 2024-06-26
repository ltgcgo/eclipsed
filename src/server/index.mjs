// Copyright 2024 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

"use strict";

import TextEmitter from "../../libs/rochelle/textEmit.mjs";
import MiniSignal from "../../libs/twinkle/miniSignal.mjs";
import {
	genRandB64,
	getDebugState,
	splitByLine
} from "../common/utils.mjs";

const commonHeaders = {
	"Server": "Eclipsed",
	"Content-Type": "text/plain",
	"Cache-Control": "no-cache, no-store",
	"Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, OPTIONS",
	"Access-Control-Allow-Origin": "*"
}, successHeaders = {
	"Server": "Eclipsed",
	"Content-Type": "text/event-stream",
	"Cache-Control": "no-cache, no-store",
	"Vary": "Authorization, If-Match, Last-Event-ID",
	"Access-Control-Allow-Headers": "Authorization, Accept, Cache-Control, If-Match, Last-Event-ID",
	"Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, OPTIONS",
	"Access-Control-Allow-Origin": "*"
};

// If-Match is used for server ETag
// Last-Event-ID is only used to reinstate connections, not resend events
// Eclipsed will not establish a true gRPC connection

/*
newrx: a new receive-side connection
newtx: a new send-side connection
connectrx: receive-side connection becomes available
connecttx: send-side connection becomes available
connect: a new connection
dangle: connection is no longer duplex
message: a new message (rcv), socket only
error: errors out
deadrx: a receive-side connection closes
deadtx: a send-side connection closes
closerx: receive-side closes
closetx: send-side closes
close: both closes
shutdown: socket is no longer usable
*/

const duplexStreamSendTimeout = 2500, // How long to consider an EventSocket strean to be a streamed duplex
chunkedSendInterval = 500, // When the send socket is chunked, how long to wait when frames of data is sent
chunkedSendTimeout = 20000; // When the send socket is chunked, how long to wait for the first frame of data, and how long to wait to establish a new send socket

const closedSocket = Symbol("closedSocket");

const u8Enc = new TextEncoder();
const u8HeadData = u8Enc.encode("data: ");
const u8EofData = u8Enc.encode("\n\n");
let errorWithControl = (text, allowNewLines) => {
	for (let i = 0; i < text.length; i ++) {
		let e = text.charCodeAt(i);
		if (e < 32) {
			if (e != 10 && e != 13 || !allowNewLines || e != 9) {
				throw(new RangeError(`Control characters are not allowed`));
			};
		};
	};
};

let EventSocket = class extends EventTarget {
	#rootHandler;
	#requests = []; // purely requests
	#responses = []; // responses (0), stream controllers (1)
	#socketId;
	#useRandom = false;
	#count = 0;
	#readyState = 0;
	#oldReqCount = 0;
	#oldRespCount = 0;
	#useCustomExt = false;
	#isStreamedSend = 1; // Indicates responses being buffered and flushed when false
	#duplexLatency = 0;
	CLOSED = 0;
	OPEN = 3;
	TX_OPEN = 1;
	RX_OPEN = 2;
	PROBING = 1;
	TRUE = 2;
	FALSE = 0;
	#shutdown = false;
	shutdownTimeout = 15000;
	#updateState() {
		let upThis = this;
		if (upThis.#requests.length > upThis.#oldReqCount) {
			//console.debug(`[Eclipsed] New Rx`);
			upThis.dispatchEvent(new Event("newrx"));
		} else if (upThis.#requests.length < upThis.#oldReqCount) {
			//console.debug(`[Eclipsed] Dead Rx`);
			upThis.dispatchEvent(new Event("deadrx"));
		};
		if (upThis.#responses.length > upThis.#oldRespCount) {
			//console.debug(`[Eclipsed] New Tx`);
			upThis.dispatchEvent(new Event("newtx"));
		} else if (upThis.#responses.length < upThis.#oldRespCount) {
			//console.debug(`[Eclipsed] Dead Tx`);
			upThis.dispatchEvent(new Event("deadtx"));
		};
		//console.debug(`[Eclipsed] Receive sockets: ${upThis.#requests.length}`);
		//console.debug(`[Eclipsed] Send sockets: ${upThis.#responses.length}`);
		let readyState = 0;
		if (upThis.#responses.length) {
			readyState |= 1;
		};
		if (upThis.#requests.length) {
			readyState |= 2;
		};
		if (readyState != upThis.#readyState) {
			getDebugState() && console.debug(`[Eclipsed] Old state: ${upThis.#readyState}`);
			getDebugState() && console.debug(`[Eclipsed] New state: ${readyState}`);
			switch (readyState) {
				case 0: {
					getDebugState() && console.debug(`[Eclipsed] Close all: ${upThis.#socketId}`);
					upThis.dispatchEvent(new Event("close"));
					switch (upThis.#readyState) {
						case 1: {
							//console.debug(`[Eclipsed] Close Tx`);
							upThis.dispatchEvent(new Event("closetx"));
							break;
						};
						case 2: {
							//console.debug(`[Eclipsed] Close Rx`);
							upThis.dispatchEvent(new Event("closerx"));
							break;
						};
						case 3: {
							upThis.dispatchEvent(new Event("dangle"));
							upThis.dispatchEvent(new Event("closetx"));
							upThis.dispatchEvent(new Event("closerx"));
							break;
						};
					};
					break;
				};
				case 3: {
					getDebugState() && console.debug(`[Eclipsed] Connect duplex: ${upThis.#socketId}`);
					upThis.dispatchEvent(new Event("connect"));
					break;
				};
				case 1: {
					switch (upThis.#readyState) {
						case 0: {
							//console.debug(`[Eclipsed] Connect Tx`);
							upThis.dispatchEvent(new Event("connecttx"));
							break;
						};
						case 3: {
							//console.debug(`[Eclipsed] Close Rx`);
							upThis.dispatchEvent(new Event("closerx"));
							getDebugState() && console.debug(`[Eclipsed] No duplex: ${upThis.#socketId}`);
							upThis.dispatchEvent(new Event("dangle"));
							break;
						};
					};
					break;
				};
				case 2: {
					switch (upThis.#readyState) {
						case 0: {
							//console.debug(`[Eclipsed] Connect Rx`);
							upThis.dispatchEvent(new Event("connectrx"));
							break;
						};
						case 3: {
							//console.debug(`[Eclipsed] Close Tx`);
							upThis.dispatchEvent(new Event("closetx"));
							//console.debug(`[Eclipsed] No duplex`);
							upThis.dispatchEvent(new Event("dangle"));
							break;
						};
					};
					break;
				};
			};
			upThis.#readyState = readyState;
		};
		upThis.#oldReqCount = upThis.#requests.length;
		upThis.#oldRespCount = upThis.#responses.length;
	};
	get id() {
		return this.#socketId;
	};
	get readyState() {
		return this.#readyState;
	};
	getRequest() {
		let upThis = this;
		if (upThis.#requests.length) {
			return upThis.#requests[0];
		};
	};
	getResponse() {
		let upThis = this;
		if (upThis.#responses.length) {
			return upThis.#responses[0];
		};
	};
	sendEvent(ev = "message") {
		if (this.#shutdown) {
			throw(new Error(`Tried to send data through a closed socket`));
		};
		errorWithControl(ev);
		this.getResponse()[1].enqueue(u8Enc.encode(`event: ${ev}\n`));
	};
	sendData(ev) {
		if (this.#shutdown) {
			throw(new Error(`Tried to send data through a closed socket`));
		};
		splitByLine(ev).forEach((e) => {
			this.getResponse()[1].enqueue(u8Enc.encode(`data: ${e}\n`));
		});
	};
	sendDataRaw(ev) {
		let upThis = this;
		if (upThis.#shutdown) {
			throw(new Error(`Tried to send data through a closed socket`));
		};
		// Only UTF-8-encoded byte sequences are allowed
		if (!ev?.BYTES_PER_ELEMENT || ev.BYTES_PER_ELEMENT != 1) {
			throw(new TypeError("Only Uint8Array is accepted"));
		};
		let lastPtr = 0, committed = false;
		for (let ptr = 0; ptr < ev.length; ptr ++) {
			let e = ev[ptr];
			switch (e) {
				case 10:
				case 13: {
					if (!committed) {
						upThis.getResponse()[1].enqueue(u8HeadData);
						upThis.getResponse()[1].enqueue(ev.subarray(lastPtr, ptr));
						upThis.getResponse()[1].enqueue(u8EofData);
						committed = true;
					};
					lastPtr = ptr + 1;
				};
				default: {
					if (e < 32) {
						ev[ptr] = 32;
					};
					committed = false;
				};
			};
		};
		if (!committed) {
			upThis.getResponse()[1].enqueue(u8HeadData);
			upThis.getResponse()[1].enqueue(ev.subarray(lastPtr));
			upThis.getResponse()[1].enqueue(u8EofData);
		};
	};
	sendComment(ev) {
		if (this.#shutdown) {
			throw(new Error(`Tried to send data through a closed socket`));
		};
		splitByLine(ev).forEach((e) => {
			this.getResponse()[1].enqueue(u8Enc.encode(`:${e}\n`));
		});
	};
	sendFlush() {
		if (this.#shutdown) {
			throw(new Error(`Tried to send data through a closed socket`));
		};
		let upThis = this;
		if (!upThis.#useCustomExt) {
			upThis.getResponse()[1].enqueue(u8Enc.encode(`id: ${upThis.#socketId}.${upThis.#count}\n\n`));
		} else {
			upThis.getResponse()[1].enqueue(u8Enc.encode(`\n`));
		};
		upThis.#count ++;
	};
	send(text, eventType) {
		let upThis = this;
		if (eventType) {
			upThis.sendEvent(eventType);
		};
		upThis.sendData(text);
		upThis.sendFlush();
	};
	useCustomExt(state) {
		//getDebugState() && console.debug(`[Eclipsed] Connection supports Eclipsed custom extensions.`);
		this.#useCustomExt = state;
	};
	close() {
		let upThis = this;
		getDebugState() && console.debug(`[Eclipsed] Closing down the socket: ${upThis.#socketId}...`);
		while (upThis.#requests.length > 0) {
			upThis.#requests[0].cancel();
			upThis.#requests.splice(0, 1);
		};
		while (upThis.#responses.length > 0) {
			upThis.#responses[0][1].close();
			upThis.#responses.splice(0, 1);
		};
		upThis.#updateState();
	};
	attachRequest(req) {
		let upThis = this;
		this.#requests.push(req);
		upThis.#updateState();
		upThis.useCustomExt(true);
		// Same as the client
		let miniSig = new MiniSignal();
		let lineReader = new TextEmitter(req.body, 0, "utf-8");
		let eventType, dataRope = "";
		lineReader.addEventListener("text", ({data}) => {
			console.debug(data);
			let colonIndex = data?.indexOf(":");
			if (!data?.trim()?.length) {
				//console.debug(`Emitting event...`);
				if (dataRope) {
					/*console.debug(`Type: ${eventType || "message"}`);
					console.debug(`Data: ${dataRope}`);*/
					upThis.dispatchEvent(new MessageEvent(eventType || "message", {
						"data": dataRope/*,
						"origin": upThis.#url*/
					}));
					//console.debug(`Event "${eventType || "message"}" emitted. Data length: ${dataRope.length}.`);
					eventType = undefined;
					dataRope = "";
					//upThis.#lastEventId = undefined;
				} else {
					//console.debug(`Nothing to emit.`);
				};
			} else if (data.codePointAt(0) == 58) {
				//console.debug(`Line ignored: commented out.`);
				if (data.indexOf("eclipsed:") == 1) {
					upThis.dispatchEvent(new MessageEvent("eclipsedext", {
						"data": data.slice(10)
					}));
				};
			} else if (colonIndex > -1) {
				let field = data.slice(0, colonIndex);
				let valueStart = colonIndex + 1;
				if (data.codePointAt(colonIndex + 1) == 32) {
					valueStart ++;
				};
				let value = data.slice(valueStart);
				switch(field) {
					case "event": {
						eventType = value;
						break;
					};
					case "data": {
						if (dataRope.length) {
							dataRope += "\n";
						};
						dataRope += value;
						break;
					};
					/*case "id": {
						if (data.indexOf("\x00") == -1) {
							upThis.#lastEventId = value;
						} else {
							//console.debug(`Line ignored: event ID contains NULL.`);
						};
						break;
					};
					case "retry": {
						let retryMs = parseInt(retryMs);
						if (retryMs && retryMs >= retryMinDelayMs) {
							upThis.#retry = retryMs;
						} else {
							//console.debug(`Line ignored: invalid retry delay (${value} = ${retryMs}).`);
						};
						break;
					};*/
					default: {
						//console.debug(`Line ignored: invalid line.`);
					};
				};
			} else {
				//console.debug(`Line ignored: no valid field or value.`);
			};
		});
		lineReader.addEventListener("close", () => {
			miniSig.finish();
			let reqIdx = upThis.#requests.indexOf(req);
			if (reqIdx >= 0) {
				upThis.#requests.splice(reqIdx, 1);
			};
			upThis.#updateState();
		});
		return miniSig.wait();
	};
	async newResponse() {
		let upThis = this;
		let pushArr, shouldPush = true;
		let miniSig = new MiniSignal();
		let controller;
		let source = new ReadableStream({
			"start": (e) => {
				controller = e;
				miniSig.finish();
			},
			"cancel": (reason) => {
				if (miniSig.finished) {
					let respIdx = upThis.#responses.indexOf(pushArr);
					if (respIdx >= 0) {
						upThis.#responses.splice(respIdx, 1);
					};
					upThis.#updateState();
				} else {
					shouldPush = false;
				};
			}
		});
		let headers = structuredClone(successHeaders);
		headers["ETag"] = upThis.#socketId;
		let resp = new Response(source, {
			"status": 200,
			"headers": headers
		});
		await miniSig.wait();
		pushArr = [resp, controller];
		if (shouldPush) {
			upThis.#responses.push(pushArr);
			upThis.#updateState();
		};
		return resp;
	};
	constructor(root, socketId, useRandom) {
		super();
		let upThis = this;
		if (!root) {
			throw(new Error("Invalid event socket root"));
		};
		if (!socketId) {
			throw(new Error("Invalid socket ID"));
		};
		upThis.#rootHandler = root;
		upThis.#socketId = socketId;
		upThis.#useRandom = !!useRandom;
		upThis.addEventListener("connecttx", () => {
			upThis.sendComment("eclipsed:new"); // Prompt the client to begin duplex connection
		});
		/*upThis.addEventListener("message", ({data}) => {
			console.debug(`[Eclipsed] Default message data received: "${data}"`)
		});*/
		upThis.addEventListener("close", async () => {
			await MiniSignal.sleep(Math.max(10000, upThis.shutdownTimeout));
			if (upThis.#readyState == 0) {
				upThis.#shutdown = true;
				getDebugState() && console.debug(`[Eclipsed] Socket ${upThis.#socketId} shutdown`);
				upThis.dispatchEvent(new Event("shutdown"));
			};
		});
		let pingChallenges = {};
		upThis.addEventListener("eclipsedext", async ({data}) => {
			let extDesc = data.split("\t");
			let timeNow = Date.now();
			//getDebugState() && console.debug(`[Eclipsed] Extension: ${extDesc}`);
			switch (extDesc[0]) {
				case "syn": {
					let currentChallenge = extDesc[1];
					pingChallenges[currentChallenge] = timeNow;
					getDebugState() && console.debug(`[Eclipsed] Sending SYN/ACK`);
					upThis.sendComment(`eclipsed:synack\t${currentChallenge}`);
					break;
				};
				case "ack": {
					let currentChallenge = extDesc[1];
					let rttDelay = timeNow - pingChallenges[currentChallenge];
					if (rttDelay < duplexStreamSendTimeout) {
						upThis.#isStreamedSend = 2;
						getDebugState() && console.debug(`[Eclipsed] Connection ${upThis.#socketId} is streamed (${rttDelay}ms).`);
					} else {
						upThis.#isStreamedSend = 0;
						getDebugState() && console.debug(`[Eclipsed] Connection ${upThis.#socketId} is chunked (${rttDelay}ms).`);
					};
					delete pingChallenges[extDesc[1]];
					upThis.#duplexLatency = rttDelay;
					break;
				};
				default: {
					console.debug(`[Eclipsed] Unmatched extension: ${extDesc}`);
				};
			};
		});
	};
};

let EventSocketHandler = class extends EventTarget {
	static EventSocket = EventSocket;
	#id;
	#socketPairs = {};
	shutdownTimeout = 15000;
	#get(id) {
		console.debug(`[Eclipsed] Does the socket pool have socket ID "${id}"? ${!!this.#socketPairs[id]}`);
		return this.#socketPairs[id];
	};
	//#getFrom
	constructor(shutdownTimeout = 15000) {
		super();
		// CORS should always be allowed
		this.shutdownTimeout = shutdownTimeout;
	};
	upgradeEventStream(req) {
		let upThis = this;
		let connType;
		let clientAccept = req.headers.get("Accept");
		switch (clientAccept) {
			case "text/event-stream": {
				connType = "eventSocket";
				break;
			};
			case "application/grpc": {
				connType = "grpc";
				break;
			};
			default: {
				if (clientAccept.indexOf("application/grpc+") >= 0) {
					connType = "grpc";
				} else {
					return {
						"untilRespond": Promise.resolve(),
						"response": new Response("Bad request", {
							status: 400,
							headers: commonHeaders
						})
					};
				};
			};
		};
		if (connType == "grpc" && (req.method == "GET" || req.method == "get")) {
			return {
				"untilRespond": Promise.resolve(),
				"response": new Response("Bad request", {
					status: 400,
					headers: commonHeaders
				})
			};
		};
		let targetSocket;
		let existingId;
		if (req.headers.has("Authorization")) {
			existingId = req.headers.get("Authorization");
			if (existingId.slice(0, 7) == "Bearer ") {
				existingId = existingId.slice(7);
			};
		};
		if (!existingId && req.headers.has("If-Match")) {
			existingId = req.headers.get("If-Match");
			if (existingId.slice(0, 2) == "W/") {
				existingId = existingId.slice(2);
			};
		};
		if (req.headers.has("Last-Event-ID")) {
			existingId = req.headers.get("Last-Event-ID");
			let delimIdx = existingId.indexOf(".");
			if (delimIdx > 0) {
				existingId = existingId.slice(0, delimIdx);
			};
		};
		if (existingId) {
			targetSocket = upThis.#get(existingId);
		} else {
			getDebugState() && console.debug(`[Eclipsed] The new connection has no ID.`);
		};
		if (targetSocket == closedSocket) {
			return {
				"untilRespond": Promise.resolve(),
				"response": new Response("Closed socket", {
					status: 404,
					headers: commonHeaders
				})
			};
		};
		if (!targetSocket) {
			let newId = existingId || genRandB64(16);
			targetSocket = new EventSocket(upThis, newId);
			upThis.#socketPairs[newId] = targetSocket;
			targetSocket.addEventListener("newrx", (ev) => {
				upThis.dispatchEvent(new MessageEvent(ev.type, {
					"data": targetSocket
				}));
			});
			targetSocket.addEventListener("newtx", (ev) => {
				upThis.dispatchEvent(new MessageEvent(ev.type, {
					"data": targetSocket
				}));
			});
			targetSocket.addEventListener("connectrx", (ev) => {
				upThis.dispatchEvent(new MessageEvent(ev.type, {
					"data": targetSocket
				}));
			});
			targetSocket.addEventListener("connecttx", (ev) => {
				upThis.dispatchEvent(new MessageEvent(ev.type, {
					"data": targetSocket
				}));
			});
			targetSocket.addEventListener("connect", (ev) => {
				upThis.dispatchEvent(new MessageEvent(ev.type, {
					"data": targetSocket
				}));
			});
			targetSocket.addEventListener("dangle", (ev) => {
				upThis.dispatchEvent(new MessageEvent(ev.type, {
					"data": targetSocket
				}));
			});
			targetSocket.addEventListener("deadrx", (ev) => {
				upThis.dispatchEvent(new MessageEvent(ev.type, {
					"data": targetSocket
				}));
			});
			targetSocket.addEventListener("deadtx", (ev) => {
				upThis.dispatchEvent(new MessageEvent(ev.type, {
					"data": targetSocket
				}));
			});
			targetSocket.addEventListener("closerx", (ev) => {
				upThis.dispatchEvent(new MessageEvent(ev.type, {
					"data": targetSocket
				}));
			});
			targetSocket.addEventListener("closetx", (ev) => {
				upThis.dispatchEvent(new MessageEvent(ev.type, {
					"data": targetSocket
				}));
			});
			targetSocket.addEventListener("close", (ev) => {
				upThis.dispatchEvent(new MessageEvent(ev.type, {
					"data": targetSocket
				}));
			});
			targetSocket.addEventListener("shutdown", (ev) => {
				upThis.#socketPairs[newId] = closedSocket;
			});
		};
		switch (req.method) {
			case "GET":
			case "get": {
				// Send-only
				// The response should be one of the event socket's response streams
				if (existingId) {
					targetSocket.useCustomExt(true);
				};
				return {
					"untilRespond": Promise.resolve(),
					"response": targetSocket.newResponse()
				};
				break;
			};
			case "POST":
			case "post":
			case "PUT":
			case "put":
			case "PATCH":
			case "patch": {
				// Receive-only
				switch (connType) {
					case "eventSocket": {
						// Should only reply when the client send stream is closed
						return {
							"untilRespond": targetSocket.attachRequest(req),
							"response": new Response("Client socket send complete", {
								status: 200,
								headers: successHeaders
							})
						};
						break;
					};
					case "grpc": {
						// Can immediately reply
						return {
							"untilRespond": Promise.resolve(),
							"response": new Response("Client gRPC send complete", {
								status: 200,
								headers: successHeaders
							})
						};
						break;
					};
				};
				break;
			};
			default: {
				// Error out
				return {
					"untilRespond": Promise.resolve(),
					"response": new Response("Unknown method", {
						status: 405,
						headers: commonHeaders
					})
				};
			};
		};
	};
};

export default EventSocketHandler;
