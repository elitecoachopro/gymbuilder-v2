const original=globalThis.fetch;
globalThis.fetch=(input,options)=>{
 const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
 if(url.hostname==='api.stripe.com'){
  const headers=new Headers(options?.headers || (input instanceof Request?input.headers:undefined));
  if(headers.get('authorization')!=='Bearer sk_test_gymbuilder_fixture')throw Error('Fixture refused unexpected Stripe credentials');
  return original('http://127.0.0.1:3115'+url.pathname+url.search,options);
 }
 return original(input,options);
};
