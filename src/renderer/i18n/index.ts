import { LocaleDict, LocaleKey } from './locales';

export type SupportedLocale = 'en' | 'zh';

let currentLocale: SupportedLocale = 'en';
let currentDict: LocaleDict | null = null;
const listeners: Array<() => void> = [];

function loadDict(locale: SupportedLocale): LocaleDict {
  // Dynamic import is handled by webpack code-splitting
  // but we need synchronous access for templates, so we use
  // a module-level cache loaded at init time.
  // The actual locale file is loaded by the workbench's import.
  return currentDict!;
}

export function setLocaleDict(dict: LocaleDict): void {
  currentDict = dict;
}

export function setLocale(locale: SupportedLocale): void {
  currentLocale = locale;
  // The actual re-loading is done by the workbench which
  // will re-import the correct locale and call setLocaleDict
}

export function getLocale(): SupportedLocale {
  return currentLocale;
}

/** Returns the translated string for the given key. */
export function t(key: LocaleKey): string {
  if (!currentDict) {
    console.warn('i18n: locale dict not loaded yet, key:', key);
    return key;
  }
  const val = currentDict[key];
  if (val === undefined) {
    console.warn('i18n: missing translation for key:', key);
    return key;
  }
  return val;
}

/** Subscribe to locale changes. */
export function onLocaleChange(cb: () => void): void {
  listeners.push(cb);
}

/** Notify all listeners that locale changed. */
export function notifyLocaleChange(): void {
  for (const cb of listeners) {
    try { cb(); } catch (e) { console.error(e); }
  }
}
