export interface ThemeColors {
  /* Backgrounds */
  bgMain: string;
  bgSidebar: string;
  bgEditor: string;
  bgCanvas: string;
  bgToolbar: string;
  bgStatusBar: string;
  bgTitlebar: string;
  bgPanel: string;
  bgInput: string;
  bgDropdown: string;
  bgButton: string;
  bgButtonHover: string;
  bgActive: string;
  bgHover: string;

  /* Text */
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  /* Borders */
  borderColor: string;
  borderFocus: string;

  /* Accent */
  accentPrimary: string;
  accentSecondary: string;
  accentSuccess: string;
  accentWarning: string;
  accentError: string;

  /* Monaco Editor theme name */
  monacoTheme: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  colors: ThemeColors;
}
