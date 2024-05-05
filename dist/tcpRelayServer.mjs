"use strict";let A=["utf-8","utf-16","utf-16be"],F=class extends EventTarget{static SPLIT_UTF_8=0;static SPLIT_UTF_16_LE=1;static SPLIT_UTF_16_BE=2;#t;#e;constructor(e,t=0){if(super(),t?.constructor!=Number||t<0||t>=A.length)throw new TypeError("Invalid split mode");if(t)throw new Error("UTF-16LE/BE currently not implemented");if(!e||e?.constructor!=ReadableStream)throw new TypeError("Not a readable stream");this.#t=e;let n=e.getReader();this.#e=new TextDecoder(A[t],{fatal:!0});let o=!0,s=!0,i;(async()=>{for(n.closed.then(()=>{i&&(this.dispatchEvent(new MessageEvent("raw",{data:i})),i=void 0),this.dispatchEvent(new Event("close")),s=!1}).catch(r=>{i&&(this.dispatchEvent(new MessageEvent("raw",{data:i})),i=void 0),this.dispatchEvent(new ErrorEvent("error",{message:r.message,error:r})),this.dispatchEvent(new Event("close")),s=!1});o&&s;)try{let r=await n.read();if(o=!r.done,o){let a=r.value;if(this.dispatchEvent(new MessageEvent("chunk",{data:a})),a.constructor!=Uint8Array&&a.constructor!=Uint8ClampedArray)this.dispatchEvent(new MessageEvent("fail",{data:a}));else{let l=0,c=0,y=0,w=!1;for(let u=0;u<a.length;u++){switch(a[u]){case 10:{y==13?l++:(w=!0,c=u);break}case 13:{w=!0,c=u;break}default:w=!1}if(w){let f=a.subarray(l,c),v=f;i&&(v=new Uint8Array(i.length+f.length),v.set(i),v.set(f,i.length),i=void 0),this.dispatchEvent(new MessageEvent("raw",{data:v}));try{let H=this.#e.decode(v);this.dispatchEvent(new MessageEvent("text",{data:H}))}catch{this.dispatchEvent(new MessageEvent("fail",{data:v}))}l=u+1,w=!1}y=a[u]}if(!w)if(i){let u=a.subarray(l),f=new Uint8Array(i.length+u.length);f.set(i),f.set(u,i.length),i=f}else l<a.length&&(i=a.subarray(l))}}else i&&(this.dispatchEvent(new MessageEvent("raw",{data:i})),i=void 0),this.dispatchEvent(new Event("close"))}catch(r){i&&(this.dispatchEvent(new MessageEvent("raw",{data:i})),i=void 0),this.dispatchEvent(new ErrorEvent("error",{message:r.message,error:r})),this.dispatchEvent(new Event("close"))}})()}},M=F;let W=class extends EventTarget{static sleep(e){return new Promise(t=>{self.AbortSignal?AbortSignal.timeout(e).addEventListener("abort",t):setTimeout(t,e)})}#t;#e;#n=!1;get finished(){return this.#n}finish(){this.#n=!0,this.#e&&this.#e()}wait(){if(!this.#n)return this.#t}constructor(){super(),this.#t=new Promise(e=>{this.#e=()=>{this.#n=!0,e()}})}},T=W;let G="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_",P=new Uint8Array(1),B=e=>{let t="";for(;e>0;)crypto.getRandomValues(P),t+=G[Math.floor(P[0]&63)],e--;return t},d=()=>!!self.debugMode,I=e=>e.replaceAll("\r",`
`).replaceAll(`\r
`,`
`).split(`
`);let k={Server:"Eclipsed","Content-Type":"text/plain","Cache-Control":"no-cache, no-store","Access-Control-Allow-Methods":"GET, POST, PUT, PATCH, OPTIONS","Access-Control-Allow-Origin":"*"},R={Server:"Eclipsed","Content-Type":"text/event-stream","Cache-Control":"no-cache, no-store",Vary:"Authorization, If-Match, Last-Event-ID","Access-Control-Allow-Headers":"Authorization, Accept, Cache-Control, If-Match, Last-Event-ID","Access-Control-Allow-Methods":"GET, POST, PUT, PATCH, OPTIONS","Access-Control-Allow-Origin":"*"},V=2500;let D=Symbol("closedSocket"),E=new TextEncoder,N=E.encode("data: "),O=E.encode(`

`),z=(e,t)=>{for(let n=0;n<e.length;n++){let o=e.charCodeAt(n);if(o<32&&(o!=10&&o!=13||!t||o!=9))throw new RangeError("Control characters are not allowed")}},U=class extends EventTarget{#t;#e=[];#n=[];#s;#u=!1;#c=0;#o=0;#a=0;#l=0;#d=!1;#h=1;#g=0;CLOSED=0;OPEN=3;TX_OPEN=1;RX_OPEN=2;PROBING=1;TRUE=2;FALSE=0;#i=!1;shutdownTimeout=15e3;#r(){let e=this;e.#e.length>e.#a?e.dispatchEvent(new Event("newrx")):e.#e.length<e.#a&&e.dispatchEvent(new Event("deadrx")),e.#n.length>e.#l?e.dispatchEvent(new Event("newtx")):e.#n.length<e.#l&&e.dispatchEvent(new Event("deadtx"));let t=0;if(e.#n.length&&(t|=1),e.#e.length&&(t|=2),t!=e.#o){switch(d()&&console.debug(`[Eclipsed] Old state: ${e.#o}`),d()&&console.debug(`[Eclipsed] New state: ${t}`),t){case 0:{switch(d()&&console.debug(`[Eclipsed] Close all: ${e.#s}`),e.dispatchEvent(new Event("close")),e.#o){case 1:{e.dispatchEvent(new Event("closetx"));break}case 2:{e.dispatchEvent(new Event("closerx"));break}case 3:{e.dispatchEvent(new Event("dangle")),e.dispatchEvent(new Event("closetx")),e.dispatchEvent(new Event("closerx"));break}}break}case 3:{d()&&console.debug(`[Eclipsed] Connect duplex: ${e.#s}`),e.dispatchEvent(new Event("connect"));break}case 1:{switch(e.#o){case 0:{e.dispatchEvent(new Event("connecttx"));break}case 3:{e.dispatchEvent(new Event("closerx")),d()&&console.debug(`[Eclipsed] No duplex: ${e.#s}`),e.dispatchEvent(new Event("dangle"));break}}break}case 2:{switch(e.#o){case 0:{e.dispatchEvent(new Event("connectrx"));break}case 3:{e.dispatchEvent(new Event("closetx")),e.dispatchEvent(new Event("dangle"));break}}break}}e.#o=t}e.#a=e.#e.length,e.#l=e.#n.length}get id(){return this.#s}get readyState(){return this.#o}getRequest(){let e=this;if(e.#e.length)return e.#e[0]}getResponse(){let e=this;if(e.#n.length)return e.#n[0]}sendEvent(e="message"){if(this.#i)throw new Error("Tried to send data through a closed socket");z(e),this.getResponse()[1].enqueue(E.encode(`event: ${e}
`))}sendData(e){if(this.#i)throw new Error("Tried to send data through a closed socket");I(e).forEach(t=>{this.getResponse()[1].enqueue(E.encode(`data: ${t}
`))})}sendDataRaw(e){let t=this;if(t.#i)throw new Error("Tried to send data through a closed socket");if(!e?.BYTES_PER_ELEMENT||e.BYTES_PER_ELEMENT!=1)throw new TypeError("Only Uint8Array is accepted");let n=0,o=!1;for(let s=0;s<e.length;s++){let i=e[s];switch(i){case 10:case 13:o||(t.getResponse()[1].enqueue(N),t.getResponse()[1].enqueue(e.subarray(n,s)),t.getResponse()[1].enqueue(O),o=!0),n=s+1;default:i<32&&(e[s]=32),o=!1}}o||(t.getResponse()[1].enqueue(N),t.getResponse()[1].enqueue(e.subarray(n)),t.getResponse()[1].enqueue(O))}sendComment(e){if(this.#i)throw new Error("Tried to send data through a closed socket");I(e).forEach(t=>{this.getResponse()[1].enqueue(E.encode(`:${t}
`))})}sendFlush(){if(this.#i)throw new Error("Tried to send data through a closed socket");let e=this;e.#d?e.getResponse()[1].enqueue(E.encode(`
`)):e.getResponse()[1].enqueue(E.encode(`id: ${e.#s}.${e.#c}

`)),e.#c++}send(e,t){let n=this;t&&n.sendEvent(t),n.sendData(e),n.sendFlush()}useCustomExt(e){this.#d=e}close(){let e=this;for(d()&&console.debug(`[Eclipsed] Closing down the socket: ${e.#s}...`);e.#e.length>0;)e.#e[0].cancel(),e.#e.splice(0,1);for(;e.#n.length>0;)e.#n[0][1].close(),e.#n.splice(0,1);e.#r()}attachRequest(e){let t=this;this.#e.push(e),t.#r(),t.useCustomExt(!0);let n=new T,o=new M(e.body,0,"utf-8"),s,i="";return o.addEventListener("text",({data:r})=>{console.debug(r);let a=r?.indexOf(":");if(!r?.trim()?.length)i&&(t.dispatchEvent(new MessageEvent(s||"message",{data:i})),s=void 0,i="");else if(r.codePointAt(0)==58)r.indexOf("eclipsed:")==1&&t.dispatchEvent(new MessageEvent("eclipsedext",{data:r.slice(10)}));else if(a>-1){let l=r.slice(0,a),c=a+1;r.codePointAt(a+1)==32&&c++;let y=r.slice(c);switch(l){case"event":{s=y;break}case"data":{i.length&&(i+=`
`),i+=y;break}default:}}}),o.addEventListener("close",()=>{n.finish();let r=t.#e.indexOf(e);r>=0&&t.#e.splice(r,1),t.#r()}),n.wait()}async newResponse(){let e=this,t,n=!0,o=new T,s,i=new ReadableStream({start:l=>{s=l,o.finish()},cancel:l=>{if(o.finished){let c=e.#n.indexOf(t);c>=0&&e.#n.splice(c,1),e.#r()}else n=!1}}),r=structuredClone(R);r.ETag=e.#s;let a=new Response(i,{status:200,headers:r});return await o.wait(),t=[a,s],n&&(e.#n.push(t),e.#r()),a}constructor(e,t,n){super();let o=this;if(!e)throw new Error("Invalid event socket root");if(!t)throw new Error("Invalid socket ID");o.#t=e,o.#s=t,o.#u=!!n,o.addEventListener("connecttx",()=>{o.sendComment("eclipsed:new")}),o.addEventListener("close",async()=>{await T.sleep(Math.max(1e4,o.shutdownTimeout)),o.#o==0&&(o.#i=!0,d()&&console.debug(`[Eclipsed] Socket ${o.#s} shutdown`),o.dispatchEvent(new Event("shutdown")))});let s={};o.addEventListener("eclipsedext",async({data:i})=>{let r=i.split("	"),a=Date.now();switch(r[0]){case"syn":{let l=r[1];s[l]=a,d()&&console.debug("[Eclipsed] Sending SYN/ACK"),o.sendComment(`eclipsed:synack	${l}`);break}case"ack":{let l=r[1],c=a-s[l];c<V?(o.#h=2,d()&&console.debug(`[Eclipsed] Connection ${o.#s} is streamed (${c}ms).`)):(o.#h=0,d()&&console.debug(`[Eclipsed] Connection ${o.#s} is chunked (${c}ms).`)),delete s[r[1]],o.#g=c;break}default:console.debug(`[Eclipsed] Unmatched extension: ${r}`)}})}},J=class extends EventTarget{static EventSocket=U;#t;#e={};shutdownTimeout=15e3;#n(e){return console.debug(`[Eclipsed] Does the socket pool have socket ID "${e}"? ${!!this.#e[e]}`),this.#e[e]}constructor(e=15e3){super(),this.shutdownTimeout=e}upgradeEventStream(e){let t=this,n,o=e.headers.get("Accept");switch(o){case"text/event-stream":{n="eventSocket";break}case"application/grpc":{n="grpc";break}default:if(o.indexOf("application/grpc+")>=0)n="grpc";else return{untilRespond:Promise.resolve(),response:new Response("Bad request",{status:400,headers:k})}}if(n=="grpc"&&(e.method=="GET"||e.method=="get"))return{untilRespond:Promise.resolve(),response:new Response("Bad request",{status:400,headers:k})};let s,i;if(e.headers.has("Authorization")&&(i=e.headers.get("Authorization"),i.slice(0,7)=="Bearer "&&(i=i.slice(7))),!i&&e.headers.has("If-Match")&&(i=e.headers.get("If-Match"),i.slice(0,2)=="W/"&&(i=i.slice(2))),e.headers.has("Last-Event-ID")){i=e.headers.get("Last-Event-ID");let r=i.indexOf(".");r>0&&(i=i.slice(0,r))}if(i?s=t.#n(i):d()&&console.debug("[Eclipsed] The new connection has no ID."),s==D)return{untilRespond:Promise.resolve(),response:new Response("Closed socket",{status:404,headers:k})};if(!s){let r=i||B(16);s=new U(t,r),t.#e[r]=s,s.addEventListener("newrx",a=>{t.dispatchEvent(new MessageEvent(a.type,{data:s}))}),s.addEventListener("newtx",a=>{t.dispatchEvent(new MessageEvent(a.type,{data:s}))}),s.addEventListener("connectrx",a=>{t.dispatchEvent(new MessageEvent(a.type,{data:s}))}),s.addEventListener("connecttx",a=>{t.dispatchEvent(new MessageEvent(a.type,{data:s}))}),s.addEventListener("connect",a=>{t.dispatchEvent(new MessageEvent(a.type,{data:s}))}),s.addEventListener("dangle",a=>{t.dispatchEvent(new MessageEvent(a.type,{data:s}))}),s.addEventListener("deadrx",a=>{t.dispatchEvent(new MessageEvent(a.type,{data:s}))}),s.addEventListener("deadtx",a=>{t.dispatchEvent(new MessageEvent(a.type,{data:s}))}),s.addEventListener("closerx",a=>{t.dispatchEvent(new MessageEvent(a.type,{data:s}))}),s.addEventListener("closetx",a=>{t.dispatchEvent(new MessageEvent(a.type,{data:s}))}),s.addEventListener("close",a=>{t.dispatchEvent(new MessageEvent(a.type,{data:s}))}),s.addEventListener("shutdown",a=>{t.#e[r]=D})}switch(e.method){case"GET":case"get":{return i&&s.useCustomExt(!0),{untilRespond:Promise.resolve(),response:s.newResponse()};break}case"POST":case"post":case"PUT":case"put":case"PATCH":case"patch":{switch(n){case"eventSocket":return{untilRespond:s.attachRequest(e),response:new Response("Client socket send complete",{status:200,headers:R})};case"grpc":return{untilRespond:Promise.resolve(),response:new Response("Client gRPC send complete",{status:200,headers:R})}}break}default:return{untilRespond:Promise.resolve(),response:new Response("Unknown method",{status:405,headers:k})}}}},$=J;let h=function(e,t,n=!1){if(!t)if(n){if(e!=null)throw new TypeError("Value is not a null value")}else throw new TypeError("Type is not defined");if(e?.constructor){if(e.constructor!=t)throw new TypeError(`Value is not type ${t.name}`)}else if(!n)throw new TypeError("Value is not nullable")},q=function(e,t=1,n,o=1,s){h(e,Uint8Array),h(n,Uint8Array),h(t,Number),h(o,Number);for(let i=0,r=0;i<e.length;i+=t,r+=o)s(e.subarray(i,i+t),n.subarray(r,r+o))},p=[48,49,50,51,52,53,54,55,56,57,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,45,95],g={};p.forEach(function(e,t){g[e]=t});let m=function(e){return e>64&&e<9&&(e|=32),e},Y=[{id:"korg87",win:[7,8],block:[function(e,t){for(let n=0;n<e.length;n++)t[n+1]=e[n]&127,t[0]|=e[n]>>7<<n},function(e,t){let n=e.length-1;for(let o=0;o<n;o++)t[o]=e[o+1]|(e[0]>>o&1)<<7}]},{id:"ov43",win:[3,4],block:[function(e,t){for(let n=0;n<e.length;n++)t[n+1]=e[n]&63,t[0]|=e[n]>>6<<(n<<1)},function(e,t){let n=e.length-1;for(let o=0;o<n;o++)t[o]=e[o+1]|(e[0]>>(o<<1)&3)<<6}]},{id:"ovm43",win:[3,4],block:[function(e,t){for(let n=0;n<e.length;n++)t[n+1]=p[e[n]&63],t[0]|=e[n]>>6<<(n<<1);t[0]=p[t[0]]},function(e,t){let n=e.length-1,o=g[e[0]];for(let s=0;s<n;s++)t[s]=g[e[s+1]]|(o>>(s<<1)&3)<<6}]},{id:"qb64",win:[3,4],block:[function(e,t){let n=0,o=e.length-1;for(let s=0;s<e.length;s++)n|=e[s]<<(s<<1),t[s]=p[n&63],n=n>>6,s==o&&(t[s+1]=p[n])},function(e,t){let n=0;for(let o=0;o<e.length;o++)n|=g[e[o]]<<[0,6,4,2][o],o&&(t[o-1]=n&255,n=n>>8)}]},{id:"qb32",win:[5,8],block:[function(e,t){let n=0,o=this.encodeLength(e.length),s=0,i=0;for(let r=0;r<e.length;r++)r<3?s|=e[r]<<(r<<3):i|=e[r]<<(r-3<<3);n=i*16777216+s;for(let r=0;r<o;r++)t[r]=p[n&31],n=Math.floor(n/32)},function(e,t){let n=0,o=this.decodeLength(e.length),s=0,i=0;for(let r=0;r<e.length;r++)r<4?s|=g[m(e[r])]<<r*5:r==4?(s|=(g[m(e[r])]&15)<<20,i|=g[m(e[r])]>>4):i|=g[m(e[r])]<<(r-5)*5+1;for(let r=0;r<o;r++)r<3?(t[r]=s&255,s=s>>8):(t[r]=i&255,i=i>>8)}]},{id:"qb16",win:[1,2],block:[function(e,t){t[0]=p[e[0]&15],t[1]=p[e[0]>>4]},function(e,t){t[0]=g[m(e[1]||0)]<<4|g[m(e[0])]}]},{id:"qb85",win:[4,5],block:[function(e,t){let n=0,o=this.encodeLength(e.length),s=0,i=0;e.forEach((r,a)=>{a>>1?s|=r<<((a&1)<<3):i|=r<<(a<<3)}),n=s*65536+i;for(let r=0;r<o;r++)t[r]=n%85+36,n=Math.floor(n/85)},function(e,t){let n=0,o=this.decodeLength(e.length);e.forEach((s,i)=>{n+=(s-36)*85**i});for(let s=0;s<o;s++)t[s]=n&255,n=n>>>8}]},{id:"qb128",win:[7,8],block:[function(e,t){let n=0,o=e.length-1;for(let s=0;s<e.length;s++)n|=e[s]<<s,t[s]=n&127,n=n>>7,s==o&&(t[s+1]=n)},function(e,t){let n=0;for(let o=0;o<e.length;o++)n|=e[o]<<[0,7,6,5,4,3,2,1][o],o&&(t[o-1]=n&255,n=n>>8)}]}],x=Y;x.push({id:"qb36",win:[9,14],block:[function(e,t){let n=0n,o=BigInt(this.encodeLength(e.length));e.forEach((s,i)=>{n|=BigInt(s)<<(BigInt(i)<<3n)});for(let s=0n;s<o;s++)t[s]=Number(n%36n+32n),n/=36n},function(e,t){let n=0n,o=BigInt(this.decodeLength(e.length));e.forEach((s,i)=>{n+=(BigInt(s)-32n)*36n**BigInt(i)});for(let s=0n;s<o;s++)t[s]=Number(n&255n),n=n>>8n}]});x.push({id:"qb94",win:[9,11],block:[function(e,t){let n=0n,o=BigInt(this.encodeLength(e.length));e.forEach((s,i)=>{n|=BigInt(s)<<(BigInt(i)<<3n)});for(let s=0n;s<o;s++)t[s]=Number(n%94n+32n),n/=94n},function(e,t){let n=0n,o=BigInt(this.decodeLength(e.length));e.forEach((s,i)=>{n+=(BigInt(s)-32n)*94n**BigInt(i)});for(let s=0n;s<o;s++)t[s]=Number(n&255n),n=n>>8n}]});x.push({id:"qb95",win:[9,11],block:[function(e,t){let n=0n,o=BigInt(this.encodeLength(e.length));e.forEach((s,i)=>{n|=BigInt(s)<<(BigInt(i)<<3n)});for(let s=0n;s<o;s++)t[s]=Number(n%95n+32n),n/=95n},function(e,t){let n=0n,o=BigInt(this.decodeLength(e.length));e.forEach((s,i)=>{n+=(BigInt(s)-32n)*95n**BigInt(i)});for(let s=0n;s<o;s++)t[s]=Number(n&255n),n=n>>8n}]});let X=x,K=class{#t;#e;#n;#s;options={noInit:!1};get name(){return this.#e}get template(){return this.#t}encodeLength(e,t){return h(e,Number),this.#t?.len?this.#t?.len[0](e,t):Math.ceil(e*this.#s/this.#n)}decodeLength(e,t){return h(e,Number),this.#t?.len?this.#t?.len[1](e,t):Math.floor(e*this.#n/this.#s)}encodeBytes(e,t){if(h(e,Uint8Array),h(t,Uint8Array),t.length<this.encodeLength(e.length,e))throw new Error("Target isn't sufficient for encoding");!this.options.noInit&&t.fill(0);let n=this,o=JSON.parse(JSON.stringify(this.#t.init&&this.#t.init[0]||"null"));q(e,this.#n,t,this.#s,function(s,i){n.#t?.block[0]?.call(n,s,i,o)})}decodeBytes(e,t){if(h(e,Uint8Array),h(t,Uint8Array),t.length<this.decodeLength(e.length,e))throw new Error("Target isn't sufficient for decoding");!this.options.noInit&&t.fill(0);let n=this,o=JSON.parse(JSON.stringify(this.#t.init&&this.#t.init[1]||"null"));q(e,this.#s,t,this.#n,function(s,i){n.#t?.block[1]?.call(n,s,i,o)})}constructor(e,t){if(!e?.id)throw new Error("Invalid algorithm ID");if(e?.block.length!=2)throw new Error("Invalid codec");this.#e=e.name,this.#t=e,this.#n=e.win[0],this.#s=e.win[1],this.options=t||this.options}},j=class{#t={};setAlgo(e){if(!e?.id)throw new Error("Invalid algorithm ID");this.#t[e.id]=e}delAlgo(e){this.#t[e]&&delete this.#t[e]}use(e,t){return new K(this.#t[e],t)}constructor(e){h(e,Array,!0);let t=this;e?.forEach(function(n){t.setAlgo(n)})}},_=new j(X);self.debugMode=1;let S=_.use("ovm43",{noInit:!0}),Q=new TextEncoder,Z=Deno.args[0]||"127.0.0.1",ee=parseInt(Deno.args[1])||80,te=parseInt(Deno.args[2])||8090,C=new $,b={},L=async function({data:e}){let t=this;console.debug(`Message handler: ${t.id}.`);let n=b[t.id];if(n){let o=Q.encode(e),s=new Uint8Array(S.decodeLength(o.length));S.decodeBytes(o,s),await n.writer.write(s)}else t.msgBuffer=t.msgBuffer||[],t.msgBuffer.push(e)};C.addEventListener("connect",async({data:e})=>{let t=e;t.addEventListener("message",L),console.debug("[ConnMgr]  Establishing a new TCP connection..."),b[t.id]=b[t.id]||await Deno.connect({hostname:Z,port:ee});let n=b[t.id];n.reader=n.readable.getReader(),n.writer=n.writable.getWriter(),n.setNoDelay(!0),console.debug("[ConnMgr]  Adding handlers for TCP connection..."),(async()=>{let o=!0;for(;o;)try{console.debug("Waiting to read response...");let{value:s,done:i}=await n.reader.read();if(o=!i,s){console.debug("Incoming response data read.");let r=new Uint8Array(S.encodeLength(s.length));S.encodeBytes(s,r),t.sendDataRaw(r)}else console.debug("Incoming response data ended."),t.close()}catch(s){console.debug(s),o=!1}})(),t.msgBuffer?.forEach(o=>{L.call(t,{data:o})})});C.addEventListener("dangle",({data:e})=>{let t=e;console.debug("[ConnMgr]  Disconnecting TCP..."),t.removeEventListener("message",L);let n=b[t.id];n&&(n.close(),delete b[t.id])});Deno.serve({port:te,hostname:"127.0.0.1"},async e=>{console.debug("[Web Root] Request received.");let{untilRespond:t,response:n}=C.upgradeEventStream(e);return console.debug("[Web Root] Stream upgraded."),await t,console.debug("[Web Root] Request responded."),n});
