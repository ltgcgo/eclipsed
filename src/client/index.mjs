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

const maxRetries = 3,
retryDelayMs = 3000,
retryMinDelayMs = 200,
duplexStreamSendTimeout = 2500, // How long to consider an EventSocket strean to be a streamed duplex
chunkedSendInterval = 500, // When the send socket is chunked, how long to wait when frames of data is sent
chunkedSendTimeout = 20000; // When the send socket is chunked, how long to wait for the first frame of data, and how long to wait to establish a new send socket

self.debugMode = 1;

const u8Enc = new TextEncoder();
const u8HeadData = u8Enc.encode("data: ");

let ServerEvents = class extends EventTarget {
	// Read-only section
	CONNECTING = 0;
	OPEN = 1;
	CLOSED = 2;
	PROBING = 1;
	TRUE = 2;
	FALSE = 0;
	// Internal scetion
	#readyState = 0;
	#url = "";
	#withCredentials = false;
	#lastEventId;
	#signal;
	#retry = retryDelayMs;
	#requests = [];
	#isStreamedSend = 1; // Indicates streamed send being impossible when false
	#isEclipsedExt = false;
	#duplexLatency = 0;
	#socketId;
	get readyState() {
		return this.#readyState;
	};
	get url() {
		return this.#url;
	};
	get withCredentials() {
		return this.#withCredentials;
	};
	get lastEventId() {
		return this.#lastEventId;
	};
	// Private section
	// Customizable section
	fetch;
	headers = {};
	redirect = "follow";
	referer;
	refererPolicy = "no-referrer-when-downgrade";
	acceptDuplex = false; // Set to true to allow duplex connections
	pingInterval = 30000;
	close() {
		this.#readyState = 2;
		this.#signal.abort();
	};
	constructor(url, opt = {}) {
		super();
		let upThis = this;
		// Load parameters
		if (!url) {
			throw(new SyntaxError("Invalid URL"));
		};
		let urlObject;
		try {
			urlObject = new URL(url);
		} catch (err) {
			throw(new SyntaxError("Invalid URL"));
		};
		upThis.#signal = new AbortController();
		upThis.#url = url;
		upThis.#withCredentials = opt.withCredentials || upThis.#withCredentials;
		upThis.headers = opt.headers || upThis.headers;
		upThis.redirect = opt.redirect || upThis.redirect;
		upThis.referer = opt.referer || upThis.referer;
		upThis.refererPolicy = opt.refererPolicy || upThis.refererPolicy;
		upThis.fetch = opt.fetch || self.fetch;
		upThis.acceptDuplex = opt.acceptDuplex || upThis.acceptDuplex;
		// Headers
		upThis.headers["Accept"] = upThis.headers["Accept"] || "text/event-stream";
		upThis.headers["Cache-Control"] = upThis.headers["Cache-Control"] || "no-store";
		// Connection management
		let retry = 0;
		(async () => {
			while (upThis.#readyState < 2 && retry < 3) {
				try {
					//console.debug(`SSE connecting...`);
					upThis.dispatchEvent(new Event("connecting"));
					let headers = structuredClone(upThis.headers);
					if (upThis.#lastEventId) {
						headers["Last-Event-ID"] = upThis.#lastEventId;
					} else {
						if (headers["Last-Event-ID"]) {
							delete headers["Last-Event-ID"];
						};
					};
					if (upThis.#isEclipsedExt) {
						if (upThis.#socketId) {
							headers["If-Match"] = `W/${upThis.#socketId}`;
						};
					};
					let miniSig = new MiniSignal();
					let dialer = await upThis.fetch(upThis.#url, {
						"method": "GET",
						"cache": "no-store",
						"credentials": upThis.#withCredentials ? "include" : "omit",
						"priority": "high",
						"signal": upThis.#signal.signal,
						"headers": upThis.headers,
						"redirect": upThis.redirect,
						"referer": upThis.referer,
						"refererPolicy": upThis.refererPolicy
					});
					if (dialer.status == 200) {
						//console.debug(`SSE connected.`);
						upThis.#readyState = upThis.OPEN;
						upThis.dispatchEvent(new Event("open"));
						retry = 0;
						if (dialer.headers.has("ETag")) {
							upThis.#socketId = dialer.headers.get("ETag")?.replace("W/", "");
						};
						let lineReader = new TextEmitter(dialer.body, 0, "utf-8");
						let eventType, dataRope = "";
						lineReader.addEventListener("text", ({data}) => {
							//console.debug(data);
							let colonIndex = data?.indexOf(":");
							if (!data?.trim()?.length) {
								//console.debug(`Emitting event...`);
								if (dataRope) {
									//console.debug(`Type: ${eventType || "message"}`);
									//console.debug(`Data: ${dataRope}`);
									upThis.dispatchEvent(new MessageEvent(eventType || "message", {
										"data": dataRope,
										"origin": upThis.#url,
										"lastEventId": upThis.#lastEventId
									}));
									//console.debug(`Event "${eventType || "message"}" emitted. Data length: ${dataRope.length}.`);
									eventType = undefined;
									dataRope = "";
									upThis.#lastEventId = undefined;
								} else {
									//console.debug(`Nothing to emit.`);
								};
							} else if (data.codePointAt(0) == 58) {
								//console.debug(`Line ignored: commented out.`);
								if (data.indexOf("eclipsed:") == 1) {
									upThis.dispatchEvent(new MessageEvent("eclipsedext", {
										"data": data.slice(10),
										"origin": upThis.#url,
										"lastEventId": upThis.#lastEventId
									}));
								};
							} else if (colonIndex > -1) {
								let field = data.slice(0, colonIndex);
								let valueStart = colonIndex + 1;
								if (data.codePointAt(colonIndex + 1) == 32) {
									valueStart ++;
								};
								let value = data.slice(valueStart);
								switch (field) {
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
									case "id": {
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
									};
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
						});
						await miniSig.wait();
						//console.debug(`SSE server closed.`);
						upThis.#readyState = upThis.CONNECTING;
						await MiniSignal.sleep(Math.max(upThis.#retry, retryDelayMs));
					} else {
						//console.debug(`SSE rejected.`);
						//console.debug(dialer);
						upThis.dispatchEvent(new ErrorEvent("error", {
							message: dialer.statusText
						}));
						upThis.dispatchEvent(new Event("disconnect"));
						upThis.dispatchEvent(new Event("close"));
						upThis.#readyState = 2;
					};
				} catch (err) {
					// Handle network error
					//console.debug(err);
					//self.connError = err;
					switch (err.name) {
						case "AbortError": {
							//console.debug(`SSE closed from client side.`);
							upThis.#readyState = 2;
							retry = maxRetries;
							upThis.dispatchEvent(new Event("disconnect"));
							upThis.dispatchEvent(new Event("close"));
							break;
						};
						case "NotAllowedError": {
							//console.debug(`SSE client not allowed.`);
							upThis.#readyState = 2;
							retry = maxRetries;
							upThis.dispatchEvent(new ErrorEvent("error", {
								message: err.message,
								error: err
							}));
							upThis.dispatchEvent(new Event("disconnect"));
							upThis.dispatchEvent(new Event("close"));
							break;
						};
						case "TypeError": {
							if (err.message.indexOf("connection") > -1) {
								//console.debug(`SSE client network error.`);
								retry ++;
								if (retry > maxRetries) {
									//console.debug(`SSE client connection failed.`);
									upThis.#readyState = 2;
									upThis.dispatchEvent(new ErrorEvent("error", {
										message: err.message,
										error: err
									}));
									upThis.dispatchEvent(new Event("disconnect"));
									upThis.dispatchEvent(new Event("close"));
								} else {
									//console.debug(`SSE client retrying...`);
									await MiniSignal.sleep(upThis.#retry);
									//console.debug(`SSE client restarting...`);
								};
							} else {
								//console.debug(`SSE client type error.`);
								upThis.#readyState = 2;
								retry = maxRetries;
								upThis.dispatchEvent(new ErrorEvent("error", {
									message: err.message,
									error: err
								}));
								upThis.dispatchEvent(new Event("disconnect"));
								upThis.dispatchEvent(new Event("close"));
							};
							break;
						};
					};
				};
			};
		})();
		// Duplex test
		let pingChallenges = {};
		let pingFunc = async () => {
			let currentChallenge = genRandB64(16);
			pingChallenges[currentChallenge] = Date.now();
			getDebugState() && console.debug(`[Eclipsed] Sending SYN`);
			await upThis.sendComment(`eclipsed:syn\t${currentChallenge}`);
			//console.debug(`[Eclipsed] Extension sent`);
		};
		upThis.addEventListener("eclipsedext", async ({data}) => {
			let extDesc = data.split("\t");
			let timeNow = Date.now();
			getDebugState() && console.debug(`[Eclipsed] Extension: ${extDesc}`);
			try {
				switch (extDesc[0]) {
					case "new": {
						upThis.#isEclipsedExt = true;
						//console.debug(`[Eclipsed] Send prepare`);
						await upThis.#prepareSend();
						//console.debug(`[Eclipsed] Ping prepare`);
						await pingFunc();
						//console.debug(`[Eclipsed] Connect duplex`);
						upThis.dispatchEvent(new Event("duplex"));
						break;
					};
					case "synack": {
						let currentChallenge = extDesc[1];
						let pingStart = pingChallenges[currentChallenge];
						if (pingStart) {
							let rttDelay = timeNow - pingStart;
							if (rttDelay < duplexStreamSendTimeout) {
								upThis.#isStreamedSend = 2;
								getDebugState() && console.debug(`[Eclipsed] Connection ${upThis.#socketId} is streamed (${rttDelay}ms).`);
							} else {
								upThis.#isStreamedSend = 0;
								getDebugState() && console.debug(`[Eclipsed] Connection ${upThis.#socketId} is chunked (${rttDelay}ms).`);
							};
							delete pingChallenges[currentChallenge];
							upThis.#duplexLatency = rttDelay;
							await upThis.sendComment(`eclipsed:ack\t${currentChallenge}`);
						};
						break;
					};
					default: {
						console.debug(`[Eclipsed] Unmatched extension: ${extDesc}`);
					};
				};
			} catch (err) {
				console.debug(err);
			};
		});
		/*let test = setInterval(() => {
			console.debug(upThis.#requests);
		}, 1000);*/
		(async () => {
			while (upThis.#readyState != 2) {
				await MiniSignal.sleep(upThis.pingInterval);
				if (upThis.#readyState == 1) {
					await pingFunc();
				};
			};
		})();
	};
	get duplexLatency() {
		return this.#duplexLatency;
	};
	get socketId() {
		let upThis = this;
		if (upThis.#isEclipsedExt) {
			return upThis.#socketId || upThis.#lastEventId.splice(".")[0];
		};
	};
	async #prepareSend(scheduledTask) {
		let upThis = this;
		if (upThis.#readyState == upThis.CLOSED) {
			return;
		};
		if (scheduledTask || upThis.#requests.length < 1) {
			if (upThis.readyState == upThis.CONNECTING) {
				await MiniSignal.sleep(upThis.#retry);
			};
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
						let reqIdx = upThis.#requests.indexOf(pushArr);
						if (reqIdx >= 0) {
							upThis.#requests.splice(reqIdx, 1);
						};
						upThis.#prepareSend();
					} else {
						shouldPush = false;
					};
				}
			});
			let headers = structuredClone(upThis.headers);
			headers["If-Match"] = `W/${upThis.socketId}`;
			let req = new Request(upThis.#url, {
				"body": source,
				"method": "POST",
				"cache": "no-store",
				"credentials": upThis.#withCredentials ? "include" : "omit",
				"priority": "high",
				"signal": upThis.#signal.signal,
				"headers": headers,
				"redirect": upThis.redirect,
				"referer": upThis.referer,
				"refererPolicy": upThis.refererPolicy
			});
			await miniSig.wait();
			upThis.fetch(req);
			pushArr = [req, controller];
			if (shouldPush) {
				upThis.#requests.push(pushArr);
				getDebugState() && console.debug(`[Eclipsed] Created send socket.`);
			};
		};
		//console.debug(`[Eclipsed] Skipped send socket creation.`);
		return;
	};
	#getRequest() {
		let upThis = this;
		if (upThis.#requests.length) {
			return upThis.#requests[0];
		};
	};
	async sendEvent(ev = "message", noPrepareSend) {
		let upThis = this;
		if (upThis.#readyState == upThis.CLOSED) {
			throw(new Error(`Tried to send data through a closed socket`));
		};
		if (!noPrepareSend) {
			await upThis.#prepareSend();
		};
		errorWithControl(ev);
		upThis.#getRequest()[1].enqueue(u8Enc.encode(`event: ${ev}\n`));
	};
	async sendData(ev, noPrepareSend) {
		let upThis = this;
		if (upThis.#readyState == upThis.CLOSED) {
			throw(new Error(`Tried to send data through a closed socket`));
		};
		if (!noPrepareSend) {
			await upThis.#prepareSend();
		};
		splitByLine(ev).forEach((e) => {
			upThis.#getRequest()[1].enqueue(u8Enc.encode(`data: ${e}\n`));
		});
	};
	async sendDataRaw(ev, noPrepareSend) {
		let upThis = this;
		if (upThis.#readyState == upThis.CLOSED) {
			throw(new Error(`Tried to send data through a closed socket`));
		};
		if (!noPrepareSend) {
			await upThis.#prepareSend();
		};
		// Only UTF-8-encoded byte sequences are allowed
		if (!ev?.byteLength || ev.byteLength != 1) {
			throw(new TypeError("Only Uint8Array is accepted"));
		};
		let lastPtr = 0, committed = false;
		for (let ptr = 0; ptr < ev.length; ptr ++) {
			let e = ev[ptr];
			switch (e) {
				case 10:
				case 13: {
					if (!committed) {
						upThis.#getRequest()[1].enqueue(u8HeadData);
						upThis.#getRequest()[1].enqueue(ev.subarray(lastPtr, ptr));
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
			upThis.#getRequest()[1].enqueue(u8HeadData);
			upThis.#getRequest()[1].enqueue(ev.subarray(lastPtr, ptr));
		};
	};
	async sendComment(ev, noPrepareSend) {
		let upThis = this;
		if (upThis.#readyState == upThis.CLOSED) {
			throw(new Error(`Tried to send data through a closed socket`));
		};
		if (!noPrepareSend) {
			await upThis.#prepareSend();
		};
		splitByLine(ev).forEach((e) => {
			upThis.#getRequest()[1].enqueue(u8Enc.encode(`:${e}\n`));
		});
	};
	async sendFlush(noPrepareSend) {
		let upThis = this;
		if (upThis.#readyState == upThis.CLOSED) {
			throw(new Error(`Tried to send data through a closed socket`));
		};
		if (!noPrepareSend) {
			await upThis.#prepareSend();
		};
		upThis.#getRequest()[1].enqueue(u8Enc.encode(`\n`));
	};
	async send(text, eventType) {
		let upThis = this;
		await upThis.#prepareSend();
		if (eventType) {
			upThis.sendEvent(eventType, true);
		};
		upThis.sendData(text, true);
		upThis.sendFlush(true);
	};
};

export default ServerEvents;
