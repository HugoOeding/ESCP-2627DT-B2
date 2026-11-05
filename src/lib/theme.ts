import type { Theme } from '../types';

export function prefersDark(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

export function resolveTheme(theme: Theme, systemDark: boolean): 'light' | 'dark' {
  if (theme === 'system') return systemDark ? 'dark' : 'light';
  return theme;
}

/** Sets or removes the `dark` class on <html>. */
export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): 'light' | 'dark' {
  const resolved = resolveTheme(theme, prefersDark());
  root.classList.toggle('dark', resolved === 'dark');
  return resolved;
}

/** Reads a design token (an RGB triplet CSS variable) as a colour string, e.g. for Recharts. */
export function tokenColor(name: string, root: HTMLElement = document.documentElement): string {
  const value = getComputedStyle(root).getPropertyValue(`--${name}`).trim();
  return value ? `rgb(${value.split(/\s+/).join(' ')})` : 'currentColor';
}
