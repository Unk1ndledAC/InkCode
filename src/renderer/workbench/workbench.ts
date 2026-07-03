// InkCode Workbench — main application controller
// Glues together VS Code editor (left) and Krita canvas (right)

import '../styles/workbench.css';
import { CodeEditor, EditorConfig, DEFAULT_EDITOR_CONFIG } from '../editor/codeEditor';
import { InkCanvas, CanvasTool, BrushSettings } from '../canvas/inkCanvas';
import { InputManager, InputMode, SmoothingOptions } from '../input/inputManager';
import { ExportService } from '../export/exportService';
import { InkCodeBridge } from '../canvas/bridge';
import { t, setLocale, getLocale, setLocaleDict, onLocaleChange, SupportedLocale } from '../i18n/index';
import { initTheme, setTheme, getTheme, getThemeId, onThemeChange, ThemeId } from '../theme/index';
import { themes } from '../theme/themes';

// ==================== COLOR SWATCHES ====================
const COLOR_PALETTE = [
  '#e94560', '#533483', '#0f3460', '#16213e',
  '#1a1a2e', '#e94560', '#f39c12', '#2ecc71',
  '#3498db', '#9b59b6', '#1abc9c', '#e74c3c',
  '#f1c40f', '#e67e22', '#2c3e50', '#ecf0f1',
  '#95a5a6', '#34495e',
];

// ==================== APPLICATION STATE ====================
let editor: CodeEditor;
let inkCanvas: InkCanvas;
let inputManager: InputManager;
let exportService: ExportService;
let bridge: InkCodeBridge;
let currentMode: InputMode = InputMode.CODE;
let currentTool: CanvasTool = CanvasTool.BRUSH;
let minimapEnabled: boolean = true;
let wordWrapEnabled: boolean = false;

// ==================== INITIALIZATION ====================
async function init(): Promise<void> {
  const themeId = initTheme();
  document.documentElement.setAttribute('data-theme', themeId);

  editor = new CodeEditor();
  inputManager = new InputManager();

  const canvasWrapper = document.getElementById('krita-canvas-wrapper');
  if (!canvasWrapper) throw new Error('Canvas wrapper not found');
  inkCanvas = new InkCanvas(canvasWrapper, inputManager);

  bridge = new InkCodeBridge(inkCanvas, editor);
  exportService = new ExportService();

  const editorContainer = document.getElementById('code-editor');
  if (!editorContainer) throw new Error('Editor container not found');
  editor.create(editorContainer, {
    theme: getTheme().colors.monacoTheme,
    language: 'python',
  });

  bridge.init('eng').catch(() => {});

  const savedLocale = loadSavedLocale();
  await applyLocale(savedLocale);

  bindActivityBar();
  bindEditorTabs();
  bindFileTree();
  bindKritaToolbox();
  bindColorPicker();
  bindBrushSettings();
  bindLayerPanel();
  bindCanvasActions();
  bindExportDialog();
  bindModeTabs();
  bindStatusBar();
  bindSplitResizer();
  bindTitlebar();
  bindSettings();
  bindKeyboardShortcuts();
  bindBreadcrumb();
  bindSearchPanel();
  bindCommandPalette();
  bindNewFileDialog();
  bindContextMenu();
  bindCursorTracking();

  onThemeChange(() => {
    const theme = getTheme();
    const monacoEditor = editor.getEditor();
    if (monacoEditor) {
      monacoEditor.updateOptions({ theme: theme.colors.monacoTheme });
    }
    document.documentElement.setAttribute('data-theme', getThemeId());
  });

  onLocaleChange(refreshUI);

  // Close dialogs on overlay click
  document.querySelectorAll('.dialog-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) (overlay as HTMLElement).style.display = 'none';
    });
  });

  setAppMode(InputMode.CODE);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      inkCanvas.resize();
      editor.getEditor()?.layout();
    });
  });
  window.addEventListener('resize', () => {
    inkCanvas.resize();
    editor.getEditor()?.layout();
  });
  updateBreadcrumb();

  console.log('InkCode workbench initialized');
}

// ==================== MODE ====================
function setAppMode(mode: InputMode): void {
  currentMode = mode;
  inputManager.setMode(mode);
  inkCanvas.setMode(mode);
  document.querySelectorAll('.mode-tab').forEach(t => {
    t.classList.toggle('active', (t as HTMLElement).dataset.mode === mode);
  });
  const canvas = inkCanvas.el;
  canvas.className = mode === InputMode.CODE ? 'code' : mode === InputMode.INK ? 'write' : 'annotate';
  updateStatusBar();
}

