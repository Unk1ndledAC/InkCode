// InkCode Bridge — handwriting-to-code connection
// Creates a real link between handwritten strokes and source code

import * as monaco from 'monaco-editor';
import { InkCanvas } from './inkCanvas';
import { CodeEditor } from '../editor/codeEditor';
import { HandwritingRecognizer } from './handwritingRecognizer';
import { Stroke } from './stroke';

export interface BridgeResult {
  success: boolean;
  text: string;
  error?: string;
}

export class InkCodeBridge {
  private recognizer: HandwritingRecognizer;
  private canvas: InkCanvas;
  private editor: CodeEditor;

  constructor(canvas: InkCanvas, editor: CodeEditor) {
    this.canvas = canvas;
    this.editor = editor;
    this.recognizer = new HandwritingRecognizer();
  }

  /** Initialize the OCR engine */
  async init(lang: string = 'eng'): Promise<void> {
    await this.recognizer.init(lang);
  }

  /** Check if recognizer is ready */
  isReady(): boolean {
    return this.recognizer.isInitialized();
  }

  /**
   * Recognize all handwritten ink strokes and return the recognized text.
   * Groups strokes spatially to separate lines/characters.
   */
  async recognizeInkStrokes(): Promise<BridgeResult> {
    try {
      const inkStrokes = this.canvas.getInkStrokes();
      if (inkStrokes.length === 0) {
        return { success: false, text: '', error: 'no_strokes' };
      }

      // Get canvas rendering of ink layer
      const inkImageData = this.canvas.exportLayerAsImage(0);
      if (!inkImageData) {
        return { success: false, text: '', error: 'export_failed' };
      }

      // OCR the ink strokes
      const text = await this.recognizer.recognizeImageData(inkImageData);
      const cleaned = this.cleanRecognizedText(text);

      return { success: true, text: cleaned };
    } catch (e: any) {
      return { success: false, text: '', error: e.message || 'unknown_error' };
    }
  }

  /**
   * Insert recognized text at the current editor cursor position.
   * This is the main bridge: handwriting → code.
   */
  async insertAtCursor(): Promise<BridgeResult> {
    const result = await this.recognizeInkStrokes();
    if (!result.success || !result.text) return result;

    this.editor.insertAtCursor(result.text);
    // Optionally clear ink strokes after insertion
    // this.canvas.clearLayer(0);
    return result;
  }

  /**
   * Replace a specific line in the editor with recognized text.
   * lineNumber is 1-based Monaco convention.
   */
  async replaceLine(lineNumber: number): Promise<BridgeResult> {
    const result = await this.recognizeInkStrokes();
    if (!result.success || !result.text) return result;

    const monacoEditor = this.editor.getEditor();
    if (!monacoEditor) {
      return { success: false, text: '', error: 'no_editor' };
    }

    const model = monacoEditor.getModel();
    if (!model) {
      return { success: false, text: '', error: 'no_model' };
    }

    const lineCount = model.getLineCount();
    if (lineNumber < 1 || lineNumber > lineCount) {
      return { success: false, text: '', error: 'invalid_line' };
    }

    // Replace entire line content
    monacoEditor.executeEdits('inkcode-bridge', [{
      range: new (monaco as any).Range(lineNumber, 1, lineNumber, model.getLineMaxColumn(lineNumber)),
      text: result.text,
    }]);

    return result;
  }

  /** Clean up recognized text */
  private cleanRecognizedText(text: string): string {
    return text
      .replace(/\s+/g, ' ')           // Collapse whitespace
      .replace(/[‘’]/g, "'")          // Normalize quotes
      .replace(/[“”]/g, '"')
      .replace(/—/g, '-')
      .trim();
  }

  /** Notify listeners about bridge events */
  onStatusChange: ((status: string) => void) | null = null;
}
