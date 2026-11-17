/**
 * Minimal i18n: Bahasa Indonesia (default) and English.
 * `tr()` is for plain code (labels, toasts, dialogue); components use `useT()` from ./useT
 * so they re-render when the language changes.
 */
import { en, type Dict } from './en';
import { id } from './id';

export type Lang = 'id' | 'en';
export const LANGS: { code: Lang; label: string }[] = [
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'en', label: 'English' },
];
export const DICTS: Record<Lang, Dict> = { id, en };

let langSource: () => Lang = () => 'id';
/** The game store registers itself here (avoids a circular import). */
export function setLangSource(fn: () => Lang) {
  langSource = fn;
}
export function currentLang(): Lang {
  return langSource();
}
export function tr(): Dict {
  return DICTS[langSource()] ?? id;
}
export type { Dict };
