import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,dirname,extname,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {openStore} from './store.mjs';
import {registry,catalog,inventory,storage,analytics} from './registry.mjs';
import {InputError,integer,requireText,getEvent,quote,createBooking,cancel,dashboard,equipment,timeline,telemetryReport} from './services.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const publicRoot=resolve(root,'public');
const seed=JSON.parse(await readFile(resolve(root,'data/seed.json'),'utf8'));
const operations=JSON.parse(await readFile(resolve(root,'data/operations.json'),'utf8'));
const operationNames=new Set(operations.map(x=>x.module+'.'+x.name));
function json(response,status,data){response.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});response.end(JSON.stringify(data));}
async function body(request) {
  let text='';
  for await(const chunk of request){text+=chunk;if(Buffer.byteLength(text)>65536) throw new InputError('Request too large.',413);}
  let value;try{value=JSON.parse(text||'{}');}catch{throw new InputError('Invalid JSON body.');}
  if(!value||typeof value!=='object'||Array.isArray(value)) throw new InputError('Expected a JSON object.');
  return value;
}
export async function createServer({dataFile=resolve(root,'data/local.json'),readOnly=false}={}) {
  // The hosted preview always reads a fresh seed and never opens a writable store.
  const store=readOnly ? {
    read:async()=>structuredClone(seed),
    update:async()=>{throw new InputError('This hosted preview is read-only. Clone the repository to test changes locally.',403);}
  } : await openStore(dataFile,seed);
  return http.createServer(async(request,response)=>{
    try {
      const url=new URL(request.url,'http://localhost');
      const path=url.pathname,method=request.method;
      if(readOnly && !['GET','HEAD'].includes(method) && !['/api/quote','/api/diagnostics'].includes(path)) {
        throw new InputError('This hosted preview is read-only. Clone the repository to test changes locally.',403);
      }
      // Preview computations accept only same-origin browser requests.
      if(!['GET','HEAD'].includes(method)){
        if(request.headers.origin && request.headers.origin!==`${readOnly?'https':'http'}://${request.headers.host}`) throw new InputError('Origin not allowed.',403);
        if(!String(request.headers['content-type']??'').startsWith('application/json')) throw new InputError('Send application/json.',415);
      }
      if(method==='GET'&&path==='/api/health') return json(response,200,readOnly?{ok:true,mode:'hosted-preview',readOnly:true}:{ok:true,mode:'local-sandbox'});
      if(method==='GET'&&path==='/api/operations') return json(response,200,operations);
      if(method==='POST'&&path==='/api/diagnostics') {
        const input=await body(request);const key=input.module+'.'+input.name;
        if(!operationNames.has(key)||!Object.hasOwn(registry,input.module)||!Object.hasOwn(registry[input.module],input.name)) throw new InputError('Unknown operation.',404);
        if(!Array.isArray(input.args)||input.args.length>10) throw new InputError('args must be a JSON array with at most 10 entries.');
        return json(response,200,{result:registry[input.module][input.name](...input.args)});
      }
      if(method==='GET'&&path==='/api/dashboard') return json(response,200,dashboard(await store.read()));
      if(method==='GET'&&path==='/api/events') {
        const state=await store.read();let events=catalog.searchEvents(state.events,url.searchParams.get('q')??'');
        events=catalog.filterByTag(events,url.searchParams.getAll('tag'));
        if(url.searchParams.get('available')==='true') events=catalog.availableEvents(events,state.bookings);
        events=catalog.sortByStart(events);
        const page=integer(Number(url.searchParams.get('page')??1),'Page',1,10000),size=integer(Number(url.searchParams.get('size')??6),'Page size',1,50);
        return json(response,200,{total:events.length,tags:catalog.distinctTags(state.events),events:catalog.paginate(events,page,size)});
      }
      if(method==='GET'&&path==='/api/bookings') {
        const state=await store.read(),eventId=url.searchParams.get('eventId');
        return json(response,200,eventId?registry.booking.eventBookings(state.bookings,eventId):state.bookings);
      }
      if(method==='POST'&&path==='/api/quote') {
        const input=await body(request),state=await store.read(),event=getEvent(state,input.eventId);
        return json(response,200,quote(state,event,integer(input.seats,'Seats',1,event.maxTeam),input.coupon));
      }
      if(method==='POST'&&path==='/api/bookings') {
        const input=await body(request);
        const result=await store.update(state=>{const result=createBooking(state,input);state.audit.push({at:Date.now(),action:'booking.create',id:result.record.id});return result;});
        return json(response,201,result);
      }
      if(method==='POST'&&path==='/api/bookings/cancel') {
        const input=await body(request);requireText(input.id,'Booking ID');
        const result=await store.update(state=>{const result=cancel(state,input.id);state.audit.push({at:Date.now(),action:'booking.cancel',id:input.id});return result;});
        return json(response,200,result);
      }
      if(method==='GET'&&path==='/api/inventory') {
        const state=await store.read(),eventId=url.searchParams.get('eventId')??'rovaris';getEvent(state,eventId);
        return json(response,200,equipment(state,eventId,integer(Number(url.searchParams.get('teams')??1),'Teams',1,100)));
      }
      if(method==='POST'&&path==='/api/inventory') {
        const input=await body(request);requireText(input.id,'Item ID');integer(input.quantity,'Quantity',1,1000);
        if(!['reserve','release','restock'].includes(input.action)) throw new InputError('Unknown inventory action.');
        const result=await store.update(state=>{
          const item=state.inventory.find(x=>x.id===input.id);if(!item) throw new InputError('Item not found.',404);
          if(input.action==='reserve'&&!inventory.canFulfill(state.inventory,[{itemId:item.id,quantity:input.quantity}])) throw new InputError('Insufficient usable stock.',409);
          const fn={reserve:inventory.reserveItems,release:inventory.releaseItems,restock:inventory.restock}[input.action];
          state.inventory=fn(state.inventory,input.id,input.quantity);
          state.audit.push({at:Date.now(),action:'inventory.'+input.action,id:input.id,quantity:input.quantity});return state.inventory;
        });return json(response,200,result);
      }
      if(method==='GET'&&path==='/api/schedule') return json(response,200,timeline(await store.read(),url.searchParams.get('eventId')??'rovaris'));
      if(method==='GET'&&path==='/api/telemetry') return json(response,200,telemetryReport(await store.read()));
      if(method==='POST'&&path==='/api/preferences') {
        const input=await body(request);
        if(input.pageSize!==undefined) integer(input.pageSize,'Page size',1,50);
        if(input.theme!==undefined&&!['light','dark'].includes(input.theme)) throw new InputError('Theme must be light or dark.');
        if(input.eventId!==undefined&&typeof input.eventId!=='string') throw new InputError('eventId must be text.');
        return json(response,200,await store.update(state=>state.preferences=storage.patchPreferences(state.preferences,input)));
      }
      if(method==='GET'&&path==='/api/report.csv') {
        const state=await store.read(),rows=[['event','email','seats','status','paidPaise'],...state.bookings.map(b=>[b.eventId,b.email,b.seats,b.status,b.paidPaise])];
        response.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="bookings.csv"'});
        return response.end(rows.map(row=>row.map(analytics.csvCell).join(',')).join('\r\n'));
      }
      if(method==='POST'&&path==='/api/reset') {
        await body(request);await store.update(state=>{for(const key of Object.keys(state))delete state[key];Object.assign(state,structuredClone(seed));return {ok:true};});
        return json(response,200,{ok:true});
      }
      if(path.startsWith('/api/')) throw new InputError('API route not found.',404);
      if(!['GET','HEAD'].includes(method)) throw new InputError('Method not allowed.',405);
      const target=resolve(publicRoot,'.'+decodeURIComponent(path==='/'?'/index.html':path));
      if(!target.startsWith(publicRoot+sep)) throw new InputError('Not found.',404);
      let bytes;try{bytes=await readFile(target);}catch{throw new InputError('Not found.',404);}
      response.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'})[extname(target)]??'application/octet-stream','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
      response.end(method==='HEAD'?undefined:bytes);
    } catch(error) {if(!response.headersSent) json(response,error.status??500,{error:error.status?error.message:'Operation failed. Check the server console and inputs.'});if(!error.status) console.error(error);}
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const server=await createServer({dataFile:process.env.DATA_FILE?resolve(process.env.DATA_FILE):undefined});
  const port=Number(process.env.PORT??3000),host=process.env.HOST??'127.0.0.1';
  server.listen(port,host,()=>console.log(`Stellar Ops is running at http://${host}:${server.address().port}`));
}
