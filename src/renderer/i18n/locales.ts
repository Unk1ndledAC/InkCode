/** All translatable strings for InkCode. Add new keys here then provide translations in each language file. */
export interface LocaleDict {
  /* ---- App / Titlebar ---- */
  appTitle: string;
  appSubtitle: string;

  /* ---- Activity Bar ---- */
  activityExplorer: string;
  activitySearch: string;
  activitySourceControl: string;
  activityExtensions: string;
  activitySettings: string;

  /* ---- Sidebar ---- */
  sidebarFiles: string;
  sidebarSearch: string;
  sidebarNoFiles: string;
  sidebarOpenFolder: string;

  /* ---- Editor Area ---- */
  editorPlaceholder: string;
  editorLanguage: string;
  editorTheme: string;
  editorFontSize: string;
  editorTabSize: string;

  /* ---- Krita Toolbox ---- */
  toolBrush: string;
  toolEraser: string;
  toolColorPicker: string;
  toolArrow: string;
  toolHighlight: string;
  toolTextBox: string;
  toolSelect: string;

  /* ---- Krita Canvas ---- */
  canvasLayers: string;
  canvasLayerInk: string;
  canvasLayerAnnotation: string;
  canvasLayerHighlight: string;
  canvasClearLayer: string;
  canvasClearAll: string;

  /* ---- Color Picker ---- */
  colorPickerLabel: string;
  colorInkDefault: string;
  colorAnnotationDefault: string;
  colorHighlightDefault: string;
  colorSwatches: string;
  colorCustom: string;

  /* ---- Brush Settings ---- */
  brushSize: string;
  brushOpacity: string;
  brushPressure: string;
  brushSmoothing: string;
  brushSmoothingNone: string;
  brushSmoothingLight: string;
  brushSmoothingHeavy: string;

  /* ---- Mode Switching ---- */
  modeCode: string;
  modeWrite: string;
  modeAnnotate: string;

  /* ---- Export ---- */
  exportTitle: string;
  exportFormat: string;
  exportPng: string;
  exportSvg: string;
  exportSource: string;
  exportLanguage: string;
  exportIncludeAnnotations: string;
  exportIncludeHighlights: string;
  exportConvert: string;
  exportSave: string;
  exportCancel: string;
  exportConvertedCode: string;
  exportHandwritingResult: string;

  /* ---- Bridge ---- */
  bridgeRecognize: string;
  bridgeInsertCode: string;
  bridgeReplaceLine: string;
  bridgeScanning: string;
  bridgeNoText: string;
  bridgeInserted: string;

  /* ---- Status Bar ---- */
  statusMode: string;
  statusPosition: string;
  statusPressure: string;
  statusStrokes: string;
  statusLines: string;

  /* ---- Settings ---- */
  settingsTitle: string;
  settingsTheme: string;
  settingsThemeLight: string;
  settingsThemeDark: string;
  settingsThemeCustom: string;
  settingsLanguage: string;
  settingsLanguageChinese: string;
  settingsLanguageEnglish: string;
  settingsAutoSave: string;

  /* ---- Actions ---- */
  actionNewFile: string;
  actionOpenFile: string;
  actionSaveFile: string;
  actionUndo: string;
  actionRedo: string;
  actionZoomIn: string;
  actionZoomOut: string;

  /* ---- Messages ---- */
  msgExportSuccess: string;
  msgExportError: string;
  msgOcrInitializing: string;
  msgOcrReady: string;
  msgOcrError: string;

  /* ---- Default Code ---- */
  defaultCodePython: string;
  defaultCodeJavaScript: string;
  defaultCodeCPP: string;

  /* ---- Language Names ---- */
  langPython: string;
  langJavaScript: string;
  langTypeScript: string;
  langCPP: string;
  langJava: string;
  langHTML: string;
  langCSS: string;
  langJSON: string;
  langMarkdown: string;
}

export type LocaleKey = keyof LocaleDict;
