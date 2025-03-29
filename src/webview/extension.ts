// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { SnippetManager } from "../views/SnippetManager";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log("Code Inserter is now active!");

  const snippetManager = new SnippetManager(context.extensionUri, context);

  // WebviewViewProviderを登録
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SnippetManager.viewType,
      snippetManager
    )
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
