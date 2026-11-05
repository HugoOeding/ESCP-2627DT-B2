import type { Category } from '../types';

/**
 * Category tile colours (design.md §3.1), the only hard-coded colours in the app.
 * Light: the pastel tile. Dark: the same hue at 20% opacity over `surface`.
 * news, gaming and food have no colour in design.md; they borrow neighbouring hues (DECISIONS.md).
 */
export const CATEGORY_COLORS: Record<Category, { light: string; dark: string }> = {
  streaming: { light: '#E9E4FF', dark: 'rgba(143, 123, 255, 0.2)' },
  music: { light: '#E0F2FE', dark: 'rgba(56, 189, 248, 0.2)' },
  fitness: { light: '#E3F5EC', dark: 'rgba(76, 195, 138, 0.2)' },
  sports: { light: '#FFF1DB', dark: 'rgba(240, 178, 84, 0.2)' },
  software: { light: '#EFEFF5', dark: 'rgba(163, 163, 178, 0.2)' },
  cloud: { light: '#EFEFF5', dark: 'rgba(163, 163, 178, 0.2)' },
  news: { light: '#E0F2FE', dark: 'rgba(56, 189, 248, 0.2)' },
  gaming: { light: '#E9E4FF', dark: 'rgba(143, 123, 255, 0.2)' },
  food: { light: '#FFF1DB', dark: 'rgba(240, 178, 84, 0.2)' },
  other: { light: '#F3E8EE', dark: 'rgba(232, 121, 166, 0.2)' },
};

export function categoryColor(category: Category): { light: string; dark: string } {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other;
}
