#!/bin/bash
cd build
#cd ..
case "$1" in
	"deno")
		denoServe -p 8010
		;;
	"denoNext")
		LISTEN_PORT=8010 LISTEN_ADDR=127.0.0.1 GRACE_JAIL=1 deno run --allow-read --allow-run ../deno/grace/grace.mjs
		;;
	*)
		python3 -m http.server 8010
		;;
esac
exit