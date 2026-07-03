import { LocaleDict } from './locales';

const en: LocaleDict = {
  /* ---- App / Titlebar ---- */
  appTitle: 'InkCode',
  appSubtitle: 'Handwriting IDE',

  /* ---- Activity Bar ---- */
  activityExplorer: 'Explorer',
  activitySearch: 'Search',
  activitySourceControl: 'Source Control',
  activityExtensions: 'Extensions',
  activitySettings: 'Settings',

  /* ---- Sidebar ---- */
  sidebarFiles: 'Files',
  sidebarSearch: 'Search in files',
  sidebarNoFiles: 'No folder opened',
  sidebarOpenFolder: 'Open Folder',

  /* ---- Editor Area ---- */
  editorPlaceholder: 'Start coding or writing here...',
  editorLanguage: 'Language',
  editorTheme: 'Theme',
  editorFontSize: 'Font Size',
  editorTabSize: 'Tab Size',

  /* ---- Krita Toolbox ---- */
  toolBrush: 'Brush',
  toolEraser: 'Eraser',
  toolColorPicker: 'Color Picker',
  toolArrow: 'Arrow',
  toolHighlight: 'Highlight',
  toolTextBox: 'Text Box',
  toolSelect: 'Select',

  /* ---- Krita Canvas ---- */
  canvasLayers: 'Layers',
  canvasLayerInk: 'Ink',
  canvasLayerAnnotation: 'Annotations',
  canvasLayerHighlight: 'Highlights',
  canvasClearLayer: 'Clear Layer',
  canvasClearAll: 'Clear All',

  /* ---- Color Picker ---- */
  colorPickerLabel: 'Color',
  colorInkDefault: 'Ink Color',
  colorAnnotationDefault: 'Annotation Color',
  colorHighlightDefault: 'Highlight Color',
  colorSwatches: 'Swatches',
  colorCustom: 'Custom',

  /* ---- Brush Settings ---- */
  brushSize: 'Size',
  brushOpacity: 'Opacity',
  brushPressure: 'Pressure Sensitive',
  brushSmoothing: 'Smoothing',
  brushSmoothingNone: 'None',
  brushSmoothingLight: 'Light',
  brushSmoothingHeavy: 'Heavy',

  /* ---- Mode Switching ---- */
  modeCode: 'Code',
  modeWrite: 'Write',
  modeAnnotate: 'Annotate',

  /* ---- Export ---- */
  exportTitle: 'Export',
  exportFormat: 'Format',
  exportPng: 'PNG Image',
  exportSvg: 'SVG Vector',
  exportSource: 'Source Code',
  exportLanguage: 'Language',
  exportIncludeAnnotations: 'Include Annotations',
  exportIncludeHighlights: 'Include Highlights',
  exportConvert: 'Convert & Insert',
  exportSave: 'Export',
  exportCancel: 'Cancel',
  exportConvertedCode: 'Converted Code',
  exportHandwritingResult: 'Handwriting Recognition Result',

  /* ---- Bridge ---- */
  bridgeRecognize: 'Recognize',
  bridgeInsertCode: 'Insert at Cursor',
  bridgeReplaceLine: 'Replace Line',
  bridgeScanning: 'Scanning handwriting...',
  bridgeNoText: 'No text recognized',
  bridgeInserted: 'Code inserted',

  /* ---- Status Bar ---- */
  statusMode: 'Mode',
  statusPosition: 'Pos',
  statusPressure: 'Pressure',
  statusStrokes: 'Strokes',
  statusLines: 'Lines',

  /* ---- Settings ---- */
  settingsTitle: 'Settings',
  settingsTheme: 'Color Theme',
  settingsThemeLight: 'Light',
  settingsThemeDark: 'Dark',
  settingsThemeCustom: 'Custom',
  settingsLanguage: 'Language',
  settingsLanguageChinese: '中文',
  settingsLanguageEnglish: 'English',
  settingsAutoSave: 'Auto Save',

  /* ---- Actions ---- */
  actionNewFile: 'New File',
  actionOpenFile: 'Open File...',
  actionSaveFile: 'Save',
  actionUndo: 'Undo',
  actionRedo: 'Redo',
  actionZoomIn: 'Zoom In',
  actionZoomOut: 'Zoom Out',

  /* ---- Messages ---- */
  msgExportSuccess: 'Export successful',
  msgExportError: 'Export failed',
  msgOcrInitializing: 'Initializing OCR engine...',
  msgOcrReady: 'OCR engine ready',
  msgOcrError: 'OCR recognition failed',

  /* ---- Default Code ---- */
  defaultCodePython: `def hello():
    print("Hello from InkCode!")

class Calculator:
    def add(self, a, b):
        return a + b

    def multiply(self, a, b):
        return a * b`,
  defaultCodeJavaScript: `function greet(name) {
    console.log(\`Hello, \${name}!\`);
}

class Counter {
    constructor() {
        this.count = 0;
    }
    increment() {
        this.count++;
    }
}`,
  defaultCodeCPP: `#include <iostream>
#include <vector>

class Matrix {
public:
    int rows, cols;
    std::vector<std::vector<double>> data;

    Matrix(int r, int c) : rows(r), cols(c) {
        data.resize(r, std::vector<double>(c, 0));
    }
};`,

  /* ---- Language Names ---- */
  langPython: 'Python',
  langJavaScript: 'JavaScript',
  langTypeScript: 'TypeScript',
  langCPP: 'C++',
  langJava: 'Java',
  langHTML: 'HTML',
  langCSS: 'CSS',
  langJSON: 'JSON',
  langMarkdown: 'Markdown',
};

export default en;
