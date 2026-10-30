import type { Json } from '@/types/database.generated';
export function jsonObject(value: Json | undefined): Record<string, Json | undefined> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
export function firstImage(value: Json | null): string | null {
  return Array.isArray(value) && typeof value[0] === 'string' ? value[0] : null;
}