// ==================== ACTIVITY BAR ====================
function bindActivityBar(): void {
  const buttons = document.querySelectorAll<HTMLElement>('.activity-btn');
  const panels = document.querySelectorAll<HTMLElement>('.sidebar-panel');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const panelName = btn.dataset.panel;
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      panels.forEach(p => p.classList.remove('active'));
      const panel = document.getElementById(`panel-${panelName}`);
      if (panel) panel.classList.add('active');
    });
  });
}

// ==================== EDITOR TABS ====================
function bindEditorTabs(): void {
  document.querySelectorAll('.editor-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('tab-close')) { closeTab(tab as HTMLElement); return; }
      activateTab(tab as HTMLElement);
    });
    // Middle-click to close
    tab.addEventListener('auxclick', (e) => {
      if ((e as MouseEvent).button === 1) closeTab(tab as HTMLElement);
    });
  });
}

function activateTab(tab: HTMLElement): void {
  document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  const lang = tab.dataset.lang || 'python';
  editor.setLanguage(lang);
  loadDefaultCodeForLang(lang);
  updateBreadcrumb();
}

function closeTab(tab: HTMLElement): void {
  const tabs = document.querySelectorAll('.editor-tab');
  if (tabs.length <= 1) return;
  const wasActive = tab.classList.contains('active');
  const next = tab.nextElementSibling || tab.previousElementSibling;
  tab.remove();
  if (wasActive && next) activateTab(next as HTMLElement);
}

// ==================== FILE TREE ====================
function bindFileTree(): void {
  document.querySelectorAll('.file-item').forEach(item => {
    item.addEventListener('click', () => switchFile(item as HTMLElement));
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const me = e as MouseEvent;
      showContextMenu(me.clientX, me.clientY, item as HTMLElement);
    });
  });

  document.getElementById('btn-new-file')?.addEventListener('click', () => {
    document.getElementById('newfile-dialog')!.style.display = 'flex';
    (document.getElementById('newfile-name') as HTMLInputElement).focus();
    (document.getElementById('newfile-name') as HTMLInputElement).select();
  });
}

function switchFile(item: HTMLElement): void {
  document.querySelectorAll('.file-item').forEach(f => f.classList.remove('file-active'));
  item.classList.add('file-active');
  const lang = item.dataset.lang || 'python';
  const fileName = item.dataset.file || 'untitled';
  // Activate matching tab or create one
  let tab: HTMLElement | null = null;
  document.querySelectorAll('.editor-tab').forEach(t => {
    if ((t as HTMLElement).dataset.file === fileName) tab = t as HTMLElement;
  });
  if (tab) { activateTab(tab); return; }
  addFileTab(fileName, lang);
}

function addFileTab(name: string, lang: string): void {
  const tabs = document.getElementById('editor-tabs');
  if (!tabs) return;
  const tab = document.createElement('div');
  tab.className = 'editor-tab active';
  tab.dataset.file = name;
  tab.dataset.lang = lang;
  tab.innerHTML = `<span class="tab-label">${name}</span><span class="tab-close">&times;</span>`;
  document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
  tabs.appendChild(tab);
  tab.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('tab-close')) { closeTab(tab); return; }
    activateTab(tab);
  });
  tab.addEventListener('auxclick', (e) => { if (e.button === 1) closeTab(tab); });

  const tree = document.getElementById('file-tree');
  if (tree) {
    const item = document.createElement('div');
    item.className = 'file-item file-active';
    item.dataset.file = name;
    item.dataset.lang = lang;
    item.textContent = `📄 ${name}`;
    document.querySelectorAll('.file-item').forEach(f => f.classList.remove('file-active'));
    tree.appendChild(item);
    item.addEventListener('click', () => switchFile(item));
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, item);
    });
  }
  editor.setLanguage(lang);
  loadDefaultCodeForLang(lang);
  updateBreadcrumb();
}

// ==================== CONTEXT MENU ====================
let ctxTarget: HTMLElement | null = null;

function showContextMenu(x: number, y: number, target: HTMLElement): void {
  ctxTarget = target;
  const menu = document.getElementById('context-menu')!;
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.style.display = 'block';
}

