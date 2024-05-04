"use strict";

const map = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
let randSrc = new Uint8Array(1);

let genRandB64 = (length) => {
	let result = "";
	while (length > 0) {
		crypto.getRandomValues(randSrc);
		result += map[Math.floor(randSrc[0] & 63)];
		length --;
	};
	return result;
};
let getDebugState = () => {
	return !!self.debugMode;
};
let splitByLine = (text) => {
	return text.replaceAll("\r", "\n").replaceAll("\r\n", "\n").split("\n");
};

export {
	genRandB64,
	getDebugState,
	splitByLine
};
