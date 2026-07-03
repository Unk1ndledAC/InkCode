import { ThemeColors, ThemeDefinition } from './types';
import { themes, ThemeId, DEFAULT_THEME } from './themes';

export type { ThemeId };
export { themes };

const STORAGE_KEY = 'inkcode.theme';

let currentThemeId: ThemeId = DEFAULT_THEME;
let currentTheme: ThemeDefinition = themes[DEFAULT_THEME];
const listeners: Array<() => void> = [];

function applyCssVariables(colors: ThemeColors): void {
  const root = document.documentElement;
  const map: Record<string, string> = {
    '--ink-bg-main': colors.bgMain,
    '--ink-bg-sidebar': colors.bgSidebar,
    '--ink-bg-editor': colors.bgEditor,
    '--ink-bg-canvas': colors.bgCanvas,
    '--ink-bg-toolbar': colors.bgToolbar,
    '--ink-bg-statusbar': colors.bgStatusBar,
    '--ink-bg-titlebar': colors.bgTitlebar,
    '--ink-bg-panel': colors.bgPanel,
    '--ink-bg-input': colors.bgInput,
    '--ink-bg-dropdown': colors.bgDropdown,
    '--ink-bg-button': colors.bgButton,
    '--ink-bg-button-hover': colors.bgButtonHover,
    '--ink-bg-active': colors.bgActive,
    '--ink-bg-hover': colors.bgHover,
    '--ink-text-primary': colors.textPrimary,
    '--ink-text-secondary': colors.textSecondary,
    '--ink-text-muted': colors.textMuted,
    '--ink-text-inverse': colors.textInverse,
    '--ink-border': colors.borderColor,
    '--ink-border-focus': colors.borderFocus,
    '--ink-accent-primary': colors.accentPrimary,
    '--ink-accent-secondary': colors.accentSecondary,
    '--ink-accent-success': colors.accentSuccess,
    '--ink-accent-warning': colors.accentWarning,
    '--ink-accent-error': colors.accentError,
  };
  for (const [key, value] of Object.entries(map)) {
    root.style.setProperty(key, value);
  }
}

export function setTheme(themeId: ThemeId): void {
  if (!themes[themeId]) return;
  currentThemeId = themeId;
  currentTheme = themes[themeId];
  applyCssVariables(currentTheme.colors);
  try { localStorage.setItem(STORAGE_KEY, themeId); } catch (_) { /* ignore */ }
  for (const cb of listeners) {
    try { cb(); } catch (e) { console.error(e); }
  }
}

export function getTheme(): ThemeDefinition {
  return currentTheme;
}

export function getThemeId(): ThemeId {
  return currentThemeId;
}

export function getThemeColors(): ThemeColors {
  return currentTheme.colors;
}

export function initTheme(): ThemeId {
  let saved: ThemeId | null = null;
  try { saved = localStorage.getItem(STORAGE_KEY) as ThemeId; } catch (_) { /* ignore */ }
  const id: ThemeId = (saved && themes[saved]) ? saved : DEFAULT_THEME;
  setTheme(id);
  return id;
}

export function onThemeChange(cb: () => void): void {
  listeners.push(cb);
}

export function getAvailableThemes(): ThemeDefinition[] {
  return Object.values(themes);
}