function bindContextMenu(): void {
  document.getElementById('context-menu')?.addEventListener('click', (e) => {
    const action = (e.target as HTMLElement).dataset.action;
    const menu = document.getElementById('context-menu')!;
    menu.style.display = 'none';
    if (!action || !ctxTarget) return;
    if (action === 'new') {
      document.getElementById('newfile-dialog')!.style.display = 'flex';
    } else if (action === 'delete') {
      if (ctxTarget.classList.contains('file-item') && ctxTarget.parentElement!.children.length > 1) {
        ctxTarget.remove();
      }
    } else if (action === 'rename') {
      const newName: string = prompt('Rename to:', ctxTarget.dataset.file) || ctxTarget.dataset.file || 'untitled';
      if (ctxTarget.classList.contains('file-item')) {
        ctxTarget.dataset.file = newName;
        ctxTarget.textContent = `📄 ${newName}`;
        document.querySelectorAll('.editor-tab').forEach(t => {
          if ((t as HTMLElement).dataset.file === ctxTarget!.dataset.file!) {
            (t.querySelector('.tab-label') as HTMLElement).textContent = newName;
            (t as HTMLElement).dataset.file = newName;
          }
        });
      }
    }
  });
  document.addEventListener('click', () => {
    document.getElementById('context-menu')!.style.display = 'none';
  });
}

// ==================== NEW FILE DIALOG ====================
function bindNewFileDialog(): void {
  const dlg = document.getElementById('newfile-dialog')!;
  const nameInput = document.getElementById('newfile-name') as HTMLInputElement;
  const langSelect = document.getElementById('newfile-language') as HTMLSelectElement;
  document.getElementById('btn-newfile-close')?.addEventListener('click', () => dlg.style.display = 'none');
  document.getElementById('btn-newfile-cancel')?.addEventListener('click', () => dlg.style.display = 'none');
  document.getElementById('btn-newfile-create')?.addEventListener('click', () => {
    const name = nameInput.value.trim() || 'untitled.py';
    const lang = langSelect.value;
    addFileTab(name, lang);
    dlg.style.display = 'none';
  });
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const name = nameInput.value.trim() || 'untitled.py';
      const lang = langSelect.value;
      addFileTab(name, lang);
      dlg.style.display = 'none';
    }
    if (e.key === 'Escape') dlg.style.display = 'none';
  });
}

// ==================== BREADCRUMB ====================
function bindBreadcrumb(): void {
  document.getElementById('btn-toggle-minimap')?.addEventListener('click', toggleMinimap);
  document.getElementById('btn-toggle-wordwrap')?.addEventListener('click', toggleWordWrap);
  document.getElementById('btn-format-code')?.addEventListener('click', () => {
    editor.getEditor()?.trigger('inkcode', 'editor.action.formatDocument', null);
  });
}

function updateBreadcrumb(): void {
  const langEl = document.getElementById('breadcrumb-lang');
  const fileEl = document.getElementById('breadcrumb-file');
  const activeTab = document.querySelector('.editor-tab.active') as HTMLElement | null;
  if (langEl && activeTab) langEl.textContent = activeTab.dataset.lang || 'python';
  if (fileEl && activeTab) fileEl.textContent = activeTab.dataset.file || 'untitled';
  updateBreadcrumbButtons();
}

function updateBreadcrumbButtons(): void {
  const mmBtn = document.getElementById('btn-toggle-minimap');
  const wwBtn = document.getElementById('btn-toggle-wordwrap');
  if (mmBtn) mmBtn.classList.toggle('active', minimapEnabled);
  if (wwBtn) wwBtn.classList.toggle('active', wordWrapEnabled);
}

// ==================== CURSOR TRACKING ====================
function bindCursorTracking(): void {
  const monacoEditor = editor.getEditor();
  if (!monacoEditor) return;
  monacoEditor.onDidChangeCursorPosition((e) => {
    const el = document.getElementById('breadcrumb-cursor');
    if (el) el.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
  });
}

// ==================== SEARCH PANEL ====================
function bindSearchPanel(): void {
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  const resultsDiv = document.getElementById('search-results');
  if (!searchInput || !resultsDiv) return;
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (!query) return;
      const monacoEditor = editor.getEditor();
      if (!monacoEditor) return;
      const model = monacoEditor.getModel();
      if (!model) return;
      const text = model.getValue();
      const lines = text.split('\n');
      resultsDiv.innerHTML = '';
      lines.forEach((line, i) => {
        if (line.toLowerCase().includes(query.toLowerCase())) {
          const div = document.createElement('div');
          div.className = 'file-item';
          div.textContent = `${i + 1}: ${line.substring(0, 60)}`;
          div.style.fontFamily = 'monospace';
          div.style.fontSize = '11px';
          div.addEventListener('click', () => {
            monacoEditor.revealLineInCenter(i + 1);
            monacoEditor.setPosition({ lineNumber: i + 1, column: 1 });
          });
          resultsDiv.appendChild(div);
        }
      });
    }
  });
}

