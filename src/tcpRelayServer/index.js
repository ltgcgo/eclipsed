// Copyright 2024 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

"use strict";

import EventSocketHandler from "../server/index.mjs";
import MiniSignal from "../../libs/twinkle/miniSignal.mjs";
import {Loaf} from "../../libs/bread/bread.mjs";

self.debugMode = 1;

const ovm43 = Loaf.use("ovm43", {noInit: true}),
u8Enc = new TextEncoder();

let cHostname = Deno.args[0] || "127.0.0.1";
let cPort = parseInt(Deno.args[1]) || 80;
let lPort = parseInt(Deno.args[2]) || 8090;

let testHandler = new EventSocketHandler();
let tcpClientPool = {};
let clientMsgHandler = async function ({data}) {
	let socket = this;
	console.debug(`Message handler: ${socket.id}.`);
	let tcpSocket = tcpClientPool[socket.id];
	if (tcpSocket) {
		// Decode data
		let originalData = u8Enc.encode(data);
		let decodedData = new Uint8Array(ovm43.decodeLength(originalData.length));
		ovm43.decodeBytes(originalData, decodedData);
		console.debug(decodedData);
		// Write data to the TCP socket
		await tcpSocket.writer.write(decodedData);
	} else {
		socket.msgBuffer = socket.msgBuffer || [];
		socket.msgBuffer.push(data);
	};
};
testHandler.addEventListener("connect", async ({data}) => {
	let socket = data;
	socket.addEventListener("message", clientMsgHandler);
	//console.debug(socket.id);
	console.debug(`[ConnMgr]  Establishing a new TCP connection...`);
	tcpClientPool[socket.id] = tcpClientPool[socket.id] || await Deno.connect({
		"hostname": cHostname,
		"port": cPort
	});
	let tcpSocket = tcpClientPool[socket.id];
	tcpSocket.reader = tcpSocket.readable.getReader();
	tcpSocket.writer = tcpSocket.writable.getWriter();
	tcpSocket.setNoDelay(true);
	console.debug(`[ConnMgr]  Adding handlers for TCP connection...`);
	(async () => {
		let resumed = true;
		while (resumed) {
			try {
				console.debug(`Waiting to read response...`);
				let {value, done} = await tcpSocket.reader.read();
				resumed = !done;
				if (value) {
					console.debug(`Incoming response data read.`);
					let encodedData = new Uint8Array(ovm43.encodeLength(value.length));
					ovm43.encodeBytes(value, encodedData);
					console.debug(encodedData);
					socket.sendDataRaw(encodedData);
				} else {
					console.debug(`Incoming response data ended.`);
					socket.close();
				};
			} catch (err) {
				console.debug(err);
				resumed = false;
			};
		};
	})();
	socket.msgBuffer?.forEach((e) => {
		clientMsgHandler.call(socket, {data: e});
	});
});
testHandler.addEventListener("dangle", ({data}) => {
	let socket = data;
	console.debug(`[ConnMgr]  Disconnecting TCP...`);
	socket.removeEventListener("message", clientMsgHandler);
	let tcpSocket = tcpClientPool[socket.id];
	if (tcpSocket) {
		tcpSocket.close();
		delete tcpClientPool[socket.id];
	};
});

Deno.serve({
	"port": lPort,
	"hostname": "127.0.0.1"
}, async (request) => {
	console.debug("[Web Root] Request received.");
	let {untilRespond, response} = testHandler.upgradeEventStream(request);
	console.debug("[Web Root] Stream upgraded.");
	await untilRespond;
	console.debug("[Web Root] Request responded.");
	return response;
});
