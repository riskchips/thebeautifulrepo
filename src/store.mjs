import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {dirname} from 'node:path';
import {parseSnapshot,migrateSnapshot,retainAudit} from './domain/storage.mjs';

export async function openStore(file,seed) {
  let state=structuredClone(seed);
  try { state=migrateSnapshot(parseSnapshot(await readFile(file,'utf8'),seed)); }
  catch(error) { if(error.code!=='ENOENT') throw error; }
  // The queue prevents simultaneous read-modify-write requests from losing data.
  let queue=Promise.resolve();
  const read=async()=>{ await queue; return structuredClone(state); };
  const update=fn=>{
    const result=queue.then(async()=>{
      const draft=structuredClone(state);
      const value=await fn(draft);
      draft.audit=retainAudit(draft.audit??[],100);
      await mkdir(dirname(file),{recursive:true});
      const temporary=file+'.tmp';
      await writeFile(temporary,JSON.stringify(draft,null,2),'utf8');
      await rename(temporary,file);
      state=draft;
      return structuredClone(value);
    });
    queue=result.catch(()=>{});
    return result;
  };
  return {read,update};
}
