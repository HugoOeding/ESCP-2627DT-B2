import type { Language, Translate, TranslateVars } from '../types';
import en from './en.json';
import de from './de.json';

export type Dictionary = Record<string, string>;

export const dictionaries: Record<Language, Dictionary> = { en, de };

function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  );
}

/** Looks up `key` in the language dictionary. A numeric `count` selects `key_one` / `key_other`. */
export function translate(lang: Language, key: string, vars?: TranslateVars): string {
  const dict = dictionaries[lang] ?? dictionaries.en;
  let resolved = key;
  if (vars && typeof vars.count === 'number') {
    const plural = `${key}_${vars.count === 1 ? 'one' : 'other'}`;
    if (plural in dict || plural in dictionaries.en) resolved = plural;
  }
  const template = dict[resolved] ?? dictionaries.en[resolved] ?? key;
  return interpolate(template, vars);
}

export function makeT(lang: Language): Translate {
  return (key, vars) => translate(lang, key, vars);
}
