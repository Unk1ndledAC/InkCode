import { LocaleDict } from './locales';

const zh: LocaleDict = {
  /* ---- App / Titlebar ---- */
  appTitle: 'InkCode',
  appSubtitle: '手写代码 IDE',

  /* ---- Activity Bar ---- */
  activityExplorer: '资源管理器',
  activitySearch: '搜索',
  activitySourceControl: '源代码管理',
  activityExtensions: '扩展',
  activitySettings: '设置',

  /* ---- Sidebar ---- */
  sidebarFiles: '文件',
  sidebarSearch: '在文件中搜索',
  sidebarNoFiles: '未打开文件夹',
  sidebarOpenFolder: '打开文件夹',

  /* ---- Editor Area ---- */
  editorPlaceholder: '在此编写或手写代码...',
  editorLanguage: '语言',
  editorTheme: '主题',
  editorFontSize: '字体大小',
  editorTabSize: 'Tab 大小',

  /* ---- Krita Toolbox ---- */
  toolBrush: '画笔',
  toolEraser: '橡皮擦',
  toolColorPicker: '取色器',
  toolArrow: '箭头',
  toolHighlight: '高亮',
  toolTextBox: '文本框',
  toolSelect: '选择',

  /* ---- Krita Canvas ---- */
  canvasLayers: '图层',
  canvasLayerInk: '墨迹',
  canvasLayerAnnotation: '标注',
  canvasLayerHighlight: '高亮',
  canvasClearLayer: '清空图层',
  canvasClearAll: '清空全部',

  /* ---- Color Picker ---- */
  colorPickerLabel: '颜色',
  colorInkDefault: '墨迹颜色',
  colorAnnotationDefault: '标注颜色',
  colorHighlightDefault: '高亮颜色',
  colorSwatches: '色板',
  colorCustom: '自定义',

  /* ---- Brush Settings ---- */
  brushSize: '大小',
  brushOpacity: '不透明度',
  brushPressure: '压感',
  brushSmoothing: '平滑',
  brushSmoothingNone: '无',
  brushSmoothingLight: '轻度',
  brushSmoothingHeavy: '重度',

  /* ---- Mode Switching ---- */
  modeCode: '代码',
  modeWrite: '手写',
  modeAnnotate: '标注',

  /* ---- Export ---- */
  exportTitle: '导出',
  exportFormat: '格式',
  exportPng: 'PNG 图片',
  exportSvg: 'SVG 矢量图',
  exportSource: '源代码',
  exportLanguage: '语言',
  exportIncludeAnnotations: '包含标注',
  exportIncludeHighlights: '包含高亮',
  exportConvert: '转换并插入',
  exportSave: '导出',
  exportCancel: '取消',
  exportConvertedCode: '转换后的代码',
  exportHandwritingResult: '手写识别结果',

  /* ---- Bridge ---- */
  bridgeRecognize: '识别手写',
  bridgeInsertCode: '插入到光标处',
  bridgeReplaceLine: '替换当前行',
  bridgeScanning: '正在识别手写内容...',
  bridgeNoText: '未识别到文字',
  bridgeInserted: '代码已插入',

  /* ---- Status Bar ---- */
  statusMode: '模式',
  statusPosition: '坐标',
  statusPressure: '压感',
  statusStrokes: '笔画',
  statusLines: '行',

  /* ---- Settings ---- */
  settingsTitle: '设置',
  settingsTheme: '颜色主题',
  settingsThemeLight: '浅色',
  settingsThemeDark: '深色',
  settingsThemeCustom: '自定义',
  settingsLanguage: '语言',
  settingsLanguageChinese: '中文',
  settingsLanguageEnglish: 'English',
  settingsAutoSave: '自动保存',

  /* ---- Actions ---- */
  actionNewFile: '新建文件',
  actionOpenFile: '打开文件...',
  actionSaveFile: '保存',
  actionUndo: '撤销',
  actionRedo: '重做',
  actionZoomIn: '放大',
  actionZoomOut: '缩小',

  /* ---- Messages ---- */
  msgExportSuccess: '导出成功',
  msgExportError: '导出失败',
  msgOcrInitializing: '正在初始化 OCR 引擎...',
  msgOcrReady: 'OCR 引擎就绪',
  msgOcrError: 'OCR 识别失败',

  /* ---- Default Code ---- */
  defaultCodePython: `def hello():
    print("你好，来自 InkCode！")

class Calculator:
    def add(self, a, b):
        return a + b

    def multiply(self, a, b):
        return a * b`,
  defaultCodeJavaScript: `function greet(name) {
    console.log(\`你好, \${name}!\`);
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

export default zh;
