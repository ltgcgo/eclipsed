"use strict";

let tcpServer = Deno.listen({
	"hostname": "127.0.0.1",
	"port": 8092
});
for await (let conn of tcpServer) {
	console.debug(`Connection accepted.`);
	conn.reader = conn.readable.getReader();
	conn.writer = conn.writable.getWriter();
	let resumed = true;
	while (resumed) {
		try {
			console.debug(`Waiting to read...`);
			let {value, done} = await conn.reader.read();
			resumed = !done;
			if (value) {
				console.debug(`Incoming data read.`);
				conn.writer.write(value);
			} else {
				console.debug(`Incoming data ended.`);
			};
		} catch (err) {
			console.debug(err);
			resumed = false;
		};
	};
};