// ==================== COMMAND PALETTE ====================
interface PaletteCommand {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
}

const COMMANDS: PaletteCommand[] = [
  { id: 'new-file', label: 'New File', shortcut: 'Ctrl+N', action: () => document.getElementById('newfile-dialog')!.style.display = 'flex' },
  { id: 'export', label: 'Export...', shortcut: 'Ctrl+S', action: () => { document.getElementById('export-dialog')!.style.display = 'flex'; } },
  { id: 'toggle-minimap', label: 'Toggle Minimap', shortcut: 'Ctrl+M', action: toggleMinimap },
  { id: 'toggle-wordwrap', label: 'Toggle Word Wrap', shortcut: 'Alt+Z', action: toggleWordWrap },
  { id: 'format', label: 'Format Document', shortcut: 'Shift+Alt+F', action: () => editor.getEditor()?.trigger('inkcode', 'editor.action.formatDocument', null) },
  { id: 'theme-dark', label: 'Theme: Dark', action: () => setTheme('dark') },
  { id: 'theme-light', label: 'Theme: Light', action: () => setTheme('light') },
  { id: 'theme-custom', label: 'Theme: Midnight Blue', action: () => setTheme('custom') },
  { id: 'recognize', label: 'Recognize Handwriting', shortcut: 'Ctrl+R', action: () => bridge.insertAtCursor() },
  { id: 'undo', label: 'Undo (Canvas)', shortcut: 'Ctrl+Z', action: () => inkCanvas.undo() },
  { id: 'redo', label: 'Redo (Canvas)', shortcut: 'Ctrl+Shift+Z', action: () => inkCanvas.redo() },
  { id: 'clear-all', label: 'Clear All Strokes', action: () => inkCanvas.clearAll() },
  { id: 'lang-python', label: 'Set Language: Python', action: () => editor.setLanguage('python') },
  { id: 'lang-js', label: 'Set Language: JavaScript', action: () => editor.setLanguage('javascript') },
  { id: 'lang-cpp', label: 'Set Language: C++', action: () => editor.setLanguage('cpp') },
];

function bindCommandPalette(): void {
  const overlay = document.getElementById('command-palette')!;
  const input = document.getElementById('palette-input') as HTMLInputElement;
  const results = document.getElementById('palette-results')!;
  let selectedIdx = 0;
  let filtered: PaletteCommand[] = [];

  function show(query: string = ''): void {
    filtered = COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));
    selectedIdx = 0;
    results.innerHTML = filtered.map((c, i) =>
      `<div class="palette-item${i === 0 ? ' selected' : ''}" data-idx="${i}">
        <span class="palette-item-label">${c.label}</span>
        ${c.shortcut ? `<span class="palette-item-shortcut">${c.shortcut}</span>` : ''}
      </div>`
    ).join('');
    results.querySelectorAll('.palette-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt((item as HTMLElement).dataset.idx || '0');
        filtered[idx]?.action();
        overlay.style.display = 'none';
      });
    });
  }

  input.addEventListener('input', () => show(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { overlay.style.display = 'none'; return; }
    if (e.key === 'Enter') { filtered[selectedIdx]?.action(); overlay.style.display = 'none'; return; }
    if (e.key === 'ArrowDown') { selectedIdx = Math.min(selectedIdx + 1, filtered.length - 1); show(input.value); return; }
    if (e.key === 'ArrowUp') { selectedIdx = Math.max(selectedIdx - 1, 0); show(input.value); return; }
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.style.display = 'none';
  });
  // Store reference for openCommandPalette
  (window as any)._openCommandPalette = () => {
    overlay.style.display = 'flex';
    input.value = '';
    show();
    setTimeout(() => input.focus(), 50);
  };
}

function openCommandPalette(): void {
  (window as any)._openCommandPalette?.();
}

function toggleMinimap(): void {
  minimapEnabled = !minimapEnabled;
  editor.getEditor()?.updateOptions({ minimap: { enabled: minimapEnabled } });
  updateBreadcrumbButtons();
}

