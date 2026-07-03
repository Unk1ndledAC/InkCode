// InkCode Stroke — represents a single pen/handwriting stroke
// Inspired by Krita's KisToolFreehandHelper stroke lifecycle

import { PointerData } from '../input/pointerData';

export enum StrokeType {
  INK = 'ink',             // Handwritten code stroke
  ANNOTATION = 'annotation', // Annotation stroke (note, arrow, highlight)
  HIGHLIGHT = 'highlight',  // Highlight region stroke
  ARROW = 'arrow',          // Arrow annotation stroke
  ERASE = 'erase'           // Eraser stroke
}

export interface StrokeStyle {
  color: string;
  width: number;            // Base width in pixels
  opacity: number;          // 0.0 ~ 1.0
  pressureSensitive: boolean; // Whether width varies with pressure
  smooth: boolean;          // Apply bezier smoothing to points
}

export const DEFAULT_INK_STYLE: StrokeStyle = {
  color: '#1a1a2e',
  width: 2.5,
  opacity: 1.0,
  pressureSensitive: true,
  smooth: true
};

export const DEFAULT_ANNOTATION_STYLE: StrokeStyle = {
  color: '#e94560',
  width: 2.0,
  opacity: 0.8,
  pressureSensitive: false,
  smooth: true
};

export const DEFAULT_HIGHLIGHT_STYLE: StrokeStyle = {
  color: '#ffff00',
  width: 20,
  opacity: 0.3,
  pressureSensitive: false,
  smooth: false
};

export class Stroke {
  readonly id: string;
  readonly type: StrokeType;
  readonly style: StrokeStyle;
  points: PointerData[] = [];
  completed: boolean = false;
  /** Text transcription of handwritten stroke (populated by recognition) */
  recognizedText: string = '';
  /** Which source code line this annotation targets (for annotation strokes) */
  targetLine: number | null = null;

  constructor(type: StrokeType, style: StrokeStyle = DEFAULT_INK_STYLE) {
    this.id = `stroke_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.type = type;
    this.style = style;
  }

  addPoint(data: PointerData): void {
    this.points.push(data);
  }

  complete(): void {
    this.completed = true;
  }

  /** Get bounding box of all points */
  getBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    if (this.points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    const xs = this.points.map(p => p.offsetX);
    const ys = this.points.map(p => p.offsetY);
    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys)
    };
  }
}

// Stroke layer — a collection of strokes, like Krita's layer concept
export class StrokeLayer {
  readonly id: string;
  readonly name: string;
  strokes: Stroke[] = [];
  visible: boolean = true;
  opacity: number = 1.0;
  locked: boolean = false;

  constructor(name: string) {
    this.id = `layer_${Date.now()}`;
    this.name = name;
  }

  addStroke(stroke: Stroke): void {
    this.strokes.push(stroke);
  }

  removeStroke(id: string): void {
    this.strokes = this.strokes.filter(s => s.id !== id);
  }

  getStroke(id: string): Stroke | undefined {
    return this.strokes.find(s => s.id === id);
  }
}
