// InkCode Editor — Monaco editor integration for code editing
// Supports syntax highlighting, auto-indent, and multiple languages

import * as monaco from 'monaco-editor';

export interface EditorConfig {
  language: string;
  theme: string;
  fontSize: number;
  fontFamily: string;
  minimap: boolean;
  wordWrap: 'on' | 'off' | 'wordWrapColumn';
  autoIndent: 'none' | 'keep' | 'brackets' | 'advanced' | 'full';
}

export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  language: 'python',
  theme: 'vs-dark',
  fontSize: 14,
  fontFamily: 'Consolas, "Courier New", monospace',
  minimap: true,
  wordWrap: 'off',
  autoIndent: 'full'
};

export class CodeEditor {
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private container: HTMLElement | null = null;
  private config: EditorConfig = DEFAULT_EDITOR_CONFIG;

  constructor() {}

  /** Create and attach Monaco editor to a DOM element */
  create(container: HTMLElement, config?: Partial<EditorConfig>): void {
    this.container = container;
    this.config = { ...DEFAULT_EDITOR_CONFIG, ...config };

    // Register additional language features if needed
    this.registerLanguageFeatures();

    this.editor = monaco.editor.create(container, {
      value: this.getDefaultCode(),
      language: this.config.language,
      theme: this.config.theme,
      fontSize: this.config.fontSize,
      fontFamily: this.config.fontFamily,
      minimap: { enabled: this.config.minimap },
      wordWrap: this.config.wordWrap,
      autoIndent: this.config.autoIndent,
      formatOnPaste: true,
      formatOnType: true,
      tabSize: 4,
      insertSpaces: true,
      scrollBeyondLastLine: false,
      renderLineHighlight: 'all',
      contextmenu: true,
      folding: true,
      lineNumbers: 'on',
      glyphMargin: true, // for annotation markers
      overviewRulerBorder: false,
      padding: { top: 10 }
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      this.editor?.layout();
    });
    resizeObserver.observe(container);
  }

  private registerLanguageFeatures(): void {
    // Basic completion provider for Python
    monaco.languages.registerCompletionItemProvider('python', {
      provideCompletionItems: (model, position) => {
        const range = new monaco.Range(position.lineNumber, 1, position.lineNumber, model.getLineMaxColumn(position.lineNumber));
        return {
          suggestions: [
            { label: 'def', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'def ${1:function_name}(${2:params}):\n    ${3:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
            { label: 'class', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'class ${1:ClassName}:\n    ${2:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
            { label: 'import', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'import ${1:module}', range },
            { label: 'from', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'from ${1:module} import ${2:name}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
            { label: 'print', kind: monaco.languages.CompletionItemKind.Function, insertText: 'print(${1:value})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
            { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if ${1:condition}:\n    ${2:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
            { label: 'for', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for ${1:item} in ${2:iterable}:\n    ${3:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
            { label: 'while', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'while ${1:condition}:\n    ${2:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
            { label: 'return', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'return ${1:value}', range },
          ]
        };
      }
    });
  }

  /** Get default sample code */
  private getDefaultCode(): string {
    return `# InkCode — Handwriting IDE Demo
# Write code by hand or type, annotate freely!

def hello(name: str) -> str:
    """Greet someone."""
    return f"Hello, {name}!"

class Calculator:
    def add(self, a: int, b: int) -> int:
        return a + b
    
    def multiply(self, a: int, b: int) -> int:
        return a * b

if __name__ == "__main__":
    calc = Calculator()
    result = calc.add(3, 5)
    print(hello("InkCode"))
    print(f"3 + 5 = {result}")
`;
  }

  /** Get the Monaco editor instance */
  getEditor(): monaco.editor.IStandaloneCodeEditor | null {
    return this.editor;
  }

  /** Get current source code content */
  getValue(): string {
    return this.editor?.getValue() || '';
  }

  /** Set source code content */
  setValue(value: string): void {
    this.editor?.setValue(value);
  }

  /** Change editor language */
  setLanguage(language: string): void {
    const model = this.editor?.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, language);
    }
    this.config.language = language;
  }

  /** Insert text at cursor position — used for transcribing handwritten code */
  insertAtCursor(text: string): void {
    if (!this.editor) return;
    const position = this.editor.getPosition();
    if (position) {
      this.editor.executeEdits('ink-transcription', [{
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
        text: text
      }]);
    }
  }

  /** Format the document */
  formatDocument(): void {
    this.editor?.trigger('inkcode', 'editor.action.formatDocument', null);
  }

  /** Dispose editor */
  dispose(): void {
    this.editor?.dispose();
  }
}
