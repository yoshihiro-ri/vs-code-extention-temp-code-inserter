import * as vscode from "vscode";
import { CodeSnippet } from "./types";
import { SnippetStorage } from "./services/SnippetStorage";
import { CodeInserter } from "./services/CodeInserter";
import { WebviewContentProvider } from "./services/WebviewContentProvider";

export class SnippetManager implements vscode.WebviewViewProvider {
  public static readonly viewType = "code-inserter.tempCodeInserterView";

  private _view?: vscode.WebviewView;
  private _disposables: vscode.Disposable[] = [];
  private _snippets: CodeSnippet[] = [];

  private readonly snippetStorage: SnippetStorage | null;
  private readonly codeInserter: CodeInserter;
  private readonly webviewContentProvider: WebviewContentProvider;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    this.snippetStorage = workspaceFolders
      ? new SnippetStorage(workspaceFolders[0])
      : null;
    this.codeInserter = new CodeInserter();
    this.webviewContentProvider = new WebviewContentProvider(_extensionUri);

    // 初期化時にスニペットを読み込む
    this._loadSnippets();
  }

  private async _loadSnippets() {
    if (this.snippetStorage) {
      this._snippets = await this.snippetStorage.loadSnippets();
    } else {
      this._snippets = [];
      console.log("No workspace folder found, using empty snippets array");
    }
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    console.log("Resolving webview view");
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, "dist")],
    };

    try {
      webviewView.webview.html = this.webviewContentProvider.getWebviewContent(
        webviewView.webview
      );
      console.log("Webview HTML set successfully");
    } catch (error) {
      console.error("Error setting webview HTML:", error);
    }

    // WebViewが準備できたら保存されたスニペットを送信
    webviewView.webview.onDidReceiveMessage((message) => {
      if (message.type === "ready") {
        this._sendSnippetsToWebView();
      }
    });

    webviewView.webview.onDidReceiveMessage(
      async (message) => {
        console.log("Received message:", message);
        try {
          switch (message.type) {
            case "insert":
              // 挿入済みスニペットのチェック
              const targetSnippet = this._snippets.find(
                (snippet) => snippet.id === message.snippetId
              );
              if (targetSnippet?.is_inserted) {
                vscode.window.showErrorMessage(
                  "このスニペットは既に挿入済みです"
                );
                return;
              }

              const editor = vscode.window.activeTextEditor;
              if (!editor) {
                vscode.window.showErrorMessage(
                  "アクティブなエディタが見つかりません"
                );
                return;
              }

              const position = editor.selection.active;
              const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
              if (!workspaceFolder) {
                vscode.window.showErrorMessage(
                  "ワークスペースフォルダが見つかりません"
                );
                return;
              }

              const filePath = vscode.workspace.asRelativePath(
                editor.document.uri
              );

              await this.codeInserter.insertCodeAtCursor(
                message.code,
                message.snippetId,
                (snippetId) => {
                  // 挿入完了時の処理
                  this._snippets = this._snippets.map((snippet) => {
                    if (snippet.id === snippetId) {
                      return {
                        ...snippet,
                        is_inserted: true,
                        lastInsertedAt: {
                          positions: [position.line],
                          filePath,
                          timestamp: new Date().toISOString(),
                        },
                      };
                    }
                    return snippet;
                  });

                  // 更新をストレージに保存
                  if (this.snippetStorage) {
                    this.snippetStorage.saveSnippets(this._snippets);
                  }

                  // 更新をWebViewに通知
                  this._sendSnippetsToWebView();
                  vscode.window.showInformationMessage("コードを挿入しました");
                }
              );
              return;
            case "jumpToLocation":
              await this.codeInserter.jumpToLocation(
                message.filePath,
                message.line
              );
              return;
            case "updateSnippets":
              if (message.snippets && this.snippetStorage) {
                await this.snippetStorage.saveSnippets(message.snippets);
                this._snippets = message.snippets;
              }
              return;
            case "removeCode":
              if (message.snippetId) {
                await this.codeInserter.removeCodeBySnippetId(
                  message.snippetId
                );
                vscode.window.showInformationMessage("コードを削除しました");
              }
              return;
          }
        } catch (error) {
          console.error("Error handling message:", error);
          vscode.window.showErrorMessage(
            error instanceof Error ? error.message : "エラーが発生しました"
          );
        }
      },
      null,
      this._disposables
    );

    // WebViewが表示されたときにスニペットを送信
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this._sendSnippetsToWebView();
      }
    });

    // 初期表示時にもスニペットを送信
    this._sendSnippetsToWebView();
  }

  private async _sendSnippetsToWebView() {
    if (this._view) {
      // スニペットの状態を保存
      if (this.snippetStorage) {
        await this.snippetStorage.saveSnippets(this._snippets);
      }

      console.log("Sending snippets to WebView:", this._snippets);
      this._view.webview.postMessage({
        type: "loadSnippets",
        snippets: this._snippets,
      });
    }
  }

  public dispose() {
    this._disposables.forEach((d) => d.dispose());
  }
}
