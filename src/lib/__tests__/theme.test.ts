import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, prefersDark, resolveTheme, tokenColor } from '../theme';
import { CATEGORY_COLORS, categoryColor } from '../categories';
import { CATEGORIES, type Category } from '../../types';

afterEach(() => {
  document.documentElement.classList.remove('dark');
  document.documentElement.style.removeProperty('--primary');
  vi.restoreAllMocks();
});

describe('theme', () => {
  it('resolves system themes', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
  });
  it('applies the dark class', () => {
    expect(applyTheme('dark')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(applyTheme('light')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
  it('follows matchMedia for system', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    expect(prefersDark()).toBe(true);
    expect(applyTheme('system')).toBe('dark');
  });
  it('reads token colours', () => {
    document.documentElement.style.setProperty('--primary', '91 63 217');
    expect(tokenColor('primary')).toBe('rgb(91 63 217)');
    expect(tokenColor('missing-token')).toBe('currentColor');
  });
});

describe('categories', () => {
  it('has a light and dark tile colour per category', () => {
    for (const c of CATEGORIES) {
      expect(categoryColor(c).light).toMatch(/^#/);
      expect(categoryColor(c).dark).toMatch(/0\.2\)$/);
    }
    expect(categoryColor('unknown' as Category)).toBe(CATEGORY_COLORS.other);
  });
});
