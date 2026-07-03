// InkCode InkCanvas — handwriting & annotation canvas overlay
// Inspired by Krita's KisCanvas2 + KisQPainterCanvas

import { InputManager, InputMode, ActionState, IInputAction, StrokePoint } from '../input/inputManager';
import { Stroke, StrokeType, StrokeLayer, StrokeStyle } from './stroke';
import { PointerData } from '../input/pointerData';

export enum CanvasTool {
  BRUSH = 'brush',
  ERASER = 'eraser',
  ARROW = 'arrow',
  HIGHLIGHT = 'highlight',
  TEXT_BOX = 'text_box',
  COLOR_PICKER = 'color_picker',
}

export interface BrushSettings {
  size: number;
  opacity: number;
  color: string;
  pressureSensitive: boolean;
  smoothing: 'none' | 'light' | 'heavy';
}

const DEFAULT_BRUSH: BrushSettings = {
  size: 4,
  opacity: 1,
  color: '#e94560',
  pressureSensitive: true,
  smoothing: 'light',
};

export class InkCanvasAction implements IInputAction {
  private canvas: InkCanvas;
  constructor(canvas: InkCanvas) { this.canvas = canvas; }
  begin(point: StrokePoint): void { this.canvas.beginStroke(point); }
  continue(point: StrokePoint): void { this.canvas.continueStroke(point); }
  end(point: StrokePoint): void { this.canvas.endStroke(point); }
}

export class InkCanvas {
  private canvasEl: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private inputManager: InputManager;
  private action: InkCanvasAction;

  // Layer system
  private layers: StrokeLayer[] = [];
  private activeLayerIndex: number = 0;

  // Current stroke
  private currentStroke: Stroke | null = null;

  // Current tool
  private currentTool: CanvasTool = CanvasTool.BRUSH;
  private brushSettings: BrushSettings = { ...DEFAULT_BRUSH };

  // Undo/redo stacks
  private undoStack: Array<{ layerIndex: number; stroke: Stroke }> = [];
  private redoStack: Array<{ layerIndex: number; stroke: Stroke }> = [];

  // Scroll offset for editor sync
  private scrollOffsetX: number = 0;
  private scrollOffsetY: number = 0;

  // Canvas dimensions
  private width: number = 0;
  private height: number = 0;

  constructor(container: HTMLElement, inputManager: InputManager) {
    this.canvasEl = document.createElement('canvas');
    this.canvasEl.id = 'ink-canvas-overlay';
    this.ctx = this.canvasEl.getContext('2d')!;

    this.inputManager = inputManager;
    this.action = new InkCanvasAction(this);

    this.layers = [
      new StrokeLayer('Ink'),
      new StrokeLayer('Annotations'),
      new StrokeLayer('Highlights'),
    ];

    // Style as overlay
    Object.assign(this.canvasEl.style, {
      position: 'absolute', top: '0', left: '0',
      pointerEvents: 'none', zIndex: '10',
    } as CSSStyleDeclaration);

    this.resizeTo(container);
    container.appendChild(this.canvasEl);

    this.inputManager.attach(this.canvasEl);
    this.inputManager.setAction(this.action);
    this.setupScrollSync(container);

    // Auto-resize when container changes
    const ro = new ResizeObserver(() => {
      this.resize();
    });
    ro.observe(container);
  }

  // ================ SETTINGS ================

  get el(): HTMLCanvasElement { return this.canvasEl; }
  getCanvasWidth(): number { return this.width; }
  getCanvasHeight(): number { return this.height; }

  setTool(tool: CanvasTool): void { this.currentTool = tool; }
  getTool(): CanvasTool { return this.currentTool; }

  setBrushSettings(settings: Partial<BrushSettings>): void {
    Object.assign(this.brushSettings, settings);
  }
  getBrushSettings(): BrushSettings { return { ...this.brushSettings }; }

  // ================ RESIZE ================

