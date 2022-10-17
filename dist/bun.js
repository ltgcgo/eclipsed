"use strict";(()=>{var i=class{#e={};addEventListener(e,t){this.#e[e]||(this.#e[e]=[]),this.#e[e].unshift(t)}removeEventListener(e,t){if(this.#e[e]){let s=this.#e[e].indexOf(t);s>-1&&this.#e[e].splice(s,1),this.#e[e].length<1&&delete this.#e[e]}}dispatchEvent(e,t){let s=new Event(e),n=this;s.data=t,this.#e[e]?.length>0&&this.#e[e].forEach(function(u){u?.call(n,s)}),this[`on${e}`]&&this[`on${e}`](s)}};var r=new TextEncoder,a=r.encode("data: "),c=r.encode(`\r
\r
`),h={Server:"Eclipsed","Content-Type":"text/html"},l={Server:"Eclipsed","Content-Type":"text/event-stream","Cache-Control":"no-cache"},d=class extends i{CLOSED=2;CONNECTING=0;OPEN=1;#e;#n;#t=0;#s=[];get stream(){return this.#n}get readyState(){return this.#t}close(){this.#t=2,this.dispatchEvent("close"),this.#t<2&&this.#e.close()}send=async function(e){let t;switch(e.constructor){case Uint8Array:case Uint8ClampedArray:case Uint16Array:case Uint32Array:case BigUint64Array:case Int8Array:case Int16Array:case Int32Array:case BigInt64Array:case Float32Array:case Float64Array:{t=e;break}case ArrayBuffer:{t=new Uint8Array(e);break}case String:{t=r.encode(e);break}case DataView:{t=new Uint8Array(e.buffer);break}case Blob:{t=new Uint8Array(await e.arrayBuffer());break}default:t=r.encode(JSON.stringify(e))}if(this.#t==1)this.#e.enqueue(a),this.#e.enqueue(t),this.#e.enqueue(c);else if(this.#t==0)this.#s.push(t);else throw new TypeError("Sending to a closed EventSourceServer.")};constructor(){super();let e=new ReadableStream({cancel:t=>{this.close()},start:t=>{if(this.#e=t,this.#t=1,this.#s.length>0){let s=0;this.#s.forEach(n=>{s+=n.length,t.enqueue(a),t.enqueue(n),t.enqueue(c)})}this.#s=[],this.dispatchEvent("open")}});this.#n=e}},o=function(e){if(!e.headers.get("Accept").startsWith("text/event-stream"))return{response:new Response("Bad request",{status:400,statusText:"Bad Request",headers:h})};let t=new d;return{socket:t,response:new Response(t.stream,{headers:l})}};console.info("This is an Eclipsed demo running on Bun.");var A=Bun.serve({fetch:function(e){let{socket:t,response:s}=o(e),n=setInterval(()=>{t?.readyState==1&&t.send("Test heartbeat.")},100);return t?.send("Connection has opened!"),t?.addEventListener("close",function(){clearInterval(n)}),s}});})();
