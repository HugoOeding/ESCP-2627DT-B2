import type { CSSProperties } from 'react';
import type { Category } from '../types';
import { categoryColor } from '../lib/categories';
import { cn } from '../lib/cn';

export interface ServiceIconProps {
  name: string;
  category: Category;
  size?: 32 | 40 | 48;
}

const sizes = { 32: 'h-8 w-8 text-label', 40: 'h-10 w-10 text-heading', 48: 'h-12 w-12 text-title' } as const;

/** Rounded category-colour tile with the service's first letter. No brand logos. */
export function ServiceIcon({ name, category, size = 40 }: ServiceIconProps) {
  const colors = categoryColor(category);
  const style = { '--tile': colors.light, '--tile-dark': colors.dark } as CSSProperties;
  return (
    <span
      aria-hidden="true"
      style={style}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md bg-[var(--tile)] font-bold text-text dark:bg-[var(--tile-dark)]',
        sizes[size],
      )}
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}
