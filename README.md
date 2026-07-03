# InkCode — Handwriting IDE

**Write code by hand. Annotate like on paper. Edit like a pro.**

InkCode combines the pressure-sensitive handwriting canvas of Krita with the powerful code editing engine of VS Code. Write, annotate, and code — all in one seamless interface.

[![GLWTPL](https://img.shields.io/badge/GLWT-Public_License-red.svg)](https://github.com/me-shaon/GLWTPL)
![Electron](https://img.shields.io/badge/electron-42.3.0-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-5.8-blue)


## Features

### 🎨 Krita-Style Canvas (Right Panel)
- **Pressure-sensitive brush** — full tablet/stylus support with tilt and pressure data
- **Eraser tool** — erase strokes with a single drag (intersection-based deletion)
- **Arrow & highlight tools** — annotate code with arrows and semi-transparent highlights
- **Layers system** — separate ink, annotation, and highlight layers with visibility toggles
- **Undo/Redo** — full stroke-level undo/redo history
- **Color palette & picker** — built-in swatches plus native color picker
- **Bezier curve smoothing** — Catmull-Rom to Bezier conversion for natural-looking strokes

### ⌨️ VS Code-Style Editor (Left Panel)
- **Monaco Editor** — the same engine that powers VS Code
- **Syntax highlighting** — Python, JavaScript, TypeScript, C++, Java, HTML, CSS, JSON, Markdown
- **Auto-indentation** — full language-aware indentation
- **Code completion** — Python snippets and keyword completions
- **File tabs** — multi-file editing with tab interface
- **File tree** — sidebar file browser

### 🌉 Handwriting-to-Code Bridge
- **Tesseract.js OCR** — recognize handwritten text and convert to source code
- **Insert at cursor** — one-click insertion of recognized text into the editor
- **Line replacement** — replace specific code lines with recognized handwriting
- **Export to source** — save recognized handwriting as `.py`, `.js`, `.cpp` files

### 🎨 Themes & i18n
- **3 color themes** — Dark (default), Light, Midnight Blue (custom)
- **CSS variable theming** — all colors driven by CSS custom properties
- **Full i18n** — English and Chinese (中文) language support
- **Live theme switching** — change themes without restarting

### 📦 Export
- **PNG export** — save canvas as raster image
- **SVG export** — vector export of all strokes
- **Source code export** — save editor content as compilable source files
- **Download via browser** — works without Electron IPC fallback

## Architecture

```
InkCode/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts              # Window creation, IPC handlers
│   │   └── preload.ts           # Secure context bridge API
│   └── renderer/
│       ├── workbench/           # Main UI controller
│       │   ├── workbench.html   # Layout (VS Code left + Krita right)
│       │   └── workbench.ts     # App orchestration
│       ├── editor/
│       │   └── codeEditor.ts    # Monaco editor wrapper
│       ├── canvas/
│       │   ├── inkCanvas.ts     # Multi-layer canvas overlay
│       │   ├── stroke.ts        # Stroke/layer data models
│       │   ├── bridge.ts        # Handwriting → code connector
│       │   └── handwritingRecognizer.ts  # Tesseract.js OCR
│       ├── input/
│       │   ├── inputManager.ts  # Pointer event router
│       │   └── pointerData.ts   # Unified pointer abstraction
│       ├── export/
│       │   └── exportService.ts # PNG/SVG/source export
│       ├── i18n/
│       │   ├── index.ts         # i18n manager
│       │   ├── en.ts            # English translations
│       │   ├── zh.ts            # Chinese translations
│       │   └── locales.ts       # Translation key definitions
│       ├── theme/
│       │   ├── index.ts         # Theme manager
│       │   ├── themes.ts        # Theme color definitions
│       │   └── types.ts         # Theme type definitions
│       └── styles/
│           └── workbench.css    # Full CSS with CSS variables
├── assets/                      # Icons and resources
├── package.json
├── tsconfig.json
└── webpack.renderer.config.js
```

## Prerequisites

- **Node.js** 18+
- **npm** 9+
- **Windows** (primary target; macOS/Linux may work with adjustments)

## Quick Start

```bash
# Clone
git clone https://github.com/xuehai2233/inkcode.git
cd inkcode

# Install dependencies
npm install

# Build (TypeScript + Webpack)
npm run build

# Run
npm start
```

> **Note for WorkBuddy users:** WorkBuddy sets `ELECTRON_RUN_AS_NODE=1` which prevents Electron from launching as a GUI app. The `npm start` script automatically unsets this variable. If running directly, use:
> ```bash
> env -u ELECTRON_RUN_AS_NODE electron .
> ```

## Build and Package

```bash
# Build TypeScript + Webpack
npm run build

# Package as unpacked directory (for debugging)
npm run pack

# Create Windows portable .exe
npm run dist
```

The portable executable will be in `release/InkCode-0.1.0-x64.exe`.

## Development

```bash
# Watch mode (auto-rebuild on changes)
npm run dev

# Clean build artifacts
npm run clean
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Electron 42 |
| Language | TypeScript 5.8 |
| Bundler | Webpack 5 |
| Editor | Monaco Editor 0.52 |
| OCR | Tesseract.js 5 |
| Styling | CSS Variables (theming) |
| Packaging | electron-builder 26 |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Export source code |
| `Ctrl+Z` | Undo stroke |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo stroke |
| `Ctrl+R` (Ink mode) | Recognize & insert handwriting |

## License

MIT — see LICENSE file for details.

## Author

GitHub: [@xuehai2233](https://github.com/xuehai2233)
