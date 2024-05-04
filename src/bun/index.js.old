"use strict";

import {
	upgradeEventSource,
	EventSourceServer
} from "../server/index.mjs";

console.info("This is an Eclipsed demo running on Bun.");

let bunServer = Bun.serve({
	fetch: function (request) {
		let {socket, response} = upgradeEventSource(request);
		let cycles = setInterval(() => {
			if (socket?.readyState == 1) {
				socket.send("Test heartbeat.");
			};
		}, 100);
		socket?.send("Connection has opened!");
		socket?.addEventListener("close", function () {
			clearInterval(cycles);
		});
		return response;
	}
});
