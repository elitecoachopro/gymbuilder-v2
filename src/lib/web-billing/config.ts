export function webBillingConfig(env: NodeJS.ProcessEnv = process.env) {
 const live = env.WEB_PROMOTION_PAYMENTS_MODE === 'live';
 const key = env.STRIPE_SECRET_KEY || '';
 const account = env.GYM_BUILDER_STRIPE_ACCOUNT_ID || '';
 const testUsers = (env.WEB_PROMOTION_TEST_USERS || '').split(',').map(v=>v.trim()).filter(Boolean);
 const configured = ['test','live'].includes(env.WEB_PROMOTION_PAYMENTS_MODE || '')
   && /^(sk|rk)_(live|test)_/.test(key) && key.includes(live ? '_live_' : '_test_')
   && /^acct_[a-zA-Z0-9]+$/.test(account) && Boolean(env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_'))
;
 const enabled = env.WEB_PROMOTION_PAYMENTS_ENABLED === 'true' && configured && (live || testUsers.length>0);
 return { configured: Boolean(configured), enabled: Boolean(enabled), live, account, testUsers };
}
