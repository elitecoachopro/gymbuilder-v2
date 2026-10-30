import { writeFile } from 'node:fs/promises';
export const runtime='nodejs';
export async function POST(request:Request) {
 if(request.headers.get('origin')!=='http://127.0.0.1:3100'||request.headers.get('host')!=='127.0.0.1:3100')return new Response('Forbidden',{status:403});
 if(request.headers.get('content-type')!=='video/webm')return new Response('WebM required',{status:415});
 const reader=request.body?.getReader();if(!reader)return new Response('Missing video',{status:400});
 const chunks:Uint8Array[]=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>120*1024*1024){await reader.cancel();return new Response('Video too large',{status:413});}chunks.push(value);}
 if(size<1000)return new Response('Empty recording',{status:400});
 await writeFile('/tmp/imperial-gym-tour-v9.webm',Buffer.concat(chunks));
 return Response.json({saved:true,bytes:size});
}
