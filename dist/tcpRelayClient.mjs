"use strict";let z=Object.defineProperty;let K=(t,n,e)=>n in t?z(t,n,{enumerable:!0,configurable:!0,writable:!0,value:e}):t[n]=e;let x=(t,n,e)=>(K(t,typeof n!="symbol"?n+"":n,e),e),P=(t,n,e)=>{if(!n.has(t))throw TypeError("Cannot "+e)};let q=(t,n,e)=>(P(t,n,"read from private field"),e?e.call(t):n.get(t)),A=(t,n,e)=>{if(n.has(t))throw TypeError("Cannot add the same private member more than once");n instanceof WeakSet?n.add(t):n.set(t,e)},M=(t,n,e,i)=>(P(t,n,"write to private field"),i?i.call(t,e):n.set(t,e),e);let Q=class extends EventTarget{static sleep(t){return new Promise(n=>{self.AbortSignal?AbortSignal.timeout(t).addEventListener("abort",n):setTimeout(n,t)})}#e;#r;#t=!1;get finished(){return this.#t}finish(){this.#t=!0,this.#r&&this.#r()}wait(){if(!this.#t)return this.#e}constructor(){super(),this.#e=new Promise(t=>{this.#r=()=>{this.#t=!0,t()}})}},E=Q;let R=["utf-8","utf-16","utf-16be"],I,k,T,X=(I=class extends EventTarget{constructor(n,e=0){super();A(this,k,void 0);A(this,T,void 0);if(e?.constructor!=Number||e<0||e>=R.length)throw new TypeError("Invalid split mode");if(e)throw new Error("UTF-16LE/BE currently not implemented");if(!n||n?.constructor!=ReadableStream)throw new TypeError("Not a readable stream");M(this,k,n);let i=n.getReader();M(this,T,new TextDecoder(R[e],{fatal:!0}));let r=!0,a=!0,s;(async()=>{for(i.closed.then(()=>{s&&(this.dispatchEvent(new MessageEvent("raw",{data:s})),s=void 0),this.dispatchEvent(new Event("close")),a=!1}).catch(o=>{s&&(this.dispatchEvent(new MessageEvent("raw",{data:s})),s=void 0),this.dispatchEvent(new ErrorEvent("error",{message:o.message,error:o})),this.dispatchEvent(new Event("close")),a=!1});r&&a;)try{let o=await i.read();if(r=!o.done,r){let l=o.value;if(this.dispatchEvent(new MessageEvent("chunk",{data:l})),l.constructor!=Uint8Array&&l.constructor!=Uint8ClampedArray)this.dispatchEvent(new MessageEvent("fail",{data:l}));else{let h=0,f=0,p=0,d=!1;for(let c=0;c<l.length;c++){switch(l[c]){case 10:{p==13?h++:(d=!0,f=c);break}case 13:{d=!0,f=c;break}default:d=!1}if(d){let u=l.subarray(h,f),v=u;s&&(v=new Uint8Array(s.length+u.length),v.set(s),v.set(u,s.length),s=void 0),this.dispatchEvent(new MessageEvent("raw",{data:v}));try{let S=q(this,T).decode(v);this.dispatchEvent(new MessageEvent("text",{data:S}))}catch{this.dispatchEvent(new MessageEvent("fail",{data:v}))}h=c+1,d=!1}p=l[c]}if(!d)if(s){let c=l.subarray(h),u=new Uint8Array(s.length+c.length);u.set(s),u.set(c,s.length),s=u}else h<l.length&&(s=l.subarray(h))}}else s&&(this.dispatchEvent(new MessageEvent("raw",{data:s})),s=void 0),this.dispatchEvent(new Event("close"))}catch(o){s&&(this.dispatchEvent(new MessageEvent("raw",{data:s})),s=void 0),this.dispatchEvent(new ErrorEvent("error",{message:o.message,error:o})),this.dispatchEvent(new Event("close"))}})()}},k=new WeakMap,T=new WeakMap,x(I,"SPLIT_UTF_8",0),x(I,"SPLIT_UTF_16_LE",1),x(I,"SPLIT_UTF_16_BE",2),I),_=X;let Z="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_",F=new Uint8Array(1),$=t=>{let n="";for(;t>0;)crypto.getRandomValues(F),n+=Z[Math.floor(F[0]&63)],t--;return n},O=()=>!!self.debugMode,U=t=>t.replaceAll("\r",`
`).replaceAll(`\r
`,`
`).split(`
`);let D=3,W=3e3,ee=200,te=2500;let m=new TextEncoder,G=m.encode("data: "),J=m.encode(`

`),ne=class extends EventTarget{CONNECTING=0;OPEN=1;CLOSED=2;PROBING=1;TRUE=2;FALSE=0;#e=0;#r="";#t=!1;#n;#o;#l=W;#a=[];#d=1;#h=!1;#f=0;#c;get readyState(){return this.#e}get url(){return this.#r}get withCredentials(){return this.#t}get lastEventId(){return this.#n}fetch;headers={};redirect="follow";referer;refererPolicy="no-referrer-when-downgrade";acceptDuplex=!1;pingInterval=3e4;close(){this.#e=2,this.#o.abort()}constructor(t,n={}){super();let e=this;if(!t)throw new SyntaxError("Invalid URL");let i;try{i=new URL(t)}catch{throw new SyntaxError("Invalid URL")}e.#o=new AbortController,e.#r=t,e.#t=n.withCredentials||e.#t,e.headers=n.headers||e.headers,e.redirect=n.redirect||e.redirect,e.referer=n.referer||e.referer,e.refererPolicy=n.refererPolicy||e.refererPolicy,e.fetch=n.fetch||self.fetch,e.acceptDuplex=n.acceptDuplex||e.acceptDuplex,e.headers.Accept=e.headers.Accept||"text/event-stream",e.headers["Cache-Control"]=e.headers["Cache-Control"]||"no-store";let r=0;(async()=>{for(;e.#e<2&&r<3;)try{e.dispatchEvent(new Event("connecting"));let o=structuredClone(e.headers);e.#n?o["Last-Event-ID"]=e.#n:o["Last-Event-ID"]&&delete o["Last-Event-ID"],e.#h&&e.#c&&(o["If-Match"]=`W/${e.#c}`);let l=new E,h=await e.fetch(e.#r,{method:"GET",cache:"no-store",credentials:e.#t?"include":"omit",priority:"high",signal:e.#o.signal,headers:e.headers,redirect:e.redirect,referer:e.referer,refererPolicy:e.refererPolicy});if(h.status==200){e.#e=e.OPEN,e.dispatchEvent(new Event("open")),r=0,h.headers.has("ETag")&&(e.#c=h.headers.get("ETag")?.replace("W/",""));let f=new _(h.body,0,"utf-8"),p,d="";f.addEventListener("text",({data:c})=>{let u=c?.indexOf(":");if(!c?.trim()?.length)d&&(e.dispatchEvent(new MessageEvent(p||"message",{data:d,origin:e.#r,lastEventId:e.#n})),p=void 0,d="",e.#n=void 0);else if(c.codePointAt(0)==58)c.indexOf("eclipsed:")==1&&e.dispatchEvent(new MessageEvent("eclipsedext",{data:c.slice(10),origin:e.#r,lastEventId:e.#n}));else if(u>-1){let v=c.slice(0,u),S=u+1;c.codePointAt(u+1)==32&&S++;let B=c.slice(S);switch(v){case"event":{p=B;break}case"data":{d.length&&(d+=`
`),d+=B;break}case"id":{c.indexOf("\0")==-1&&(e.#n=B);break}case"retry":{let L=parseInt(L);L&&L>=ee&&(e.#l=L);break}default:}}}),f.addEventListener("close",()=>{l.finish()}),await l.wait(),e.#e=e.CONNECTING,await E.sleep(Math.max(e.#l,W))}else e.dispatchEvent(new ErrorEvent("error",{message:h.statusText})),e.dispatchEvent(new Event("disconnect")),e.dispatchEvent(new Event("close")),e.#e=2}catch(o){switch(o.name){case"AbortError":{e.#e=2,r=D,e.dispatchEvent(new Event("disconnect")),e.dispatchEvent(new Event("close"));break}case"NotAllowedError":{e.#e=2,r=D,e.dispatchEvent(new ErrorEvent("error",{message:o.message,error:o})),e.dispatchEvent(new Event("disconnect")),e.dispatchEvent(new Event("close"));break}case"TypeError":{o.message.indexOf("connection")>-1?(r++,r>D?(e.#e=2,e.dispatchEvent(new ErrorEvent("error",{message:o.message,error:o})),e.dispatchEvent(new Event("disconnect")),e.dispatchEvent(new Event("close"))):await E.sleep(e.#l)):(e.#e=2,r=D,e.dispatchEvent(new ErrorEvent("error",{message:o.message,error:o})),e.dispatchEvent(new Event("disconnect")),e.dispatchEvent(new Event("close")));break}}}})();let a={},s=async()=>{let o=$(16);a[o]=Date.now(),O()&&console.debug("[Eclipsed] Sending SYN"),await e.sendComment(`eclipsed:syn	${o}`)};e.addEventListener("eclipsedext",async({data:o})=>{let l=o.split("	"),h=Date.now();try{switch(l[0]){case"new":{e.#h=!0,await e.#s(),await s(),e.dispatchEvent(new Event("duplex"));break}case"synack":{let f=l[1],p=a[f];if(p){let d=h-p;d<te?e.#d=2:e.#d=0,delete a[f],e.#f=d,await e.sendComment(`eclipsed:ack	${f}`)}break}default:console.debug(`[Eclipsed] Unmatched extension: ${l}`)}}catch(f){console.debug(f)}}),(async()=>{for(;e.#e!=2;)await E.sleep(e.pingInterval),e.#e==1&&await s()})()}get duplexLatency(){return this.#f}get socketId(){let t=this;if(t.#h)return t.#c||t.#n.splice(".")[0]}async#s(t){let n=this;if(n.#e!=n.CLOSED&&(t||n.#a.length<1)){n.readyState==n.CONNECTING&&await E.sleep(n.#l);let e,i=!0,r=new E,a,s=new ReadableStream({start:h=>{a=h,r.finish()},cancel:h=>{if(r.finished){let f=n.#a.indexOf(e);f>=0&&n.#a.splice(f,1),n.#s()}else i=!1}}),o=structuredClone(n.headers);o["If-Match"]=`W/${n.socketId}`;let l=new Request(n.#r,{body:s,method:"POST",cache:"no-store",credentials:n.#t?"include":"omit",priority:"high",signal:n.#o.signal,headers:o,redirect:n.redirect,referer:n.referer,refererPolicy:n.refererPolicy});await r.wait(),(async()=>{try{await n.fetch(l)}catch(h){console.debug(h)}})(),e=[l,a],i&&(n.#a.push(e),O()&&console.debug("[Eclipsed] Created send socket."))}}#i(){let t=this;if(t.#a.length)return t.#a[0]}async sendEvent(t="message",n){let e=this;if(e.#e==e.CLOSED)throw new Error("Tried to send data through a closed socket");n||await e.#s(),errorWithControl(t),e.#i()[1].enqueue(m.encode(`event: ${t}
`))}async sendData(t,n){let e=this;if(e.#e==e.CLOSED)throw new Error("Tried to send data through a closed socket");n||await e.#s(),U(t).forEach(i=>{e.#i()[1].enqueue(m.encode(`data: ${i}
`))})}async sendDataRaw(t,n){let e=this;if(e.#e==e.CLOSED)throw new Error("Tried to send data through a closed socket");if(n||await e.#s(),!t?.BYTES_PER_ELEMENT||t.BYTES_PER_ELEMENT!=1)throw new TypeError("Only Uint8Array is accepted");let i=0,r=!1;for(let a=0;a<t.length;a++){let s=t[a];switch(s){case 10:case 13:r||(e.#i()[1].enqueue(G),e.#i()[1].enqueue(t.subarray(i,a)),e.#i()[1].enqueue(J),r=!0),i=a+1;default:s<32&&(t[a]=32),r=!1}}r||(e.#i()[1].enqueue(G),e.#i()[1].enqueue(t.subarray(i)),e.#i()[1].enqueue(J))}async sendComment(t,n){let e=this;if(e.#e==e.CLOSED)throw new Error("Tried to send data through a closed socket");n||await e.#s(),U(t).forEach(i=>{e.#i()[1].enqueue(m.encode(`:${i}
`))})}async sendFlush(t){let n=this;if(n.#e==n.CLOSED)throw new Error("Tried to send data through a closed socket");t||await n.#s(),n.#i()[1].enqueue(m.encode(`
`))}async send(t,n){let e=this;await e.#s(),n&&e.sendEvent(n,!0),e.sendData(t,!0),e.sendFlush(!0)}},V=ne;let g=function(t,n,e=!1){if(!n)if(e){if(t!=null)throw new TypeError("Value is not a null value")}else throw new TypeError("Type is not defined");if(t?.constructor){if(t.constructor!=n)throw new TypeError(`Value is not type ${n.name}`)}else if(!e)throw new TypeError("Value is not nullable")},Y=function(t,n=1,e,i=1,r){g(t,Uint8Array),g(e,Uint8Array),g(n,Number),g(i,Number);for(let a=0,s=0;a<t.length;a+=n,s+=i)r(t.subarray(a,a+n),e.subarray(s,s+i))},y=[48,49,50,51,52,53,54,55,56,57,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,45,95],w={};y.forEach(function(t,n){w[t]=n});let b=function(t){return t>64&&t<9&&(t|=32),t},re=[{id:"korg87",win:[7,8],block:[function(t,n){for(let e=0;e<t.length;e++)n[e+1]=t[e]&127,n[0]|=t[e]>>7<<e},function(t,n){let e=t.length-1;for(let i=0;i<e;i++)n[i]=t[i+1]|(t[0]>>i&1)<<7}]},{id:"ov43",win:[3,4],block:[function(t,n){for(let e=0;e<t.length;e++)n[e+1]=t[e]&63,n[0]|=t[e]>>6<<(e<<1)},function(t,n){let e=t.length-1;for(let i=0;i<e;i++)n[i]=t[i+1]|(t[0]>>(i<<1)&3)<<6}]},{id:"ovm43",win:[3,4],block:[function(t,n){for(let e=0;e<t.length;e++)n[e+1]=y[t[e]&63],n[0]|=t[e]>>6<<(e<<1);n[0]=y[n[0]]},function(t,n){let e=t.length-1,i=w[t[0]];for(let r=0;r<e;r++)n[r]=w[t[r+1]]|(i>>(r<<1)&3)<<6}]},{id:"qb64",win:[3,4],block:[function(t,n){let e=0,i=t.length-1;for(let r=0;r<t.length;r++)e|=t[r]<<(r<<1),n[r]=y[e&63],e=e>>6,r==i&&(n[r+1]=y[e])},function(t,n){let e=0;for(let i=0;i<t.length;i++)e|=w[t[i]]<<[0,6,4,2][i],i&&(n[i-1]=e&255,e=e>>8)}]},{id:"qb32",win:[5,8],block:[function(t,n){let e=0,i=this.encodeLength(t.length),r=0,a=0;for(let s=0;s<t.length;s++)s<3?r|=t[s]<<(s<<3):a|=t[s]<<(s-3<<3);e=a*16777216+r;for(let s=0;s<i;s++)n[s]=y[e&31],e=Math.floor(e/32)},function(t,n){let e=0,i=this.decodeLength(t.length),r=0,a=0;for(let s=0;s<t.length;s++)s<4?r|=w[b(t[s])]<<s*5:s==4?(r|=(w[b(t[s])]&15)<<20,a|=w[b(t[s])]>>4):a|=w[b(t[s])]<<(s-5)*5+1;for(let s=0;s<i;s++)s<3?(n[s]=r&255,r=r>>8):(n[s]=a&255,a=a>>8)}]},{id:"qb16",win:[1,2],block:[function(t,n){n[0]=y[t[0]&15],n[1]=y[t[0]>>4]},function(t,n){n[0]=w[b(t[1]||0)]<<4|w[b(t[0])]}]},{id:"qb85",win:[4,5],block:[function(t,n){let e=0,i=this.encodeLength(t.length),r=0,a=0;t.forEach((s,o)=>{o>>1?r|=s<<((o&1)<<3):a|=s<<(o<<3)}),e=r*65536+a;for(let s=0;s<i;s++)n[s]=e%85+36,e=Math.floor(e/85)},function(t,n){let e=0,i=this.decodeLength(t.length);t.forEach((r,a)=>{e+=(r-36)*85**a});for(let r=0;r<i;r++)n[r]=e&255,e=e>>>8}]},{id:"qb128",win:[7,8],block:[function(t,n){let e=0,i=t.length-1;for(let r=0;r<t.length;r++)e|=t[r]<<r,n[r]=e&127,e=e>>7,r==i&&(n[r+1]=e)},function(t,n){let e=0;for(let i=0;i<t.length;i++)e|=t[i]<<[0,7,6,5,4,3,2,1][i],i&&(n[i-1]=e&255,e=e>>8)}]}],C=re;C.push({id:"qb36",win:[9,14],block:[function(t,n){let e=0n,i=BigInt(this.encodeLength(t.length));t.forEach((r,a)=>{e|=BigInt(r)<<(BigInt(a)<<3n)});for(let r=0n;r<i;r++)n[r]=Number(e%36n+32n),e/=36n},function(t,n){let e=0n,i=BigInt(this.decodeLength(t.length));t.forEach((r,a)=>{e+=(BigInt(r)-32n)*36n**BigInt(a)});for(let r=0n;r<i;r++)n[r]=Number(e&255n),e=e>>8n}]});C.push({id:"qb94",win:[9,11],block:[function(t,n){let e=0n,i=BigInt(this.encodeLength(t.length));t.forEach((r,a)=>{e|=BigInt(r)<<(BigInt(a)<<3n)});for(let r=0n;r<i;r++)n[r]=Number(e%94n+32n),e/=94n},function(t,n){let e=0n,i=BigInt(this.decodeLength(t.length));t.forEach((r,a)=>{e+=(BigInt(r)-32n)*94n**BigInt(a)});for(let r=0n;r<i;r++)n[r]=Number(e&255n),e=e>>8n}]});C.push({id:"qb95",win:[9,11],block:[function(t,n){let e=0n,i=BigInt(this.encodeLength(t.length));t.forEach((r,a)=>{e|=BigInt(r)<<(BigInt(a)<<3n)});for(let r=0n;r<i;r++)n[r]=Number(e%95n+32n),e/=95n},function(t,n){let e=0n,i=BigInt(this.decodeLength(t.length));t.forEach((r,a)=>{e+=(BigInt(r)-32n)*95n**BigInt(a)});for(let r=0n;r<i;r++)n[r]=Number(e&255n),e=e>>8n}]});let ie=C,se=class{#e;#r;#t;#n;options={noInit:!1};get name(){return this.#r}get template(){return this.#e}encodeLength(t,n){return g(t,Number),this.#e?.len?this.#e?.len[0](t,n):Math.ceil(t*this.#n/this.#t)}decodeLength(t,n){return g(t,Number),this.#e?.len?this.#e?.len[1](t,n):Math.floor(t*this.#t/this.#n)}encodeBytes(t,n){if(g(t,Uint8Array),g(n,Uint8Array),n.length<this.encodeLength(t.length,t))throw new Error("Target isn't sufficient for encoding");!this.options.noInit&&n.fill(0);let e=this,i=JSON.parse(JSON.stringify(this.#e.init&&this.#e.init[0]||"null"));Y(t,this.#t,n,this.#n,function(r,a){e.#e?.block[0]?.call(e,r,a,i)})}decodeBytes(t,n){if(g(t,Uint8Array),g(n,Uint8Array),n.length<this.decodeLength(t.length,t))throw new Error("Target isn't sufficient for decoding");!this.options.noInit&&n.fill(0);let e=this,i=JSON.parse(JSON.stringify(this.#e.init&&this.#e.init[1]||"null"));Y(t,this.#n,n,this.#t,function(r,a){e.#e?.block[1]?.call(e,r,a,i)})}constructor(t,n){if(!t?.id)throw new Error("Invalid algorithm ID");if(t?.block.length!=2)throw new Error("Invalid codec");this.#r=t.name,this.#e=t,this.#t=t.win[0],this.#n=t.win[1],this.options=n||this.options}},ae=class{#e={};setAlgo(t){if(!t?.id)throw new Error("Invalid algorithm ID");this.#e[t.id]=t}delAlgo(t){this.#e[t]&&delete this.#e[t]}use(t,n){return new se(this.#e[t],n)}constructor(t){g(t,Array,!0);let n=this;t?.forEach(function(e){n.setAlgo(e)})}},j=new ae(ie);self.debugMode=1;let N=j.use("ovm43",{noInit:!0}),oe=new TextEncoder,H=Deno.args[0],le=parseInt(Deno.args[1])||8091;H||(console.error("Invalid SSE URL."),Deno.exit(0));let ce=Deno.listen({hostname:"127.0.0.1",port:le});for await(let t of ce){console.debug("Connection accepted."),console.debug("R/W defined.");let n=new E,e=new V(H);e.addEventListener("duplex",()=>{t.reader=t.readable.getReader(),t.writer=t.writable.getWriter(),n.finish()}),e.addEventListener("message",async({data:i})=>{let r=oe.encode(i),a=new Uint8Array(N.decodeLength(r.length));N.decodeBytes(r,a);try{await t.writer.write(a)}catch(s){console.error(s)}}),await n.wait(),(async()=>{let i=!0;for(;i;)try{console.debug("Waiting to read...");let{value:r,done:a}=await t.reader.read();if(console.debug("Incoming data read."),i=!a,r){let s=new Uint8Array(N.encodeLength(r.length));N.encodeBytes(r,s),await e.sendDataRaw(s)}else a&&(await E.sleep(160),e.close())}catch(r){console.debug(r),i=!1}})()}
