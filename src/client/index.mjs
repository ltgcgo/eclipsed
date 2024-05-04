// Copyright 2024 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

"use strict";

import TextEmitter from "../../libs/rochelle/textEmit.mjs";
import MiniSignal from "../../libs/twinkle/miniSignal.mjs";

const maxRetries = 3,
retryDelayMs = 3000,
retryMinDelayMs = 200;

const u8Enc = new TextEncoder();
const u8HeadData = u8Enc.encode("data: ");

let ServerEvents = class extends EventTarget {
	// Read-only section
	#readyState = 0;
	#url = "";
	#withCredentials = false;
	#lastEventId;
	#signal;
	#retry = retryDelayMs;
	CONNECTING = 0;
	OPEN = 1;
	CLOSED = 2;
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
	acceptDuplex = false;
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
					if (upThis.#lastEventId) {
						upThis.headers["Last-Event-ID"] = upThis.#lastEventId;
					} else {
						if (upThis.headers["Last-Event-ID"]) {
							delete upThis.headers["Last-Event-ID"];
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
						upThis.dispatchEvent(new Event("open"));
						retry = 0;
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
	};
};

export default ServerEvents;
