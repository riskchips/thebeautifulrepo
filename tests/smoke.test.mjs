import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {createServer} from '../src/server.mjs';

// Infrastructure smoke tests. Add regression tests for the defects you investigate.
test('local sandbox infrastructure',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'stellar-smoke-'));
  const dataFile=join(dir,'snapshot.json');let server,base;
  async function start(){server=await createServer({dataFile});server.listen(0,'127.0.0.1');await once(server,'listening');base='http://127.0.0.1:'+server.address().port;}
  async function stop(){server.closeAllConnections();await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
  async function post(path,payload){return fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});}
  await start();
  try{
    await t.test('health endpoint reports local mode',async()=>{const r=await fetch(base+'/api/health');assert.equal(r.status,200);assert.deepEqual(await r.json(),{ok:true,mode:'local-sandbox'});});
    await t.test('HTML and browser assets are served',async()=>{for(const path of ['/','/app.js','/style.css']){const r=await fetch(base+path);assert.equal(r.status,200);assert.ok((await r.text()).length>100);} });
    await t.test('all read endpoints return parseable JSON',async()=>{for(const path of ['/api/dashboard','/api/events','/api/bookings','/api/inventory','/api/schedule','/api/telemetry']){const r=await fetch(base+path);assert.equal(r.status,200);assert.ok(await r.json());}});
    await t.test('operation metadata exposes names and contracts',async()=>{const operations=await (await fetch(base+'/api/operations')).json();assert.ok(operations.length>0);assert.ok(operations.every(op=>op.module&&op.name&&op.contract&&Array.isArray(op.example)));});
    await t.test('diagnostics runs an allowed operation',async()=>{const r=await post('/api/diagnostics',{module:'validation',name:'isVitEmail',args:['demo@vit.ac.in']});assert.equal(r.status,200);assert.deepEqual(await r.json(),{result:true});});
    await t.test('unknown API and diagnostic names are rejected',async()=>{assert.equal((await fetch(base+'/api/missing')).status,404);assert.equal((await post('/api/diagnostics',{module:'validation',name:'missing',args:[]})).status,404);});
    await t.test('invalid JSON is rejected',async()=>{const r=await fetch(base+'/api/preferences',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});assert.equal(r.status,400);});
    await t.test('unrelated website origins cannot write',async()=>{const r=await fetch(base+'/api/reset',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://example.invalid'},body:'{}'});assert.equal(r.status,403);});
    await t.test('request bodies are bounded',async()=>{const r=await post('/api/diagnostics',{value:'x'.repeat(70000)});assert.equal(r.status,413);});
    await t.test('concurrent preference writes survive a process restart',async()=>{const results=await Promise.all([post('/api/preferences',{theme:'light'}),post('/api/preferences',{pageSize:3})]);for(const r of results)assert.equal(r.status,200);await stop();await start();const data=await (await fetch(base+'/api/dashboard')).json();assert.equal(data.preferences.theme,'light');assert.equal(data.preferences.pageSize,3);});
    await t.test('reset restores the fictional seed',async()=>{assert.equal((await post('/api/reset',{})).status,200);const data=await (await fetch(base+'/api/dashboard')).json();assert.equal(data.preferences.theme,'dark');assert.equal(data.events.length,3);});
  }finally{await stop();await rm(dir,{recursive:true,force:true});}
});
