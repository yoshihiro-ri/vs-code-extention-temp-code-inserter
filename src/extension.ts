// This file is the entry point for the VS Code extension
// It re-exports the extension implementation from webview/extension.ts

import * as vscode from "vscode";
import { SnippetManager } from "./views/SnippetManager";

export function activate(context: vscode.ExtensionContext) {
  console.log("Code Inserter is now active!");

  const snippetManager = new SnippetManager(context.extensionUri, context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SnippetManager.viewType,
      snippetManager
    )
  );
}

export function deactivate() {}

export * from "./webview/extension";
