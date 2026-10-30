import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { api, db } from './helpers.mjs';
test('consultation is persisted and missing email delivery is reported truthfully', async t => {
 const email=`audit-${randomUUID()}@example.test`;t.after(()=>db.from('consultation_requests').delete().eq('email',email));
 const response=await api('/api/consultation',{body:{name:'Audit Consultation',email,phone:'+40700000000',businessStage:'idee',budget:'10000',message:'Local audit'}});
 assert.equal(response.status,200);assert.equal((await response.json()).emailSent,false);
 const {count}=await db.from('consultation_requests').select('id',{count:'exact',head:true}).eq('email',email);assert.equal(count,1);
 assert.equal((await api('/api/consultation',{body:{name:{bad:true},email,phone:123,businessStage:'invalid'}})).status,400);
});