  private resizeTo(container: HTMLElement): void {
    const rect = container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvasEl.width = this.width * window.devicePixelRatio;
    this.canvasEl.height = this.height * window.devicePixelRatio;
    this.canvasEl.style.width = `${this.width}px`;
    this.canvasEl.style.height = `${this.height}px`;
    this.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  resize(): void {
    const parent = this.canvasEl.parentElement;
    if (parent) this.resizeTo(parent);
    this.render();
  }

  // ================ MODE ================

  setMode(mode: InputMode): void {
    switch (mode) {
      case InputMode.CODE:
        this.canvasEl.style.pointerEvents = 'none';
        this.canvasEl.style.opacity = '0';
        break;
      case InputMode.INK:
        this.canvasEl.style.pointerEvents = 'auto';
        this.canvasEl.style.opacity = '1';
        this.canvasEl.style.cursor = 'crosshair';
        this.activeLayerIndex = 0;
        break;
      case InputMode.ANNOTATE:
        this.canvasEl.style.pointerEvents = 'auto';
        this.canvasEl.style.opacity = '1';
        this.canvasEl.style.cursor = 'crosshair';
        this.activeLayerIndex = 1;
        break;
    }
    this.render();
  }

  // ================ STROKE LIFECYCLE ================

  beginStroke(point: StrokePoint): void {
    // Eraser mode: delete strokes that intersect
    if (this.currentTool === CanvasTool.ERASER) {
      this.eraseAtPoint(point.data);
      this.currentStroke = null;
      return;
    }

    // Color picker: sample color
    if (this.currentTool === CanvasTool.COLOR_PICKER) {
      this.currentStroke = null;
      return;
    }

    const style = this.buildStrokeStyle();
    const type = this.getStrokeType();
    this.currentStroke = new Stroke(type, style);
    this.currentStroke.addPoint(point.data);
    this.getActiveLayer().addStroke(this.currentStroke);
  }

  continueStroke(point: StrokePoint): void {
    // Eraser: continuous erasing along the path
    if (this.currentTool === CanvasTool.ERASER) {
      this.eraseAtPoint(point.data);
      this.renderLive();
      return;
    }

    if (!this.currentStroke) return;

    this.currentStroke.addPoint(point.data);
    this.renderLive();
  }

  endStroke(point: StrokePoint): void {
    // Eraser: clean up after erasing
    if (this.currentTool === CanvasTool.ERASER) {
      this.eraseAtPoint(point.data);
      this.render();
      return;
    }

    // Color picker: nothing to finalize
    if (this.currentTool === CanvasTool.COLOR_PICKER) {
      this.currentStroke = null;
      return;
    }

    if (!this.currentStroke) return;

    this.currentStroke.addPoint(point.data);
    this.currentStroke.complete();

    // Push to undo stack
    const activeIndex = this.getActiveLayerIndex();
    this.undoStack.push({
      layerIndex: activeIndex,
      stroke: this.currentStroke,
    });
    this.redoStack = [];
    this.currentStroke = null;
    this.render();
  }

  // ================ ERASER ================

  private eraseAtPoint(data: PointerData): void {
    const eraserSize = this.brushSettings.size * 3; // eraser is 3x brush size
    const x = data.offsetX;
    const y = data.offsetY;

    // For each visible layer, remove strokes that intersect with eraser point
    for (const layer of this.layers) {
      if (!layer.visible) continue;
      layer.strokes = layer.strokes.filter(stroke => {
        return !this.strokeIntersectsPoint(stroke, x, y, eraserSize);
      });
    }
  }

  private strokeIntersectsPoint(stroke: Stroke, x: number, y: number, radius: number): boolean {
    // Check if any point in the stroke is within radius of (x, y)
    for (const p of stroke.points) {
      const dx = p.offsetX - x;
      const dy = p.offsetY - y;
      if (dx * dx + dy * dy <= radius * radius) return true;
    }
    // Also check line segments
    for (let i = 1; i < stroke.points.length; i++) {
      const p0 = stroke.points[i - 1];
      const p1 = stroke.points[i];
      if (this.segmentPointDistance(p0.offsetX, p0.offsetY, p1.offsetX, p1.offsetY, x, y) <= radius) {
        return true;
      }
    }
    return false;
  }

  private segmentPointDistance(x1: number, y1: number, x2: number, y2: number, px: number, py: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  // ================ UNDO / REDO ================

  undo(): boolean {
    const entry = this.undoStack.pop();
    if (!entry) return false;
    const layer = this.layers[entry.layerIndex];
    if (!layer) return false;
    const idx = layer.strokes.lastIndexOf(entry.stroke);
    if (idx !== -1) {
      layer.strokes.splice(idx, 1);
    }
    this.redoStack.push(entry);
    this.render();
    return true;
  }

  redo(): boolean {
    const entry = this.redoStack.pop();
    if (!entry) return false;
    const layer = this.layers[entry.layerIndex];
    if (!layer) return false;
    layer.strokes.push(entry.stroke);
    this.undoStack.push(entry);
    this.render();
    return true;
  }

  // ================ RENDERING ================

  render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    for (const layer of this.layers) {
      if (!layer.visible) continue;
      ctx.globalAlpha = layer.opacity;
      for (const stroke of layer.strokes) {
        this.renderStroke(ctx, stroke);
      }
    }
    ctx.globalAlpha = 1.0;
  }

  private renderLive(): void { this.render(); }

  renderStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
    if (stroke.points.length === 0) return;
    const { style, type } = stroke;

    ctx.save();
    ctx.strokeStyle = style.color;
    ctx.fillStyle = style.color;
    ctx.globalAlpha = style.opacity;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (type === StrokeType.HIGHLIGHT) {
      ctx.lineWidth = style.width;
      ctx.globalAlpha = style.opacity;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].offsetX, stroke.points[0].offsetY);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].offsetX, stroke.points[i].offsetY);
      }
      ctx.stroke();
    } else if (type === StrokeType.ARROW) {
      this.renderArrowPath(ctx, stroke);
    } else if (type === StrokeType.ERASE) {
      // Erase strokes are not rendered (handled by deletion logic)
    } else {
      this.renderFreehandPath(ctx, stroke);
    }

    ctx.restore();
  }

  private renderFreehandPath(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
    const pts = stroke.points;
    const { width, pressureSensitive, smooth } = stroke.style;

    if (pts.length === 1) {
      const p = pts[0];
      const r = pressureSensitive ? (width * p.pressure) / 2 : width / 2;
      ctx.beginPath();
      ctx.arc(p.offsetX, p.offsetY, r, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (smooth && pts.length >= 3) {
      ctx.beginPath();
      ctx.moveTo(pts[0].offsetX, pts[0].offsetY);
      for (let i = 1; i < pts.length - 2; i++) {
        const cp1x = pts[i].offsetX + (pts[i + 1].offsetX - pts[i - 1].offsetX) / 6;
        const cp1y = pts[i].offsetY + (pts[i + 1].offsetY - pts[i - 1].offsetY) / 6;
        const cp2x = pts[i + 1].offsetX - (pts[i + 2].offsetX - pts[i].offsetX) / 6;
        const cp2y = pts[i + 1].offsetY - (pts[i + 2].offsetY - pts[i].offsetY) / 6;
        if (pressureSensitive) {
          ctx.lineWidth = width * ((pts[i].pressure + pts[i + 1].pressure) / 2);
        }
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, pts[i + 1].offsetX, pts[i + 1].offsetY);
      }
      const last = pts[pts.length - 1];
      if (pressureSensitive) ctx.lineWidth = width * last.pressure;
      ctx.lineTo(last.offsetX, last.offsetY);
      ctx.stroke();
    } else {
      ctx.lineWidth = pressureSensitive ? width * pts[pts.length - 1].pressure : width;
      ctx.beginPath();
      ctx.moveTo(pts[0].offsetX, pts[0].offsetY);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].offsetX, pts[i].offsetY);
      }
      ctx.stroke();
    }
  }

  private renderArrowPath(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
    const pts = stroke.points;
    if (pts.length < 2) return;
    const start = pts[0];
    const end = pts[pts.length - 1];
    ctx.lineWidth = stroke.style.width;
    ctx.beginPath();
    ctx.moveTo(start.offsetX, start.offsetY);
    ctx.lineTo(end.offsetX, end.offsetY);
    ctx.stroke();
    const angle = Math.atan2(end.offsetY - start.offsetY, end.offsetX - start.offsetX);
    const headLen = 12;
    ctx.beginPath();
    ctx.moveTo(end.offsetX, end.offsetY);
    ctx.lineTo(end.offsetX - headLen * Math.cos(angle - Math.PI / 6), end.offsetY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(end.offsetX, end.offsetY);
    ctx.lineTo(end.offsetX - headLen * Math.cos(angle + Math.PI / 6), end.offsetY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }

  // ================ HELPERS ================

  private getActiveLayer(): StrokeLayer {
    if (this.currentTool === CanvasTool.HIGHLIGHT) return this.layers[2];
    return this.layers[this.activeLayerIndex];
  }

  getActiveLayerIndex(): number {
    if (this.currentTool === CanvasTool.HIGHLIGHT) return 2;
    return this.activeLayerIndex;
  }

  private getStrokeType(): StrokeType {
    switch (this.currentTool) {
      case CanvasTool.HIGHLIGHT: return StrokeType.HIGHLIGHT;
      case CanvasTool.ARROW: return StrokeType.ARROW;
      case CanvasTool.BRUSH: return StrokeType.INK;
      case CanvasTool.TEXT_BOX: return StrokeType.ANNOTATION;
      default: return StrokeType.INK;
    }
  }

  private buildStrokeStyle(): StrokeStyle {
    const s = this.brushSettings;
    return {
      width: s.size,
      opacity: s.opacity,
      color: s.color,
      pressureSensitive: s.pressureSensitive,
      smooth: s.smoothing !== 'none',
    };
  }

  // ================ SCROLL SYNC ================

  private setupScrollSync(container: HTMLElement): void {
    const monacoScroll = container.querySelector('.monaco-scrollable-element');
    if (monacoScroll) {
      monacoScroll.addEventListener('scroll', () => {
        const el = monacoScroll as HTMLElement;
        this.scrollOffsetX = el.scrollLeft;
        this.scrollOffsetY = el.scrollTop;
        this.canvasEl.style.transform = `translate(-${this.scrollOffsetX}px, -${this.scrollOffsetY}px)`;
      });
    }
  }

  // ================ EXPORT ================

  exportAsImage(format: string = 'image/png'): string {
    this.render();
    return this.canvasEl.toDataURL(format);
  }

  exportLayerAsImage(layerIndex: number): string {
    const offscreen = document.createElement('canvas');
    offscreen.width = this.canvasEl.width;
    offscreen.height = this.canvasEl.height;
    const offCtx = offscreen.getContext('2d')!;
    offCtx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    const layer = this.layers[layerIndex];
    if (!layer) return '';
    for (const stroke of layer.strokes) {
      this.renderStroke(offCtx, stroke);
    }
    return offscreen.toDataURL('image/png');
  }

  // ================ ACCESSORS ================

  getLayers(): StrokeLayer[] { return this.layers; }
  getInkStrokes(): Stroke[] { return this.layers[0].strokes.filter(s => s.type === StrokeType.INK); }
  getAnnotationStrokes(): Stroke[] { return this.layers[1].strokes; }
  getHighlightStrokes(): Stroke[] { return this.layers[2].strokes; }
  totalStrokeCount(): number { return this.layers.reduce((sum, l) => sum + l.strokes.length, 0); }

  clearLayer(index: number): void {
    if (this.layers[index]) {
      this.layers[index].strokes = [];
      this.render();
    }
  }

  clearAll(): void {
    for (const layer of this.layers) layer.strokes = [];
    this.undoStack = [];
    this.redoStack = [];
    this.render();
  }
}
