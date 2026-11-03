import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalogOfferSelections } from '../../src/lib/catalog-offers.ts';

const product=(id,brand,extras={})=>({id,name:`Equipment ${id}`,supplier_id:`supplier-${brand}`,brand_id:brand,brand_name:brand,condition:'new',price_eur:100,images:['/equipment.webp'],description:null,...extras});
const suppliers=['A','B','C'].map(id=>({id:`supplier-${id}`,company_name:`Supplier ${id}`,country:'Romania'}));
const now=Date.parse('2026-11-03T10:00:00Z');

test('catalog selections are stable within a Bucharest day, rotate between days and balance manufacturers',()=>{
 const products=Array.from({length:18},(_,n)=>product(String(n).padStart(2,'0'),['A','B','C'][n%3]));
 const first=catalogOfferSelections(products,suppliers,now);
 const ids=selection=>Object.values(selection).flat().map(p=>p.product_id);
 assert.equal(new Set(ids(first)).size,18);
 assert.deepEqual(ids(catalogOfferSelections([...products].reverse(),suppliers,now+3600000)),ids(first));
 assert.notDeepEqual(ids(catalogOfferSelections(products,suppliers,now+86400000)),ids(first));
 for(const section of Object.values(first)) assert.equal(new Set(section.map(p=>p.brand_name)).size,3);
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
