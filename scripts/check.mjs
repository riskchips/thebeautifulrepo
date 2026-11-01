import {readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
async function walk(dir){const entries=await readdir(dir,{withFileTypes:true});const files=[];for(const entry of entries){const path=resolve(dir,entry.name);if(entry.isDirectory())files.push(...await walk(path));else if(/\.(mjs|js)$/.test(path))files.push(path);}return files;}
let failed=false;for(const file of [...await walk('api'),...await walk('src'),...await walk('public'),...await walk('tests')]){const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});if(result.status!==0)failed=true;}
if(failed)process.exit(1);console.log('All JavaScript files parse. This does not verify application behaviour.');
