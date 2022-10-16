"use strict";

// Didn't implement a buffering mechanism, meh.

import {CustomEventSource} from "../../libs/lightfelt@ltgcgo/ext/customEvents.js";

const textEncoder = new TextEncoder();
const msgHeader = textEncoder.encode("data: ");
const msgSplit = textEncoder.encode("\r\n\r\n");

// The universal headers!
const commonHeaders = {
	"Server": "Eclipsed",
	"Content-Type": "text/html"
}, sucessHeaders = {
	"Server": "Eclipsed",
	"Content-Type": "text/event-stream",
	"Cache-Control": "no-cache"
};

let EventSourceServer = class extends CustomEventSource {
	// Constants
	CLOSED = 2;
	CONNECTING = 0;
	OPEN = 1;
	// Variables
	#controller; // The controller object
	#stream;
	#copiedStream; // ReadableStream
	#readyState = 0;
	#queue = [];
	get stream() {
		return this.#copiedStream;
	};
	get readyState() {
		return this.#readyState;
	};
	// Methods
	close() {
		console.debug("Closing stream.");
		if (this.#readyState < 2) {
			this.#controller.close();
		};
		this.#readyState = 2;
		this.dispatchEvent("close");
	};
	send = async function (data) {
		let encodedData;
		switch (data.constructor) {
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
		if (this.#readyState == 1) {
			this.#controller.enqueue(msgHeader);
			this.#controller.enqueue(encodedData);
			this.#controller.enqueue(msgSplit);
		} else {
			this.#queue.push(encodedData);
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
						controller.enqueue(msgSplit);
					});
					console.debug(`Sent ${this.#queue.length} messages in queue, ${queueSize} bytes in total.`);
				} else {
					console.debug(`Nothing to pull from queue.`);
				};
				this.#queue = [];
				this.dispatchEvent("open");
			}
		});
		this.#stream = sendStream;
		let sentStream = sendStream.tee();
		let altReader = sentStream[1].getReader();
		altReader.closed.then(() => {
			this.close();
		});
		this.#copiedStream = sentStream[0];
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