function toggleWordWrap(): void {
  wordWrapEnabled = !wordWrapEnabled;
  editor.getEditor()?.updateOptions({ wordWrap: wordWrapEnabled ? 'on' : 'off' });
  updateBreadcrumbButtons();
}

// ==================== KRITA TOOLBOX ====================
function bindKritaToolbox(): void {
  document.querySelectorAll('.krita-tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.krita-tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tool = (btn as HTMLElement).dataset.tool as CanvasTool;
      if (tool) {
        currentTool = tool;
        inkCanvas.setTool(tool);
        if (tool === CanvasTool.ERASER) inkCanvas.el.style.cursor = 'cell';
        else inkCanvas.el.style.cursor = 'crosshair';
      }
    });
  });
}

// ==================== COLOR PICKER ====================
function bindColorPicker(): void {
  const colorGrid = document.getElementById('color-grid');
  const colorDisplay = document.getElementById('color-swatch-display');
  const nativePicker = document.getElementById('brush-color-picker') as HTMLInputElement;
  if (!colorGrid || !colorDisplay || !nativePicker) return;
  COLOR_PALETTE.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.background = color;
    swatch.addEventListener('click', () => { setBrushColor(color); document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected')); swatch.classList.add('selected'); nativePicker.value = color; });
    colorGrid.appendChild(swatch);
  });
  const firstSwatch = colorGrid.querySelector('.color-swatch') as HTMLElement;
  if (firstSwatch) { firstSwatch.classList.add('selected'); setBrushColor(COLOR_PALETTE[0]); nativePicker.value = COLOR_PALETTE[0]; }
  nativePicker.addEventListener('input', () => { setBrushColor(nativePicker.value); document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected')); if (colorDisplay) colorDisplay.style.background = nativePicker.value; });
  colorDisplay.addEventListener('click', () => nativePicker.click());
}

function setBrushColor(color: string): void {
  const display = document.getElementById('color-swatch-display');
  if (display) display.style.background = color;
  inkCanvas.setBrushSettings({ color });
}

// ==================== BRUSH SETTINGS ====================
function bindBrushSettings(): void {
  const sizeSlider = document.getElementById('brush-size') as HTMLInputElement;
  const sizeValue = document.getElementById('brush-size-value');
  const opacitySlider = document.getElementById('brush-opacity') as HTMLInputElement;
  const opacityValue = document.getElementById('brush-opacity-value');
  const pressureCb = document.getElementById('brush-pressure') as HTMLInputElement;
  const smoothingSelect = document.getElementById('brush-smoothing') as HTMLSelectElement;
  if (sizeSlider && sizeValue) sizeSlider.addEventListener('input', () => { const v = parseInt(sizeSlider.value); sizeValue.textContent = String(v); inkCanvas.setBrushSettings({ size: v }); });
  if (opacitySlider && opacityValue) opacitySlider.addEventListener('input', () => { const v = parseInt(opacitySlider.value) / 100; opacityValue.textContent = `${parseInt(opacitySlider.value)}%`; inkCanvas.setBrushSettings({ opacity: v }); });
  if (pressureCb) pressureCb.addEventListener('change', () => inkCanvas.setBrushSettings({ pressureSensitive: pressureCb.checked }));
  if (smoothingSelect) smoothingSelect.addEventListener('change', () => { inkCanvas.setBrushSettings({ smoothing: smoothingSelect.value as any }); });
}

// ==================== LAYER PANEL ====================
function bindLayerPanel(): void {
  document.querySelectorAll('.layer-visibility').forEach(cb => {
    cb.addEventListener('change', () => {
      const layerIdx = parseInt((cb as HTMLElement).dataset.layer || '0');
      const layer = inkCanvas.getLayers()[layerIdx];
      if (layer) { layer.visible = (cb as HTMLInputElement).checked; inkCanvas.render(); }
    });
  });
  document.querySelectorAll('.layer-clear-btn').forEach(btn => {
    btn.addEventListener('click', () => { inkCanvas.clearLayer(parseInt((btn as HTMLElement).dataset.layer || '0')); updateStatusBar(); });
  });
  document.getElementById('btn-clear-all')?.addEventListener('click', () => { inkCanvas.clearAll(); updateStatusBar(); });
}

// ==================== CANVAS ACTIONS ====================
function bindCanvasActions(): void {
  document.getElementById('btn-recognize')?.addEventListener('click', async () => {
    showToast(t('bridgeScanning'));
    const result = await bridge.insertAtCursor();
    showToast(result.success ? t('bridgeInserted') : t('bridgeNoText'));
  });
  document.getElementById('btn-undo')?.addEventListener('click', () => { inkCanvas.undo(); updateStatusBar(); });
  document.getElementById('btn-redo')?.addEventListener('click', () => { inkCanvas.redo(); updateStatusBar(); });
  document.getElementById('btn-export-open')?.addEventListener('click', () => { document.getElementById('export-dialog')!.style.display = 'flex'; });
}

// ==================== EXPORT DIALOG ====================
function bindExportDialog(): void {
  const dialog = document.getElementById('export-dialog')!;
  const closeDialog = () => { dialog.style.display = 'none'; };
  document.getElementById('btn-export-close')?.addEventListener('click', closeDialog);
  document.getElementById('btn-export-cancel')?.addEventListener('click', closeDialog);
  document.getElementById('btn-export-save')?.addEventListener('click', () => {
    const format = (document.getElementById('export-format') as HTMLSelectElement).value;
    const lang = (document.getElementById('export-language') as HTMLSelectElement).value;
    let result: string = '';
    if (format === 'png') { result = inkCanvas.exportAsImage(); exportService.downloadBase64Image(result, `inkcode-${Date.now()}.png`); }
    else if (format === 'svg') { result = exportService.exportAsSVG(inkCanvas, lang); exportService.downloadText(result, `inkcode-${Date.now()}.svg`, 'image/svg+xml'); }
    else if (format === 'source') { result = editor.getValue(); const extMap: Record<string, string> = { python: 'py', javascript: 'js', cpp: 'cpp' }; exportService.downloadText(result, `inkcode-${Date.now()}.${extMap[lang] || 'txt'}`); }
    closeDialog(); showToast(t('msgExportSuccess'));
  });
  document.getElementById('btn-export-convert')?.addEventListener('click', async () => {
    const resultDiv = document.getElementById('export-result')!;
    const result = await bridge.recognizeInkStrokes();
    resultDiv.style.display = 'block';
    resultDiv.textContent = result.success ? result.text : t('bridgeNoText');
  });
}

// ==================== MODE TABS ====================
function bindModeTabs(): void {
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = (tab as HTMLElement).dataset.mode as InputMode;
      if (mode) setAppMode(mode);
    });
  });
}

