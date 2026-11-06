import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emailPlainText,escapeEmailHtml,sendTransactionalEmail} from '../../src/lib/transactional-email.ts';

test('transactional text retains actionable verification links and decodes escaped text',()=>{
 const html='<p>Salut Ana &amp; Dan</p><p><a href="https://www.gymbuilder.app/api/auth/verify-email?token=abc&amp;x=1">Confirmă emailul</a></p>';
 const text=emailPlainText(html);
 assert.ok(text.includes('Ana & Dan'));assert.ok(text.includes('https://www.gymbuilder.app/api/auth/verify-email?token=abc&x=1'));assert.ok(!text.includes('<p>'));
 assert.equal(escapeEmailHtml('<img src=x>'),'&lt;img src=x&gt;');
});
test('transactional email has aligned sender, reply address, HTML and plaintext; acceptance needs a provider id',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});
 globalThis.fetch=async(url,opts)=>{const p=JSON.parse(opts.body);assert.equal(url,'https://api.resend.com/emails');assert.equal(p.from,'Gym Builder <contact@gymbuilder.app>');assert.equal(p.reply_to,'contact@gymbuilder.app');assert.equal(p.text,'Cont aprobat');return Response.json({id:'fixture'});};
 assert.deepEqual(await sendTransactionalEmail('owner@example.test','Aprobare','<p>Cont aprobat</p>','fixture'),{id:'fixture'});
 globalThis.fetch=async()=>Response.json({});await assert.rejects(sendTransactionalEmail('owner@example.test','A','<p>A</p>','fixture'),/INVALID_RESPONSE/);
 globalThis.fetch=async()=>new Response('{}',{status:422});await assert.rejects(sendTransactionalEmail('owner@example.test','A','<p>A</p>','fixture'),/REJECTED/);
});
test('confirmation templates escape names, preserve usable token links and use plaintext',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});const previous=process.env.RESEND_API_KEY;process.env.RESEND_API_KEY='fixture';t.after(()=>{if(previous===undefined)delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=previous;});
 const {sendVerificationEmail,sendPasswordResetEmail}=await import('../../src/lib/email.ts');const payloads=[];
 globalThis.fetch=async(url,options)=>{payloads.push(JSON.parse(options.body));return Response.json({id:'fixture'});};
 await sendVerificationEmail('owner@example.test','abc123','<script>x</script>');await sendPasswordResetEmail('owner@example.test','reset123','Ana');
 assert.ok(!payloads[0].html.includes('<script>'));assert.ok(payloads[0].text.includes('/api/auth/verify-email?token=abc123'));assert.ok(payloads[1].text.includes('/reset-password?token=reset123'));assert.ok(payloads.every(p=>p.reply_to==='contact@gymbuilder.app'));
});
test('supplier approval uses a factual actionable template with a monitored reply address',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});const previous=process.env.RESEND_API_KEY;process.env.RESEND_API_KEY='fixture';t.after(()=>{if(previous===undefined)delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=previous;});
 const {sendSupplierApprovalEmail}=await import('../../src/lib/email.ts');let payload;
 globalThis.fetch=async(url,options)=>{payload=JSON.parse(options.body);return Response.json({id:'fixture'});};
 await sendSupplierApprovalEmail('owner@example.test','Ana','<Company>','service');
 assert.ok(payload.html.includes('&lt;Company&gt;'));assert.ok(payload.text.includes('serviciile de service și mentenanță'));assert.ok(payload.text.includes('/supplier/dashboard'));assert.equal(payload.reply_to,'contact@gymbuilder.app');
});
