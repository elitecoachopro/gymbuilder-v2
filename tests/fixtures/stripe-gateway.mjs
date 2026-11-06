import http from 'node:http';
import {randomUUID} from 'node:crypto';
const sessions=new Map(),intents=new Map(),keys=new Map();
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1:3115');let raw='';for await(const chunk of req)raw+=chunk;
  const reply=(body,status=200)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(body));};
  if(url.pathname==='/_test/reset'){sessions.clear();intents.clear();keys.clear();return reply({ok:true});}
  if(url.pathname==='/_test/state')return reply({sessions:[...sessions.values()]});
  if(url.pathname==='/_test/settle'){
   const {id,refunded=false}=JSON.parse(raw);const s=sessions.get(id);if(!s)return reply({error:'missing'},404);
   s.status='complete';s.payment_status='paid';intents.set(s.payment_intent,{id:s.payment_intent,object:'payment_intent',status:'succeeded',livemode:false,amount_received:s.amount_total,currency:s.currency,latest_charge:{id:'ch_fixture',object:'charge',refunded}});return reply(s);
  }
  if(req.headers.authorization!=='Bearer sk_test_gymbuilder_fixture')return reply({error:{message:'Unexpected credentials'}},403);
  if(url.pathname==='/v1/account')return reply({id:'acct_GymBuilderFixture',object:'account',charges_enabled:true,details_submitted:true});
  if(url.pathname==='/v1/checkout/sessions' && req.method==='POST'){
   const key=req.headers['idempotency-key'];if(keys.has(key))return reply(sessions.get(keys.get(key)));
   const p=new URLSearchParams(raw);
   if(p.get('allowed_payment_method_types[0]')!=='card' || p.get('mode')!=='payment' || p.get('line_items[0][quantity]')!=='1')return reply({error:{message:'Bad checkout parameters'}},400);
   const id='cs_test_'+randomUUID().replaceAll('-','');const s={id,object:'checkout.session',mode:'payment',livemode:false,status:'open',payment_status:'unpaid',currency:p.get('line_items[0][price_data][currency]'),amount_total:Number(p.get('line_items[0][price_data][unit_amount]')),metadata:{order_id:p.get('metadata[order_id]'),purpose:p.get('metadata[purpose]')},payment_intent:'pi_'+randomUUID().replaceAll('-',''),url:'https://checkout.stripe.com/c/pay/'+id};
   sessions.set(id,s);keys.set(key,id);return reply(s);
  }
  const session=/^\/v1\/checkout\/sessions\/(cs_[a-zA-Z0-9_]+)$/.exec(url.pathname);
  if(session)return reply(sessions.get(session[1]) || {error:{message:'Not found'}},sessions.has(session[1])?200:404);
  const intent=/^\/v1\/payment_intents\/(pi_[a-zA-Z0-9]+)$/.exec(url.pathname);
  if(intent)return reply(intents.get(intent[1]) || {error:{message:'Not found'}},intents.has(intent[1])?200:404);
  return reply({error:{message:'Unknown fixture endpoint'}},404);
 }catch{res.writeHead(500);res.end('{}');}
});
server.listen(3115,'127.0.0.1');
