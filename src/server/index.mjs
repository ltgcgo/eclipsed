// Copyright 2024 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

"use strict";

import TextEmitter from "../../libs/rochelle/textEmit.mjs";
import MiniSignal from "../../libs/twinkle/miniSignal.mjs";
import {
	genRandB64
} from "./utils.mjs";

const commonHeaders = {
	"Server": "Eclipsed",
	"Content-Type": "text/plain",
	"Cache-Control": "no-cache, no-store",
	"Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, OPTIONS",
	"Access-Control-Allow-Origin": "*"
}, sucessHeaders = {
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

const u8Enc = new TextEncoder();

/*
newrx: a new receive-side connection
newtx: a new send-side connection
connect: a new connection
message: a new message (rcv)
error: errors out
closerx: receive-side closes
closetx: send-side closes
close: both closes
*/

let EventSocket = class extends EventTarget {
	#rootHandler;
	constructor(root) {
		super();
		let upThis = this;
		if (!root) {
			throw(new Error("Invalid event socket root"));
		};
		upThis.#rootHandler = root;
	};
};

let EventSocketHandler = class extends EventTarget {
	static EventSocket = EventSocket;
	#id;
	#socketPairs = {};
	#get(id) {
		return this.#socketPairs[id];
	};
	#getFrom
	constructor() {
		super();
		// CORS should always be allowed
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
					}
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
			}
		};
		let targetSocket;
		let existingId;
		if (req.headers.has("Authorization")) {
			existingId = req.headers.get("Authorization");
			if (existingId.slice(0, 7) != "Bearer ") {
				existingId = undefined;
			};
		} else if (req.headers.has("If-Match")) {
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
		};
		if (!targetSocket) {
			targetSocket = new EventSocket(upThis);
		};
		switch (req.method) {
			case "GET":
			case "get": {
				// Send-only
				// The response should be one of the event socket's response streams
				return {
					"untilRespond": Promise.resolve(),
					"response": new Response("Success", {
						status: 200,
						headers: sucessHeaders
					})
				}
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
							"untilRespond": Promise.resolve(),
							"response": new Response("Client socket send complete", {
								status: 200,
								headers: sucessHeaders
							})
						}
						break;
					};
					case "grpc": {
						// Can immediately reply
						return {
							"untilRespond": Promise.resolve(),
							"response": new Response("Client gRPC send complete", {
								status: 200,
								headers: sucessHeaders
							})
						}
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
				}
			};
		};
	};
};

export default EventSocketHandler;
