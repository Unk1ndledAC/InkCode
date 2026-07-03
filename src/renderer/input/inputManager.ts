// InkCode Input Manager — inspired by Krita's KisInputManager
// Central input event dispatcher that routes pointer events to active tools/actions

import { PointerData, pointerEventToData, mouseEventToData } from './pointerData';

export enum InputMode {
  CODE = 'code',       // Text code editing mode (Monaco active)
  INK = 'ink',         // Handwriting mode (canvas active, pen strokes)
  ANNOTATE = 'annotate' // Annotation mode (overlay drawings on code)
}

export enum ActionState {
  BEGIN = 'begin',
  CONTINUE = 'continue',
  END = 'end'
}

export interface StrokePoint {
  data: PointerData;
  state: ActionState;
}

// Abstract input action — inspired by KisAbstractInputAction
export interface IInputAction {
  begin(point: StrokePoint): void;
  continue(point: StrokePoint): void;
  end(point: StrokePoint): void;
}

// Smoothing options — inspired by KisSmoothingOptions
export interface SmoothingOptions {
  enabled: boolean;
  smoothingType: 'simple' | 'stabilizer' | 'weighted';
  smoothRadius: number;       // for stabilizer
  smoothWeight: number;       // 0.0 ~ 1.0 for weighted smoothing
  stabilizerDelay: number;    // ms delay for stabilizer mode
}

export const DEFAULT_SMoothing: SmoothingOptions = {
  enabled: true,
  smoothingType: 'weighted',
  smoothRadius: 5,
  smoothWeight: 0.7,
  stabilizerDelay: 50
};

export class InputManager {
  private currentMode: InputMode = InputMode.CODE;
  private currentAction: IInputAction | null = null;
  private smoothOptions: SmoothingOptions = DEFAULT_SMoothing;
  private smoothingBuffer: PointerData[] = [];
  private canvas: HTMLElement | null = null;
  private modeChangeListeners: ((mode: InputMode) => void)[] = [];

  constructor() {}

  attach(canvas: HTMLElement): void {
    this.canvas = canvas;
    // Use Pointer Events API for tablet/pen support
    canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
    canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
    canvas.addEventListener('pointerleave', this.onPointerUp.bind(this));
    // Prevent default touch behavior
    canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  }

  detach(): void {
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.onPointerDown.bind(this));
      this.canvas.removeEventListener('pointermove', this.onPointerMove.bind(this));
      this.canvas.removeEventListener('pointerup', this.onPointerUp.bind(this));
      this.canvas.removeEventListener('pointerleave', this.onPointerUp.bind(this));
    }
  }

  setMode(mode: InputMode): void {
    this.currentMode = mode;
    this.modeChangeListeners.forEach(fn => fn(mode));
  }

  getMode(): InputMode {
    return this.currentMode;
  }

  setAction(action: IInputAction): void {
    this.currentAction = action;
  }

  setSmoothing(opts: SmoothingOptions): void {
    this.smoothOptions = opts;
  }

  onModeChange(fn: (mode: InputMode) => void): void {
    this.modeChangeListeners.push(fn);
  }

  // Inspired by KisInputManager::eventFilter -> KisShortcutMatcher
  private onPointerDown(e: PointerEvent): void {
    if (this.currentMode === InputMode.CODE) return; // In code mode, pointer events go to Monaco

    const data = pointerEventToData(e);
    this.smoothingBuffer = [data]; // reset smoothing buffer
    const point: StrokePoint = { data, state: ActionState.BEGIN };

    if (this.currentAction) {
      this.currentAction.begin(point);
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (this.currentMode === InputMode.CODE) return;
    if (this.smoothingBuffer.length === 0) return; // not in a stroke

    const data = pointerEventToData(e);
    const smoothed = this.applySmoothing(data);
    const point: StrokePoint = { data: smoothed, state: ActionState.CONTINUE };

    if (this.currentAction) {
      this.currentAction.continue(point);
    }
  }

  private onPointerUp(e: PointerEvent): void {
    if (this.currentMode === InputMode.CODE) return;

    const data = pointerEventToData(e);
    const point: StrokePoint = { data, state: ActionState.END };

    if (this.currentAction) {
      this.currentAction.end(point);
    }
    this.smoothingBuffer = [];
  }

  // Inspired by Krita's KisSmoothingOptions + KisStabilizedEventsSampler
  private applySmoothing(data: PointerData): PointerData {
    if (!this.smoothOptions.enabled) return data;

    this.smoothingBuffer.push(data);

    const { smoothingType, smoothWeight } = this.smoothOptions;

    if (smoothingType === 'weighted') {
      // Weighted average smoothing — inspired by Krita's KisSpeedSmoother
      const w = smoothWeight;
      let smoothX = data.offsetX;
      let smoothY = data.offsetY;
      let smoothP = data.pressure;

      if (this.smoothingBuffer.length >= 2) {
        const prev = this.smoothingBuffer[this.smoothingBuffer.length - 2];
        smoothX = prev.offsetX * w + data.offsetX * (1 - w);
        smoothY = prev.offsetY * w + data.offsetY * (1 - w);
        smoothP = prev.pressure * w + data.pressure * (1 - w);
      }

      return {
        ...data,
        offsetX: smoothX,
        offsetY: smoothY,
        pressure: smoothP
      };
    }

    // simple: average of last N points
    if (smoothingType === 'simple') {
      const N = Math.min(this.smoothOptions.smoothRadius, this.smoothingBuffer.length);
      const recent = this.smoothingBuffer.slice(-N);
      const avgX = recent.reduce((s, p) => s + p.offsetX, 0) / N;
      const avgY = recent.reduce((s, p) => s + p.offsetY, 0) / N;
      const avgP = recent.reduce((s, p) => s + p.pressure, 0) / N;
      return { ...data, offsetX: avgX, offsetY: avgY, pressure: avgP };
    }

    return data;
  }
}
