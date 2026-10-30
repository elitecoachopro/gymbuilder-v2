import test from 'node:test';
import assert from 'node:assert/strict';
import { demoBuildingSpace } from '../../src/lib/gym-building.ts';
import { restoreLoginHandoff } from '../../src/lib/gym-login-handoff.ts';
const now=1_000_000;
const document={name:'Two-floor recovery',height:3.5,budget:null,brief:'Keep all equipment',space:demoBuildingSpace()};
const record={owner:'guest',nonce:'one-use',createdAt:now,document,storey:1,projectId:null,savedFingerprint:'',tab:'ai'};
test('complete login handoff restores both floors, brief and active floor without mutating the source',()=>{
 const raw=JSON.stringify(record);const result=restoreLoginHandoff(raw,'one-use','client-a',now);
 assert.deepEqual(result.document,document);assert.equal(result.storey,1);assert.equal(result.tab,'ai');assert.equal(result.document.space.items.length,40);assert.equal(result.document.space.upperFloor.items.length,17);assert.equal(JSON.stringify(record),raw);
});
test('expired, wrong-account, malformed and invalid-geometry handoffs never restore a project',()=>{
 for(const input of [null,'not-json',JSON.stringify({...record,createdAt:now-3_600_001}),JSON.stringify({...record,owner:'client-b'}),JSON.stringify({...record,nonce:'other'}),JSON.stringify({...record,document:{...document,height:-1}}),JSON.stringify({...record,document:{...document,space:{...document.space,outline:[]}}})]) assert.throws(()=>restoreLoginHandoff(input,'one-use','client-a',now));
});
