"use strict";

import EventSocketHandler from "../server/index.mjs";

console.info("This is an Eclipsed demo running on Deno.");

let testHandler = new EventSocketHandler();

Deno.serve({
	"port": 8090,
	"hostname": "127.0.0.1"
}, async (request) => {
	console.debug("[Web root] Request received.");
	let {untilRespond, response} = testHandler.upgradeEventStream(request);
	console.debug("[Web root] Stream upgraded.");
	await untilRespond;
	console.debug("[Web root] Request responded.");
	return response;
});
