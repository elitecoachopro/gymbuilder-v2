const imageLimits: Record<string, number> = { free: 1, starter: 5, professional: 10, enterprise: Infinity };
export function getPlanImageLimit(plan: string) {
  return typeof imageLimits[plan] === 'number' ? imageLimits[plan] : imageLimits.free;
}
