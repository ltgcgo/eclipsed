"use strict";

import {
	upgradeEventSource,
	EventSourceServer
} from "../eclipsed/index.mjs";

serve((request) => {
	let {socket, response} = upgradeEventSource(request);
	let cycles = setInterval(() => {
		if (socket?.readyState == 1) {
			socket.send("Test heartbeat.");
			console.debug(socket?.readyState);
		} else {
			console.debug("Closed event source.");
			socket?.close();
			clearInterval(cycles);
		};
	}, 1000);
	return response;
});
