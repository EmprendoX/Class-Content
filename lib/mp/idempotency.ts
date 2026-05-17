const TTL_MS = 10 * 60 * 1000;
const store = new Map<string, number>();

function gc(now: number) {
  for (const [key, exp] of store) {
    if (exp <= now) store.delete(key);
  }
}

export function wasProcessed(key: string): boolean {
  const now = Date.now();
  gc(now);
  const exp = store.get(key);
  return typeof exp === 'number' && exp > now;
}

export function markProcessed(key: string): void {
  const now = Date.now();
  gc(now);
  store.set(key, now + TTL_MS);
}

export function _resetForTests(): void {
  store.clear();
}
