// Copyright 2024 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

"use strict";

import MiniSignal from "../../libs/twinkle/miniSignal.mjs";

import ServerEvents from "../client/index.mjs";
import {Loaf} from "../../libs/bread/bread.mjs";

self.debugMode = 1;

const ovm43 = Loaf.use("ovm43", {noInit: true}),
u8Enc = new TextEncoder();

let sUrl = Deno.args[0];
let lPort = parseInt(Deno.args[1]) || 8091;

if (!sUrl) {
	console.error(`Invalid SSE URL.`);
	Deno.exit(0);
};

let tcpServer = Deno.listen({
	"hostname": "127.0.0.1",
	"port": lPort
});
for await (let conn of tcpServer) {
	console.debug(`Connection accepted.`);
	console.debug(`R/W defined.`);
	let miniSig = new MiniSignal();
	let sseClient = new ServerEvents(sUrl);
	sseClient.addEventListener("duplex", () => {
		conn.reader = conn.readable.getReader();
		conn.writer = conn.writable.getWriter();
		miniSig.finish();
	});
	sseClient.addEventListener("message", async ({data}) => {
		let originalData = u8Enc.encode(data);
		let decodedData = new Uint8Array(ovm43.decodeLength(originalData.length));
		ovm43.decodeBytes(originalData, decodedData);
		console.debug(decodedData);
		await conn.writer.write(decodedData);
	});
	await miniSig.wait();
	let resumed = true;
	while (resumed) {
		try {
			console.debug(`Waiting to read...`);
			let {value, done} = await conn.reader.read();
			console.debug(`Incoming data read.`);
			resumed = !done;
			if (value) {
				let encodedData = new Uint8Array(ovm43.encodeLength(value.length));
				ovm43.encodeBytes(value, encodedData);
				console.debug(encodedData);
				await sseClient.sendDataRaw(encodedData);
			} else if (done) {
				await MiniSignal.sleep(160);
				sseClient.close();
			};
		} catch (err) {
			console.debug(err);
			resumed = false;
		};
	};
};
