import * as vscode from "vscode";

export interface InsertOperation {
  document: vscode.Uri;
  selections: readonly vscode.Selection[];
  originalTexts: string[];
  newText: string;
  timestamp: number;
}

export interface CodeSnippet {
  id: string;
  name: string;
  code: string;
  is_inserted?: boolean;
  lastInsertedAt?: {
    positions: number[];
    filePath: string;
    timestamp: string;
  };
}

export interface SnippetManagerConfig {
  extensionUri: vscode.Uri;
  context: vscode.ExtensionContext;
}
