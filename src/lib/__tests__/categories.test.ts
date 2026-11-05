import { describe, expect, it } from 'vitest';
import { CATEGORY_COLORS, categoryColor } from '../categories';
import { CATEGORIES, type Category } from '../../types';

describe('categories', () => {
  it('has a light tile and a 20% dark tile per category', () => {
    for (const c of CATEGORIES) {
      expect(categoryColor(c).light).toMatch(/^#[0-9A-F]{6}$/);
      expect(categoryColor(c).dark).toMatch(/, 0\.2\)$/);
    }
    expect(categoryColor('unknown' as Category)).toBe(CATEGORY_COLORS.other);
  });
});
