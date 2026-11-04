let counter = 0;

/** Random id via crypto.randomUUID, with a fallback for older browsers and test runners. */
export function createId(prefix = 'id'): string {
  const c: Crypto | undefined = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === 'function') {
    return `${prefix}-${c.randomUUID()}`;
  }
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
