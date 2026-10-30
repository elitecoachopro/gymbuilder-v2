import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';

// Execute the real route with all external dependencies replaced. No provider,
// production database or mailbox is contacted by these checks.
async function routeHarness() {
 let source=await readFile(new URL('../../src/app/api/configurator/ai/route.ts',import.meta.url),'utf8');
 source=source.replace(/^import .*;\n/gm,'');
 const prefix=`export const calls={provider:0,rate:0};
 const NextResponse=Response;
 const getSessionUser=async()=>({id:'fixture-user'});
 const checkRateLimit=async()=>{calls.rate++;return {allowed:true}};
 const rateLimitResponse=()=>Response.json({}, {status:429});
 const prepareGymAiInput=()=>({input:{brief:'Fixture requirements',locale:'ro',context:{}},space:null,budget:null,context:{}});
 const requestGymAiDesign=async()=>{calls.provider++;return null};
 const buildGymProposal=()=>null;
 const buildZonedGymProposal=()=>null;
 const matchesGymAiMeasurements=()=>true;
 `;
 const code=stripTypeScriptTypes(prefix+source);
 return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64')+'#'+crypto.randomUUID());
}

test('AI route rejects absent, false and forged consent before contacting provider or rate accounting',async()=>{
 const oldKey=process.env.OPENAI_API_KEY,oldModel=process.env.OPENAI_GYM_MODEL;
 process.env.OPENAI_API_KEY='fixture';process.env.OPENAI_GYM_MODEL='fixture';
 try{
  const route=await routeHarness();
  for(const body of [{},{aiConsent:false},{aiConsent:'true'},null]){
   const r=await route.POST(new Request('http://fixture.test/api/configurator/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
   assert.equal(r.status,400);assert.equal((await r.json()).error,'AI_CONSENT_REQUIRED');
  }
  assert.equal(route.calls.provider,0);assert.equal(route.calls.rate,0);
  const r=await route.POST(new Request('http://fixture.test/api/configurator/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({aiConsent:true})}));
  assert.equal(r.status,502);assert.equal(route.calls.provider,1);assert.equal(route.calls.rate,1);
 }finally{
  if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;
  if(oldModel===undefined)delete process.env.OPENAI_GYM_MODEL;else process.env.OPENAI_GYM_MODEL=oldModel;
 }
});
