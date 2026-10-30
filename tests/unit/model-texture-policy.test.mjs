import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contentSecurityPolicy} from '../../src/lib/model-texture-policy.ts';

const options={isDevelopment:false,supabaseOrigin:'',devConnections:''};
test('the document policy supports embedded GLB image decoding across Next soft navigation',()=>{
 const policy=contentSecurityPolicy(options);
 assert.equal(policy,"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; font-src 'self'; connect-src 'self' blob:");
 assert.ok(!policy.includes("script-src 'self' blob:"));
});
test('Supabase and development connections retain their existing explicit allowances',()=>{
 const origin=' https://project.supabase.co';
 assert.ok(contentSecurityPolicy({...options,supabaseOrigin:origin}).endsWith("connect-src 'self' blob:"+origin));
 const dev=contentSecurityPolicy({...options,isDevelopment:true,devConnections:' ws://127.0.0.1:3000'});
 assert.ok(dev.includes("script-src 'self' 'unsafe-inline' 'unsafe-eval'"));
 assert.ok(dev.endsWith("connect-src 'self' blob: ws://127.0.0.1:3000"));
});
