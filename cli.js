#!/usr/bin/env node
let cpath = './config.txt';
const fs = require('fs');
const net= require('net');
const cajs= require('cajs');
const tls=require('tls');
const http=require('http');
const https = require('https');
const logcb= (...args)=>console.log.bind(this,...args);
const errcb= (...args)=>console.error.bind(this,...args);
const opts={}, psw=Math.random().toString(36).slice(2), worker=`
const psw='${psw}';
const names=['cfa-psw','cfa-url','cf-connecting-ip','cf-ipcountry','cf-ray','cf-visitor','x-real-ip','x-forwarded-proto'];
export default{async fetch(request){
  const url=request.headers.get('cfa-url');
  if(url&&request.headers.get('cfa-psw')==psw){
    const req=new Request(url,request);
    req.headers.set('host', new URL(url).host);
    for(let name of names) req.headers.delete(name);
    return fetch(req);
  }
  return new Response(null, {status:404});
}}
`;

if(process.argv[2]) cpath=process.argv[2];
fs.exists(cpath, e=>{
	if(e) init(JSON.parse(fs.readFileSync(cpath)));
	else {
		const ca=cajs.newCa('cf-agent');
		fs.writeFileSync('./worker.txt', worker);
		fs.writeFileSync('./ca.crt',ca.cert);
		fs.writeFileSync(cpath,JSON.stringify({domain:'',psw,ca}));
	}
});
const init= async({domain,psw,ca,hport=8088,hbind='127.0.0.1',wkip,mport=65443})=>{
	if(!domain||!psw||!ca) return errcb()('config.txt文件内容需要修改!');
	if(wkip) Object.assign(opts,{lookup:(host,opts,cb)=>cb(null,wkip,wkip.indexOf(':')==-1?4:6)});
	const purl=new URL('https://'+domain);
	cajs.load(ca);
	const handle=secure=>(req, res)=>{
		const {method, headers, url}=req;
		const ourl=secure?`https://${headers.host}${url}`:url;
		req.pipe(https.request(purl,{
			...opts, method, headers:{...headers,'cfa-url':ourl,'cfa-psw':psw,host:purl.host}
		}, r=>{res.writeHead(r.statusCode, r.headers); r.pipe(res);})
		.on('error', e=>{res.writeHead(500); res.end(e.message);})
		.on('socket', socket=>logcb(method)(ourl)))
		.on('error', errcb());
	};
	https.createServer({
		SNICallback:(host,cb)=>cb(null, tls.createSecureContext(cajs.sign(host)))
	}, handle(true)).listen(mport,'127.0.0.1',()=>
		http.createServer(handle(false)).on('connect', (req, socket, head)=>{
			net.connect(mport,'127.0.0.1', function(){
				socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
				this.pipe(socket).on('error',e=>errcb('E1:')(e.message));
				socket.pipe(this).on('error',e=>errcb('E2:')(e.message));
			}).on('error', e=>errcb('mitm-err')(e.message));
		}).listen(hport,hbind,logcb(`mitm-http server started: ${hbind}:${hport}`))
	);
}
