"use strict";

import EventSocketHandler from "../server/index.mjs";

console.info("This is an Eclipsed demo running on Deno.");

let testHandler = new EventSocketHandler();
testHandler.addEventListener("connecttx", ({data, source}) => {
	console.debug("[HandleTx] Established a new send socket.");
	let socket = data;
	let task = setInterval(() => {
		socket.send("The deer is always horny!");
		socket.send("Polak is cute!\nResistance is futile!", "truth");
	}, 1000);
	socket.addEventListener("closetx", () => {
		clearInterval(task);
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