// ==================== STATUS BAR ====================
function bindStatusBar(): void {
  document.addEventListener('pointermove', (e) => {
    const posVal = document.getElementById('status-pos-value');
    const pressureVal = document.getElementById('status-pressure-value');
    if (posVal) posVal.textContent = `${Math.round(e.clientX)}, ${Math.round(e.clientY)}`;
    if (pressureVal) pressureVal.textContent = (e.pressure || 0).toFixed(2);
  });
}

function updateStatusBar(): void {
  const modeVal = document.getElementById('status-mode-value');
  const strokesVal = document.getElementById('status-strokes-value');
  const linesVal = document.getElementById('status-lines-value');
  if (modeVal) {
    const labels: Record<InputMode, string> = { [InputMode.CODE]: t('modeCode'), [InputMode.INK]: t('modeWrite'), [InputMode.ANNOTATE]: t('modeAnnotate') };
    modeVal.textContent = labels[currentMode];
  }
  if (strokesVal) strokesVal.textContent = String(inkCanvas.totalStrokeCount());
  if (linesVal) { const ei = editor.getEditor(); if (ei) linesVal.textContent = String(ei.getModel()?.getLineCount() || 0); }
}

// ==================== SPLIT RESIZER ====================
function bindSplitResizer(): void {
  const resizer = document.getElementById('split-resizer');
  const rightPanel = document.getElementById('krita-panel');
  if (!resizer || !rightPanel) return;
  let isResizing = false;
  resizer.addEventListener('mousedown', () => { isResizing = true; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; });
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const mainSplit = document.getElementById('main-split'); if (!mainSplit) return;
    const rect = mainSplit.getBoundingClientRect();
    const pct = Math.max(25, Math.min(70, ((rect.right - e.clientX) / rect.width) * 100));
    rightPanel.style.width = `${pct}%`; inkCanvas.resize(); editor.getEditor()?.layout();
  });
  document.addEventListener('mouseup', () => {
    if (!isResizing) return; isResizing = false;
    document.body.style.cursor = ''; document.body.style.userSelect = '';
    try { localStorage.setItem('inkcode.splitRatio', rightPanel.style.width); } catch (_) {}
  });
  try { const s = localStorage.getItem('inkcode.splitRatio'); if (s) rightPanel.style.width = s; } catch (_) {}
}

