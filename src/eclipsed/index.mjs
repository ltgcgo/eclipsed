"use strict";

// Didn't implement a buffering mechanism, meh.

import {CustomEventSource} from "../../libs/lightfelt@ltgcgo/ext/customEvents.js";

const textEncoder = new TextEncoder();
const dataHeader = textEncoder.encode("data: ");
const eventHeader = textEncoder.encode("event: ");
const idHeader = textEncoder.encode("id: ");
const retryHeader = textEncoder.encode("retry: ");
const msgSplit = textEncoder.encode("\n\n");
const lineSplit = textEncoder.encode("\n");

const encodeMap = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-";

// The universal headers!
const commonHeaders = {
	"Server": "Eclipsed",
	"Content-Type": "text/html"
}, sucessHeaders = {
	"Server": "Eclipsed",
	"Content-Type": "text/event-stream",
	"Cache-Control": "no-cache"
};

let hasLineSplit = function (text) {
	return text.contains("\n") || text.contains("\r");
};

let EventSourceServer = class extends CustomEventSource {
	// Constants
	CLOSED = 2;
	CONNECTING = 0;
	OPEN = 1;
	// Variables
	#controller; // The controller object
	#stream; // ReadableStream
	#readyState = 0;
	#queue = [];
	// States
	#sentFirstChunk = false;
	#eventType = "";
	#retryTime = 0;
	#eventId = "";
	get stream() {
		return this.#stream;
	};
	get readyState() {
		return this.#readyState;
	};
	// Methods
	close() {
		this.#readyState = 2;
		this.dispatchEvent("close");
		if (this.#readyState < 2) {
			this.#controller.close();
		};
	};
	#sendChunk(line) {
		([(line) => {
			this.#queue.push(line);
		}, (line) => {
			this.#controller.enqueue(line);
		}, () => {}][this.#readyState])();
	};
	setEvent(ev) {
		if (hasLineSplit(ev)) {
			return;
		};
		if (ev?.constructor == String) {
			this.#eventType = ev;
		};
	};
	setID(id) {
		if (hasLineSplit(id)) {
			return;
		};
		if (id?.constructor == String) {
			this.#eventId = id;
		};
	};
	setRetry(retry) {
		if (retry > 1 && retry < 3600000) {
			this.#retryTime = +retryTime;
		};
	};
	setData(string) {
		if (string?.constructor != String) {
			return;
		};
		// Sends event metadata
		if (!this.#sentFirstChunk) {
			if (this.#retryTime > 0) {
				this.#sendChunk(retryHeader);
				this.#sendChunk(textEncoder.encode(`${this.#retryTime}`));
				this.#sendChunk(lineSplit);
			};
			if (this.#eventType?.length > 0) {
				this.#sendChunk(eventHeader);
				this.#sendChunk(textEncoder.encode(this.#eventType));
				this.#sendChunk(lineSplit);
			};
			if (!(this.#eventId?.length > 0)) {
				while (this.#eventId.length < 24) {
					this.#eventId += encodeMap[Math.floor(Math.random() * 64)];
				};
			};
			this.#sendChunk(idHeader);
			this.#sendChunk(textEncoder.encode(this.#eventId));
			this.#sendChunk(lineSplit);
			this.#sentFirstChunk = true;
		};
		// Normalizes data string
		let normalized = string.replaceAll("\r", "\n");
		normalized = string.replaceAll("\n\n", "\n");
		// Sends data normally
		normalized.split("\n").forEach((e) => {
			this.#sendChunk(dataHeader);
			this.#sendChunk(textEncoder.encode(e));
			this.#sendChunk(lineSplit);
		});
	};
	setCommit() {
		if (this.#sentFirstChunk) {
			this.#sendChunk(lineSplit);
			// Reset params
			this.#sentFirstChunk = false;
			this.#eventType = false;
			this.#eventId = "";
			this.#retryTime = 0;
		} else {
			throw(new Error("No data sent."));
		};
	};
	sendAs = async function (options) {
		this.setRetry(options.retry);
		this.setID(options.id);
		this.setEvent(options.event);
		this.setData(options.data);
		this.setCommit();
	};
	send = async function (data) {
		let encodedData;
		switch (data?.constructor) {
			case Uint8Array:
			case Uint8ClampedArray:
			case Uint16Array:
			case Uint32Array:
			case BigUint64Array:
			case Int8Array:
			case Int16Array:
			case Int32Array:
			case BigInt64Array:
			case Float32Array:
			case Float64Array: {
				encodedData = data;
				break;
			};
			case ArrayBuffer: {
				encodedData = new Uint8Array(data);
				break;
			};
			case String: {
				encodedData = textEncoder.encode(data);
				break;
			};
			case DataView: {
				encodedData = new Uint8Array(data.buffer);
				break;
			};
			case Blob: {
				encodedData = new Uint8Array(await data.arrayBuffer());
				break;
			};
			default: {
				encodedData = textEncoder.encode(JSON.stringify(data));
			};
		};
		if (this.#readyState < 2) {
			this.#sendChunk(dataHeader);
			this.#sendChunk(encodedData);
			this.#sendChunk(msgSplit);
		} else {
			throw(new TypeError("Sending to a closed EventSourceServer."));
		};
	};
	constructor() {
		super();
		let sendStream = new ReadableStream({
			cancel: (reason) => {
				this.close();
			},
			start: (controller) => {
				this.#controller = controller;
				this.#readyState = 1;
				if (this.#queue.length > 0) {
					let queueSize = 0;
					this.#queue.forEach((e) => {
						queueSize += e.length;
						controller.enqueue(e);
					});
				};
				this.#queue = [];
				this.dispatchEvent("open");
			}
		});
		this.#stream = sendStream;
	};
};

let upgradeEventSource = function (request) {
	if (!request.headers.get("Accept").startsWith("text/event-stream")) {
		return {
			response: new Response("Bad request", {
				status: 400,
				statusText: "Bad Request",
				headers: commonHeaders
			})
		};
	};
	let socket = new EventSourceServer();
	return {
		socket,
		response: new Response(socket.stream, {
			headers: sucessHeaders
		})
	};
};

export {
	upgradeEventSource,
	EventSourceServer
};
