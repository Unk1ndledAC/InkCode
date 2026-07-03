// InkCode Export Service — handles exporting handwritten code as images or source code

import { InkCanvas } from '../canvas/inkCanvas';
import { Stroke, StrokeType } from '../canvas/stroke';

export interface ExportOptions {
  format: 'png' | 'svg' | 'source';
  language?: string;
  includeAnnotations: boolean;
  includeHighlights: boolean;
}

export class ExportService {

  /** Export canvas strokes as SVG string */
  exportAsSVG(canvas: InkCanvas, _language?: string): string {
    const strokes = canvas.getInkStrokes();
    const annotations = canvas.getAnnotationStrokes();
    const highlights = canvas.getHighlightStrokes();
    const allStrokes = [...strokes, ...annotations, ...highlights];

    const w = canvas.getCanvasWidth();
    const h = canvas.getCanvasHeight();

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">\n`;
    svg += `<rect width="${w}" height="${h}" fill="#ffffff" />\n`;

    for (const stroke of allStrokes) {
      svg += this.strokeToSVGPath(stroke);
    }
    svg += '</svg>';
    return svg;
  }

  private strokeToSVGPath(stroke: Stroke): string {
    if (stroke.points.length === 0) return '';
    const { style } = stroke;

    if (stroke.points.length === 1) {
      const p = stroke.points[0];
      const r = style.pressureSensitive ? style.width * p.pressure / 2 : style.width / 2;
      return `<circle cx="${p.offsetX}" cy="${p.offsetY}" r="${r}" fill="${style.color}" opacity="${style.opacity}" />\n`;
    }

    let d = `M ${stroke.points[0].offsetX} ${stroke.points[0].offsetY}`;
    for (let i = 1; i < stroke.points.length; i++) {
      d += ` L ${stroke.points[i].offsetX} ${stroke.points[i].offsetY}`;
    }

    const strokeWidth = style.pressureSensitive
      ? style.width * (stroke.points[stroke.points.length - 1]?.pressure || 1)
      : style.width;

    return `<path d="${d}" stroke="${style.color}" stroke-width="${strokeWidth}" fill="none" opacity="${style.opacity}" stroke-linecap="round" stroke-linejoin="round" />\n`;
  }

  /** Download a base64 image */
  downloadBase64Image(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  }

  /** Download text content as a file */
  downloadText(content: string, filename: string, mimeType: string = 'text/plain'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
