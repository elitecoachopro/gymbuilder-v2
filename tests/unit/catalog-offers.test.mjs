import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalogOfferSelections } from '../../src/lib/catalog-offers.ts';

const product=(id,brand,extras={})=>({id,name:`Equipment ${id}`,supplier_id:`supplier-${brand}`,brand_id:brand,brand_name:brand,condition:'new',price_eur:100,images:['/equipment.webp'],description:null,...extras});
const suppliers=['A','B','C'].map(id=>({id:`supplier-${id}`,company_name:`Supplier ${id}`,country:'Romania'}));
const now=Date.parse('2026-11-03T10:00:00Z');

test('exclusive catalog picks remain fixed for12/24 hours and change only at their boundary',()=>{
 const products=Array.from({length:18},(_,n)=>product(String(n).padStart(2,'0'),['A','B','C'][n%3]));
 const start=Date.parse('2026-11-04T00:00:00+02:00');
 const first=catalogOfferSelections(products,suppliers,start+3600000);
 assert.equal(first.superPret.length,1);assert.equal(first.ofertaZilei.length,1);assert.equal(first.oferteleSaptamanii.length,12);
 assert.equal(new Set(Object.values(first).flat().map(p=>p.product_id)).size,14);
 const later=catalogOfferSelections([...products].reverse(),suppliers,start+5*3600000);
 for(const key of ['superPret','ofertaZilei']) {
  assert.equal(later[key][0].product_id,first[key][0].product_id);
  assert.equal(later[key][0].starts_at,first[key][0].starts_at);assert.equal(later[key][0].ends_at,first[key][0].ends_at);
 }
 const noon=catalogOfferSelections(products,suppliers,start+12*3600000);
 assert.notEqual(noon.superPret[0].product_id,first.superPret[0].product_id);assert.equal(noon.ofertaZilei[0].product_id,first.ofertaZilei[0].product_id);
 const tomorrow=catalogOfferSelections(products,suppliers,start+24*3600000);
 assert.notEqual(tomorrow.ofertaZilei[0].product_id,first.ofertaZilei[0].product_id);
 for(const time of [start,start+12*3600000-1,start+12*3600000,Date.parse('2026-03-29T01:30:00Z'),Date.parse('2026-10-25T01:30:00Z')]) {
  const picks=catalogOfferSelections(products,suppliers,time);
  for(const [key,hours] of [['superPret',12],['ofertaZilei',24]]) {
   const item=picks[key][0],from=Date.parse(item.starts_at),to=Date.parse(item.ends_at);
   assert.equal(to-from,hours*3600000);assert.ok(from<=time&&time<to);
  }
 }
});

test('catalog cards preserve price currency, quote-only prices, images and real product links',()=>{
 const rows=[product('1','A',{price_eur:null,listed_price_amount:1200,listed_price_currency:'USD'}),product('2','B',{price_eur:null,images:['/real.webp',null]})];
 const cards=Object.values(catalogOfferSelections(rows,suppliers,now)).flat();
 const usd=cards.find(p=>p.product_id==='1');assert.equal(usd.listed_price_currency,'USD');assert.equal(usd.listed_price_amount,1200);assert.equal(usd.price_eur,null);
 const quote=cards.find(p=>p.product_id==='2');assert.equal(quote.price_eur,null);assert.deepEqual(quote.product.images,['/real.webp']);
 assert.ok(cards.every(p=>p.selection==='catalog' && p.product.id===p.product_id && p.supplier.id===p.supplier_id));
});

test('catalog selections exclude missing suppliers, stay empty without products and handle a small catalog',()=>{
 assert.deepEqual(catalogOfferSelections([],suppliers,now),{superPret:[],ofertaZilei:[],oferteleSaptamanii:[]});
 const selections=catalogOfferSelections([product('1','A'),product('hidden','unknown')],suppliers,now);
 assert.ok(Object.values(selections).every(section=>section.length===1 && section[0].product_id==='1'));
});

test('each12-hour boundary selects a different product across midnight with at least3 products',()=>{
 for(const count of [3,18,59]) {
  const products=Array.from({length:count},(_,n)=>product(String(n).padStart(2,'0'),['A','B','C'][n%3]));
  const start=Date.parse('2026-11-04T00:00:00+02:00');let previous;
  for(let half=0;half<12;half++) {
   const picks=catalogOfferSelections(products,suppliers,start+half*12*3600000);
   if(previous) assert.notEqual(picks.superPret[0].product_id,previous);
   assert.notEqual(picks.superPret[0].product_id,picks.ofertaZilei[0].product_id);
   previous=picks.superPret[0].product_id;
  }
 }
});
