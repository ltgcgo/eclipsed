"use strict";let m=["utf-8","utf-16","utf-16be"],A=class extends EventTarget{static SPLIT_UTF_8=0;static SPLIT_UTF_16_LE=1;static SPLIT_UTF_16_BE=2;#n;#e;constructor(e,t=0){if(super(),t?.constructor!=Number||t<0||t>=m.length)throw new TypeError("Invalid split mode");if(t)throw new Error("UTF-16LE/BE currently not implemented");if(!e||e?.constructor!=ReadableStream)throw new TypeError("Not a readable stream");this.#n=e;let o=e.getReader();this.#e=new TextDecoder(m[t],{fatal:!0});let r=!0,n=!0,s;(async()=>{for(o.closed.then(()=>{s&&(this.dispatchEvent(new MessageEvent("raw",{data:s})),s=void 0),this.dispatchEvent(new Event("close")),n=!1}).catch(i=>{s&&(this.dispatchEvent(new MessageEvent("raw",{data:s})),s=void 0),this.dispatchEvent(new ErrorEvent("error",{message:i.message,error:i})),this.dispatchEvent(new Event("close")),n=!1});r&&n;)try{let i=await o.read();if(r=!i.done,r){let a=i.value;if(this.dispatchEvent(new MessageEvent("chunk",{data:a})),a.constructor!=Uint8Array&&a.constructor!=Uint8ClampedArray)this.dispatchEvent(new MessageEvent("fail",{data:a}));else{let c=0,l=0,g=0,u=!1;for(let d=0;d<a.length;d++){switch(a[d]){case 10:{g==13?c++:(u=!0,l=d);break}case 13:{u=!0,l=d;break}default:u=!1}if(u){let h=a.subarray(c,l),p=h;s&&(p=new Uint8Array(s.length+h.length),p.set(s),p.set(h,s.length),s=void 0),this.dispatchEvent(new MessageEvent("raw",{data:p}));try{let C=this.#e.decode(p);this.dispatchEvent(new MessageEvent("text",{data:C}))}catch{this.dispatchEvent(new MessageEvent("fail",{data:p}))}c=d+1,u=!1}g=a[d]}if(!u)if(s){let d=a.subarray(c),h=new Uint8Array(s.length+d.length);h.set(s),h.set(d,s.length),s=h}else c<a.length&&(s=a.subarray(c))}}else s&&(this.dispatchEvent(new MessageEvent("raw",{data:s})),s=void 0),this.dispatchEvent(new Event("close"))}catch(i){s&&(this.dispatchEvent(new MessageEvent("raw",{data:s})),s=void 0),this.dispatchEvent(new ErrorEvent("error",{message:i.message,error:i})),this.dispatchEvent(new Event("close"))}})()}},x=A;let S=class extends EventTarget{static sleep(e){return new Promise(t=>{self.AbortSignal?AbortSignal.timeout(e).addEventListener("abort",t):setTimeout(t,e)})}#n;#e;#t=!1;get finished(){return this.#t}finish(){this.#t=!0,this.#e&&this.#e()}wait(){if(!this.#t)return this.#n}constructor(){super(),this.#n=new Promise(e=>{this.#e=()=>{this.#t=!0,e()}})}},v=S;let M="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_",T=new Uint8Array(1),b=e=>{let t="";for(;e>0;)crypto.getRandomValues(T),t+=M[Math.floor(T[0]&63)],e--;return t};let w={Server:"Eclipsed","Content-Type":"text/plain","Cache-Control":"no-cache, no-store","Access-Control-Allow-Methods":"GET, POST, PUT, PATCH, OPTIONS","Access-Control-Allow-Origin":"*"},f={Server:"Eclipsed","Content-Type":"text/event-stream","Cache-Control":"no-cache, no-store",Vary:"Authorization, If-Match, Last-Event-ID","Access-Control-Allow-Headers":"Authorization, Accept, Cache-Control, If-Match, Last-Event-ID","Access-Control-Allow-Methods":"GET, POST, PUT, PATCH, OPTIONS","Access-Control-Allow-Origin":"*"},E=new TextEncoder,R=E.encode("data: ");let y=e=>e.replaceAll("\r",`
`).replaceAll(`\r
`,`
`).split(`
`),L=(e,t)=>{for(let o=0;o<e.length;o++)if(e.charCodeAt(o)<32&&(o!=10&&o!=13||!t))throw new RangeError("Control characters are not allowed")},k=class extends EventTarget{#n;#e=[];#t=[];#a;#h=!1;#d=0;#s=0;#i=0;#c=0;#l=!1;CLOSED=0;OPEN=3;TX_OPEN=1;RX_OPEN=2;#o=!1;shutdownTimeout=15e3;#r(){let e=this;e.#e.length>e.#i?(console.debug("[Eclipsed] New Rx"),e.dispatchEvent(new Event("newrx"))):e.#e.length<e.#i&&(console.debug("[Eclipsed] Dead Rx"),e.dispatchEvent(new Event("deadrx"))),e.#t.length>e.#c?(console.debug("[Eclipsed] New Tx"),e.dispatchEvent(new Event("newtx"))):e.#t.length<e.#c&&(console.debug("[Eclipsed] Dead Tx"),e.dispatchEvent(new Event("deadtx"))),console.debug(`[Eclipsed] Receive sockets: ${e.#e.length}`),console.debug(`[Eclipsed] Send sockets: ${e.#t.length}`),console.debug(`[Eclipsed] Old state: ${e.#s}`);let t=0;if(e.#t.length&&(t|=1),e.#e.length&&(t|=2),t!=e.#s){switch(t){case 0:{switch(console.debug("[Eclipsed] Close all"),e.dispatchEvent(new Event("close")),e.#s){case 1:{console.debug("[Eclipsed] Close Tx"),e.dispatchEvent(new Event("closetx"));break}case 2:{console.debug("[Eclipsed] Close Rx"),e.dispatchEvent(new Event("closerx"));break}}break}case 3:{console.debug("[Eclipsed] Connect duplex"),e.dispatchEvent(new Event("connect"));break}case 1:{switch(e.#s){case 0:{console.debug("[Eclipsed] Connect Tx"),e.dispatchEvent(new Event("connecttx"));break}case 3:{console.debug("[Eclipsed] Close Rx"),e.dispatchEvent(new Event("closerx")),console.debug("[Eclipsed] No duplex"),e.dispatchEvent(new Event("dangle"));break}}break}case 2:{switch(e.#s){case 0:{console.debug("[Eclipsed] Connect Rx"),e.dispatchEvent(new Event("connectrx"));break}case 3:{console.debug("[Eclipsed] Close Tx"),e.dispatchEvent(new Event("closetx")),console.debug("[Eclipsed] No duplex"),e.dispatchEvent(new Event("dangle"));break}}break}}e.#s=t}console.debug(`[Eclipsed] New state: ${e.#s}`),e.#i=e.#e.length,e.#c=e.#t.length}get id(){return this.#a}get readyState(){return this.#s}getRequest(){let e=this;if(e.#e.length)return e.#e[0]}getResponse(){let e=this;if(e.#t.length)return e.#t[0]}sendEvent(e="message"){if(this.#o)throw new Error("Tried to send data through a closed socket");L(e),this.getResponse()[1].enqueue(E.encode(`event: ${e}
`))}sendData(e){if(this.#o)throw new Error("Tried to send data through a closed socket");y(e).forEach(t=>{this.getResponse()[1].enqueue(E.encode(`data: ${t}
`))})}sendDataRaw(e){let t=this;if(t.#o)throw new Error("Tried to send data through a closed socket");if(!e?.byteLength||e.byteLength!=1)throw new TypeError("Only Uint8Array is accepted");let o=0,r=!1;for(let n=0;n<e.length;n++){let s=e[n];switch(s){case 10:case 13:r||(t.getResponse()[1].enqueue(R),t.getResponse()[1].enqueue(e.subarray(o,n)),r=!0),o=n+1;default:s<32&&(e[n]=32),r=!1}}r||(t.getResponse()[1].enqueue(R),t.getResponse()[1].enqueue(e.subarray(o,ptr)))}sendComment(e){if(this.#o)throw new Error("Tried to send data through a closed socket");y(e).forEach(t=>{this.getResponse()[1].enqueue(E.encode(`:${t}
`))})}sendFlush(){if(this.#o)throw new Error("Tried to send data through a closed socket");let e=this;e.#l?e.getResponse()[1].enqueue(E.encode(`
`)):e.getResponse()[1].enqueue(E.encode(`id: ${e.#a}.${e.#d}

`)),e.#d++}send(e,t){let o=this;t&&o.sendEvent(t),o.sendData(e),o.sendFlush()}useCustomExt(e){console.debug("[Eclipsed] Connection supports Eclipsed custom extensions."),this.#l=e}close(){let e=this;for(console.debug(`[Eclipsed] Closing down the socket: ${e.#a}...`);e.#e.length>0;)e.#e[0].cancel(),e.#e.splice(0,1);for(;e.#t.length>0;)e.#t[0][1].close(),e.#t.splice(0,1);e.#r()}attachRequest(e){let t=this;this.#e.push(e),t.#r(),t.useCustomExt(!0);let o=new v,r=new x(e.body,0,"utf-8"),n,s="";return r.addEventListener("text",({data:i})=>{let a=i?.indexOf(":");if(!i?.trim()?.length)s&&(t.dispatchEvent(new MessageEvent(n||"message",{data:s})),n=void 0,s="");else if(i.codePointAt(0)!=58){if(a>-1){let c=i.slice(0,a),l=a+1;i.codePointAt(a+1)==32&&l++;let g=i.slice(l);switch(c){case"event":{n=g;break}case"data":{s.length&&(s+=`
`),s+=g;break}default:}}}}),r.addEventListener("close",()=>{o.finish();let i=t.#e.indexOf(e);i>=0&&t.#e.splice(i,1),t.#r()}),o.wait()}async newResponse(){let e=this,t,o=!0,r=new v,n,s=new ReadableStream({start:c=>{n=c,r.finish()},cancel:c=>{if(r.finished){let l=e.#t.indexOf(t);l>=0&&e.#t.splice(l,1),e.#r()}else o=!1}}),i=structuredClone(f);i.ETag=e.#a;let a=new Response(s,{status:200,headers:i});return await r.wait(),t=[a,n],o&&(e.#t.push(t),e.#r()),a}constructor(e,t,o){super();let r=this;if(!e)throw new Error("Invalid event socket root");if(!t)throw new Error("Invalid socket ID");r.#n=e,r.#a=t,r.#h=!!o,r.addEventListener("connecttx",()=>{r.sendComment("cc.ltgc.eclipsed:new")}),r.addEventListener("close",async()=>{await v.sleep(Math.max(1e4,r.shutdownTimeout)),r.#s==0&&(r.#o=!0,console.debug(`[Eclipsed] Socket ${r.#a} shutdown`),r.dispatchEvent(new Event("shutdown")))})}},P=class extends EventTarget{static EventSocket=k;#n;#e={};shutdownTimeout=15e3;#t(e){return console.debug(`[Eclipsed] Does the socket pool have socket ID "${e}"? ${!!this.#e[e]}`),this.#e[e]}constructor(e=15e3){super(),this.shutdownTimeout=e}upgradeEventStream(e){let t=this,o,r=e.headers.get("Accept");switch(r){case"text/event-stream":{o="eventSocket";break}case"application/grpc":{o="grpc";break}default:if(r.indexOf("application/grpc+")>=0)o="grpc";else return{untilRespond:Promise.resolve(),response:new Response("Bad request",{status:400,headers:w})}}if(o=="grpc"&&(e.method=="GET"||e.method=="get"))return{untilRespond:Promise.resolve(),response:new Response("Bad request",{status:400,headers:w})};let n,s;if(e.headers.has("Authorization")?(s=e.headers.get("Authorization"),s.slice(0,7)=="Bearer "&&(s=s.slice(7))):e.headers.has("If-Match")&&(s=e.headers.get("If-Match"),s.slice(0,2)=="W/"&&(s=s.slice(2))),e.headers.has("Last-Event-ID")){s=e.headers.get("Last-Event-ID");let i=s.indexOf(".");i>0&&(s=s.slice(0,i))}if(s&&(n=t.#t(s)),!n){let i=s||b(16);n=new k(t,i),t.#e[i]=n,n.addEventListener("newrx",a=>{t.dispatchEvent(new MessageEvent(a.type,{data:n,source:t}))}),n.addEventListener("newtx",a=>{t.dispatchEvent(new MessageEvent(a.type,{data:n,source:t}))}),n.addEventListener("connectrx",a=>{t.dispatchEvent(new MessageEvent(a.type,{data:n,source:t}))}),n.addEventListener("connecttx",a=>{t.dispatchEvent(new MessageEvent(a.type,{data:n,source:t}))}),n.addEventListener("connect",a=>{t.dispatchEvent(new MessageEvent(a.type,{data:n,source:t}))}),n.addEventListener("dangle",a=>{t.dispatchEvent(new MessageEvent(a.type,{data:n,source:t}))}),n.addEventListener("deadrx",a=>{t.dispatchEvent(new MessageEvent(a.type,{data:n,source:t}))}),n.addEventListener("deadtx",a=>{t.dispatchEvent(new MessageEvent(a.type,{data:n,source:t}))}),n.addEventListener("closerx",a=>{t.dispatchEvent(new MessageEvent(a.type,{data:n,source:t}))}),n.addEventListener("closetx",a=>{t.dispatchEvent(new MessageEvent(a.type,{data:n,source:t}))}),n.addEventListener("close",a=>{t.dispatchEvent(new MessageEvent(a.type,{data:n,source:t}))}),n.addEventListener("shutdown",a=>{delete t.#e[i]})}switch(e.method){case"GET":case"get":{return s&&n.useCustomExt(!0),{untilRespond:Promise.resolve(),response:n.newResponse()};break}case"POST":case"post":case"PUT":case"put":case"PATCH":case"patch":{switch(o){case"eventSocket":return{untilRespond:n.attachRequest(e),response:new Response("Client socket send complete",{status:200,headers:f})};case"grpc":return{untilRespond:Promise.resolve(),response:new Response("Client gRPC send complete",{status:200,headers:f})}}break}default:return{untilRespond:Promise.resolve(),response:new Response("Unknown method",{status:405,headers:w})}}}},B=P;export{B as default};
