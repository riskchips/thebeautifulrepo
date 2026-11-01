import {createServer} from '../src/server.mjs';

const server=await createServer({readOnly:true});
const requestHandler=server.listeners('request')[0];

export default async function handler(request,response) {
  // Preserve the requested API route when Vercel rewrites to this one function.
  const url=new URL(request.url,'https://localhost');
  const route=url.searchParams.get('__stellar_path');
  if(route!==null){
    url.searchParams.delete('__stellar_path');
    request.url='/api/'+route+(url.search?'?'+url.searchParams.toString():'');
  }
  return requestHandler(request,response);
}
