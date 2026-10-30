import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProductImageUploader } from '../../src/lib/product-image-upload.ts';
const file = () => new File(['test'], 'audit.png', { type: 'image/png' });
test('successful uploads are reused when publication is retried', async () => {
 let calls=0;const upload=createProductImageUploader(async()=>{calls++;return Response.json({url:'https://example.test/audit.png'});});const image=file();
 assert.equal(await upload(image,'products'),'https://example.test/audit.png');await upload(image,'products');assert.equal(calls,1);
 await upload(image,'products-360');assert.equal(calls,2);
});
test('short upload rate limits retry after the requested interval', async () => {
 let calls=0;const waits=[];const upload=createProductImageUploader(async()=>++calls===1?Response.json({error:'Wait'},{status:429,headers:{'Retry-After':'1'}}):Response.json({url:'https://example.test/audit.png'}),async ms=>{waits.push(ms);});
 await upload(file(),'products');assert.equal(calls,2);assert.deepEqual(waits,[1000]);
});
test('failed or malformed upload responses never become a successful image', async () => {
 const failed=createProductImageUploader(async()=>Response.json({error:'Failed'},{status:500}));await assert.rejects(()=>failed(file(),'products'),/Failed/);
 const malformed=createProductImageUploader(async()=>Response.json({success:true}));await assert.rejects(()=>malformed(file(),'products'));
});
