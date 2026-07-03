// InkCode Handwriting Recognition Service
// Converts handwritten ink strokes to executable source code
// Uses Tesseract.js for OCR when available, with fallback rule-based recognition

import { Stroke, StrokeType } from '../canvas/stroke';

export interface RecognitionResult {
  text: string;
  confidence: number; // 0.0 ~ 1.0
  lineIndex: number;   // target line in source code
}

export class HandwritingRecognizer {
  private ocrReady: boolean = false;
  private ocrWorker: any = null;

  async init(lang: string = 'eng'): Promise<void> {
    try {
      const Tesseract = await import('tesseract.js');
      this.ocrWorker = await Tesseract.createWorker(lang);
      this.ocrReady = true;
    } catch {
      console.warn('Tesseract.js not available, falling back to basic recognition');
      this.ocrReady = false;
    }
  }

  async initOCR(): Promise<void> {
    await this.init('eng');
  }

  isInitialized(): boolean {
    return this.ocrReady;
  }

  /** Recognize text from a base64 image data URL */
  async recognizeImageData(dataUrl: string): Promise<string> {
    if (!this.ocrReady || !this.ocrWorker) return '';
    try {
      const { data } = await this.ocrWorker.recognize(dataUrl);
      return data.text.trim();
    } catch {
      return '';
    }
  }

  /** Recognize handwritten strokes and return text */
  async recognizeStrokes(strokes: Stroke[]): Promise<RecognitionResult[]> {
    if (strokes.length === 0) return [];

    const results: RecognitionResult[] = [];

    for (const stroke of strokes) {
      if (stroke.type !== StrokeType.INK) continue;
      if (stroke.points.length < 5) continue; // too short to be meaningful

      if (this.ocrReady && this.ocrWorker) {
        // OCR-based recognition via Tesseract.js
        const imageBlob = this.strokeToImageBlob(stroke);
        if (imageBlob) {
          try {
            const { data } = await this.ocrWorker.recognize(imageBlob);
            results.push({
              text: data.text.trim(),
              confidence: data.confidence / 100,
              lineIndex: this.estimateLineIndex(stroke)
            });
          } catch {
            // OCR failed, use fallback
            results.push(this.fallbackRecognition(stroke));
          }
        }
      } else {
        // Fallback: simple stroke analysis
        results.push(this.fallbackRecognition(stroke));
      }
    }

    return results;
  }

  /** Convert stroke to an image blob for OCR input */
  private strokeToImageBlob(stroke: Stroke): Blob | null {
    const bounds = stroke.getBounds();
    const padding = 20;
    const width = (bounds.maxX - bounds.minX) + padding * 2;
    const height = (bounds.maxY - bounds.minY) + padding * 2;

    if (width < 10 || height < 10) return null;

    const offscreen = document.createElement('canvas');
    offscreen.width = Math.ceil(width);
    offscreen.height = Math.ceil(height);
    const ctx = offscreen.getContext('2d')!;

    // White background for better OCR
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);

    // Draw stroke
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = stroke.style.width * 2; // thicker for OCR
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    const offsetX = -bounds.minX + padding;
    const offsetY = -bounds.minY + padding;

    if (stroke.points.length === 1) {
      const p = stroke.points[0];
      ctx.arc(p.offsetX + offsetX, p.offsetY + offsetY, stroke.style.width, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.moveTo(stroke.points[0].offsetX + offsetX, stroke.points[0].offsetY + offsetY);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].offsetX + offsetX, stroke.points[i].offsetY + offsetY);
      }
      ctx.stroke();
    }

    // Convert to blob
    const dataUrl = offscreen.toDataURL('image/png');
    const byteString = atob(dataUrl.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'image/png' });
  }

  /** Estimate which source code line a stroke corresponds to */
  private estimateLineIndex(stroke: Stroke): number {
    if (stroke.targetLine !== null) return stroke.targetLine;
    const avgY = stroke.points.reduce((s, p) => s + p.offsetY, 0) / stroke.points.length;
    return Math.floor(avgY / 20);
  }

  /** Fallback recognition when OCR is unavailable */
  private fallbackRecognition(stroke: Stroke): RecognitionResult {
    // Simple heuristic: classify stroke shape
    const bounds = stroke.getBounds();
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;

    // Very short strokes likely represent single characters/symbols
    // Wider strokes likely represent words/expressions
    let text = '';
    let confidence = 0.3; // low confidence for heuristic

    if (width > 100) {
      // Wide horizontal stroke — likely a line of handwriting
      text = '// [handwritten note — OCR unavailable]';
      confidence = 0.2;
    } else if (height > 50 && width < 30) {
      // Tall narrow stroke — likely vertical element
      text = '|';
      confidence = 0.4;
    } else {
      text = '?';
      confidence = 0.1;
    }

    return {
      text,
      confidence,
      lineIndex: this.estimateLineIndex(stroke)
    };
  }

  terminate(): void {
    if (this.ocrWorker) {
      this.ocrWorker.terminate();
    }
  }
}
