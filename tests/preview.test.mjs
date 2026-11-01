import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import handler from '../api/index.mjs';

test('Vercel read-only preview',async t=>{
  const server=http.createServer(handler);
  server.listen(0,'127.0.0.1');await once(server,'listening');
  const base='http://127.0.0.1:'+server.address().port;
  const post=(path,value)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
  try{
    await t.test('advertises hosted read-only mode',async()=>{
      const response=await fetch(base+'/api/health');
      assert.equal(response.status,200);
      assert.deepEqual(await response.json(),{ok:true,mode:'hosted-preview',readOnly:true});
    });
    await t.test('handles rewritten route and retains query filters',async()=>{
      const response=await fetch(base+'/api/index?__stellar_path=bookings&eventId=missing');
      assert.equal(response.status,200);assert.deepEqual(await response.json(),[]);
    });
    await t.test('serves every read-only dashboard area',async()=>{
      for(const path of ['dashboard','events','bookings','inventory','schedule','telemetry','operations']){
        const response=await fetch(base+'/api/'+path);assert.equal(response.status,200,path);assert.ok(await response.json());
      }
    });
    await t.test('rejects every saved-data write without changing the seed',async()=>{
      const before=await (await fetch(base+'/api/dashboard')).json();
      for(const path of ['bookings','bookings/cancel','inventory','preferences','reset']){
        const response=await post('/api/'+path,{});assert.equal(response.status,403,path);assert.match((await response.json()).error,/read-only/);
      }
      assert.deepEqual(await (await fetch(base+'/api/dashboard')).json(),before);
    });
    await t.test('allows quotes and isolated diagnostics over the hosted origin',async()=>{
      const response=await fetch(base+'/api/quote',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://127.0.0.1:'+server.address().port},body:JSON.stringify({eventId:'rovaris',seats:2})});
      assert.equal(response.status,200);assert.equal(typeof (await response.json()).totalPaise,'number');
      const result=await post('/api/diagnostics',{module:'validation',name:'isVitEmail',args:['demo@vit.ac.in']});assert.equal(result.status,200);assert.deepEqual(await result.json(),{result:true});
    });
  }finally{server.closeAllConnections();await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
});