// ==================== TITLEBAR ====================
function bindTitlebar(): void {
  document.getElementById('btn-minimize')?.addEventListener('click', () => (window as any).inkCodeAPI?.minimize?.());
  document.getElementById('btn-maximize')?.addEventListener('click', () => (window as any).inkCodeAPI?.maximize?.());
  document.getElementById('btn-close')?.addEventListener('click', () => (window as any).inkCodeAPI?.close?.());
}

// ==================== SETTINGS ====================
function bindSettings(): void {
  const themeSelect = document.getElementById('setting-theme') as HTMLSelectElement;
  themeSelect?.addEventListener('change', () => setTheme(themeSelect.value as ThemeId));
  if (themeSelect) themeSelect.value = getThemeId();
  const langSelect = document.getElementById('setting-language') as HTMLSelectElement;
  langSelect?.addEventListener('change', () => { const locale = langSelect.value as SupportedLocale; applyLocale(locale); try { localStorage.setItem('inkcode.locale', locale); } catch (_) {} });
  if (langSelect) langSelect.value = getLocale();
  const fontSizeSlider = document.getElementById('setting-font-size') as HTMLInputElement;
  const fontSizeValue = document.getElementById('setting-font-size-value');
  fontSizeSlider?.addEventListener('input', () => { const v = parseInt(fontSizeSlider.value); if (fontSizeValue) fontSizeValue.textContent = String(v); editor.getEditor()?.updateOptions({ fontSize: v }); });
}

function loadSavedLocale(): SupportedLocale {
  try { return (localStorage.getItem('inkcode.locale') as SupportedLocale) || 'zh'; } catch { return 'zh'; }
}

async function applyLocale(locale: SupportedLocale): Promise<void> {
  setLocale(locale);
  const mod = locale === 'zh' ? await import('../i18n/zh') : await import('../i18n/en');
  setLocaleDict(mod.default);
  refreshUI();
}

// ==================== KEYBOARD SHORTCUTS ====================
function bindKeyboardShortcuts(): void {
  document.addEventListener('keydown', (e) => {
    const ctrl = e.ctrlKey || e.metaKey;
    // Escape: close all dialogs
    if (e.key === 'Escape') {
      document.querySelectorAll('.dialog-overlay').forEach(d => { (d as HTMLElement).style.display = 'none'; });
      document.getElementById('context-menu')!.style.display = 'none';
      return;
    }
    // Ctrl+Shift+P: Command Palette
    if (ctrl && e.shiftKey && e.key === 'p') { e.preventDefault(); openCommandPalette(); return; }
    // Ctrl+N: New file
    if (ctrl && e.key === 'n') { e.preventDefault(); document.getElementById('newfile-dialog')!.style.display = 'flex'; return; }
    // Ctrl+S: Export source
    if (ctrl && e.key === 's') { e.preventDefault(); const r = editor.getValue(); exportService.downloadText(r, `inkcode-${Date.now()}.py`); showToast(t('msgExportSuccess')); return; }
    // Ctrl+M: Toggle minimap
    if (ctrl && e.key === 'm') { e.preventDefault(); toggleMinimap(); return; }
    // Alt+Z: Toggle word wrap
    if (e.altKey && e.key === 'z') { e.preventDefault(); toggleWordWrap(); return; }
    // Shift+Alt+F: Format
    if (ctrl && e.shiftKey && e.key === 'f') { e.preventDefault(); editor.getEditor()?.trigger('inkcode', 'editor.action.formatDocument', null); return; }
    // Ctrl+Z: Undo canvas
    if (ctrl && !e.shiftKey && e.key === 'z') { e.preventDefault(); inkCanvas.undo(); updateStatusBar(); return; }
    // Ctrl+Shift+Z / Ctrl+Y: Redo canvas
    if ((ctrl && e.shiftKey && e.key === 'z') || (ctrl && e.key === 'y')) { e.preventDefault(); inkCanvas.redo(); updateStatusBar(); return; }
    // Ctrl+R: Recognize handwriting
    if (ctrl && e.key === 'r' && currentMode === InputMode.INK) {
      e.preventDefault(); bridge.insertAtCursor().then(res => showToast(res.success ? t('bridgeInserted') : t('bridgeNoText')));
    }
  });
}

