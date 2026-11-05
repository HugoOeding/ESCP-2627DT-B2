import { describe, expect, it, vi } from 'vitest';
import { createId } from '../id';

describe('createId', () => {
  it('uses crypto.randomUUID when available', () => {
    expect(createId('sub')).toMatch(/^sub-[0-9a-f-]{36}$/);
  });
  it('falls back without crypto.randomUUID', () => {
    const spy = vi.spyOn(globalThis, 'crypto', 'get').mockReturnValue({} as Crypto);
    const a = createId();
    const b = createId();
    expect(a).toMatch(/^id-/);
    expect(a).not.toBe(b);
    spy.mockRestore();
  });
});
