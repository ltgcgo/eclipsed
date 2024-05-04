"use strict";

import EventSocketHandler from "../server/index.mjs";

console.info("This is an Eclipsed demo running on Deno.");

self.debugMode = 1;

let testHandler = new EventSocketHandler();
testHandler.addEventListener("connecttx", ({data, source}) => {
	//console.debug("[HandleTx] Established a new send socket.");
	let socket = source;
	//console.debug(socket);
	let task = setInterval(() => {
		socket.send("The deer is not always horny.");
		socket.send("Polak is cute!\nResistance is futile!", "truth");
	}, 1000);
	socket.addEventListener("closetx", () => {
		clearInterval(task);
	});
});
testHandler.addEventListener("connectrx", ({data, source}) => {
	let socket = source;
	socket.addEventListener("message", ({data}) => {
		console.debug(`[Web Root] Message received: ${data}`);
	});
});

Deno.serve({
	"port": 8090,
	"hostname": "127.0.0.1"
}, async (request) => {
	console.debug("[Web Root] Request received.");
	let {untilRespond, response} = testHandler.upgradeEventStream(request);
	console.debug("[Web Root] Stream upgraded.");
	await untilRespond;
	console.debug("[Web Root] Request responded.");
	return response;
});
