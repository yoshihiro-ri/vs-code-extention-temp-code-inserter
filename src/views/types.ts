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
}

export interface SnippetManagerConfig {
  extensionUri: vscode.Uri;
  context: vscode.ExtensionContext;
}