// ==================== UI REFRESH ====================
function refreshUI(): void {
  document.querySelectorAll('[data-i18n]').forEach(el => { const k = el.getAttribute('data-i18n'); if (k) el.textContent = t(k as any); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { const k = el.getAttribute('data-i18n-title'); if (k) el.setAttribute('title', t(k as any)); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { const k = el.getAttribute('data-i18n-placeholder'); if (k) (el as HTMLInputElement).placeholder = t(k as any); });
  document.querySelectorAll('.mode-tab').forEach(tab => {
    const m = (tab as HTMLElement).dataset.mode;
    if (m === 'code') tab.textContent = t('modeCode'); else if (m === 'ink') tab.textContent = t('modeWrite'); else if (m === 'annotate') tab.textContent = t('modeAnnotate');
  });
  const tt = document.querySelector('.titlebar-text'); if (tt) tt.textContent = t('appTitle');
  const sb = document.querySelector('.titlebar-subtitle'); if (sb) sb.textContent = t('appSubtitle');
  updateStatusBar();
}

// ==================== TOAST ====================
function showToast(msg: string, dur: number = 2000): void {
  const t = document.getElementById('ocr-toast'); const txt = document.getElementById('ocr-toast-text');
  if (!t || !txt) return; txt.textContent = msg; t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, dur);
}

// ==================== DEFAULT CODE ====================
function loadDefaultCodeForLang(lang: string): void {
  const codeMap: Record<string, string> = {
    python: `# Python Learning Notes\n# Write code and notes here!\n\ndef hello(name: str) -> str:\n    return f"Hello, {name}!"\n\nclass Calculator:\n    def add(self, a: int, b: int) -> int:\n        return a + b\n\nresult = Calculator().add(3, 5)\nprint(hello("InkCode"), result)`,
    javascript: `// JavaScript Learning Notes\n\nfunction greet(name) {\n    console.log(\`Hello, \${name}!\`);\n}\n\nclass Counter {\n    constructor() { this.count = 0; }\n    increment() { return ++this.count; }\n}\n\nconst c = new Counter();\ngreet("InkCode");\nconsole.log("Count:", c.increment());`,
    typescript: `// TypeScript Learning Notes\n\nfunction greet(name: string): string {\n    return \`Hello, \${name}!\`;\n}\n\ninterface User {\n    name: string;\n    age: number;\n}\n\nconst user: User = { name: "InkCode", age: 1 };\nconsole.log(greet(user.name));`,
    cpp: `// C++ Learning Notes\n#include <iostream>\n#include <vector>\n#include <string>\n\nclass Greeter {\npublic:\n    std::string greet(const std::string& name) {\n        return "Hello, " + name + "!";\n    }\n};\n\nint main() {\n    Greeter g;\n    std::cout << g.greet("InkCode") << std::endl;\n    return 0;\n}`,
    java: `// Java Learning Notes\n\npublic class Main {\n    public static String greet(String name) {\n        return "Hello, " + name + "!";\n    }\n    \n    public static void main(String[] args) {\n        System.out.println(greet("InkCode"));\n    }\n}`,
    html: `<!-- HTML Learning Notes -->\n<!DOCTYPE html>\n<html>\n<head>\n    <title>InkCode</title>\n</head>\n<body>\n    <h1>Hello, InkCode!</h1>\n</body>\n</html>`,
    css: `/* CSS Learning Notes */\n\nbody {\n    font-family: system-ui, sans-serif;\n    margin: 0;\n    padding: 20px;\n    background: #1e1e1e;\n    color: #ccc;\n}\n\nh1 { color: #e94560; }`,
    json: `{\n  "name": "InkCode",\n  "version": "0.1.0",\n  "description": "Handwriting IDE"\n}`,
    markdown: `# InkCode Notes\n\nWrite your notes here!\n\n## Code Example\n\n\`\`\`python\nprint("Hello from InkCode!")\n\`\`\`\n\n## Checklist\n\n- [ ] Learn Python\n- [ ] Learn JavaScript\n- [ ] Build a project`,
  };
  if (codeMap[lang]) editor.setValue(codeMap[lang]);
}

// ==================== ENTRY POINT ====================
document.addEventListener('DOMContentLoaded', init);
export { editor, inkCanvas, inputManager, bridge };
