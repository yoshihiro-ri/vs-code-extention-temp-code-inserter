import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

// 各挿入操作の情報を記録する型を定義
interface InsertOperation {
  document: vscode.Uri;
  selections: readonly vscode.Selection[];
  originalTexts: string[];
  newText: string;
  timestamp: number;
}

// スニペットのデータ型を定義
interface CodeSnippet {
  id: string;
  name: string;
  code: string;
}

export class SnippetManager implements vscode.WebviewViewProvider {
  public static readonly viewType = "code-inserter.helloWorldView";
  private static readonly SETTINGS_KEY = "snippets";

  private _view?: vscode.WebviewView;
  private _disposables: vscode.Disposable[] = [];
  // 最後の挿入操作を記録
  private _lastInsertOperation?: InsertOperation;
  // 保存されたスニペット
  private _snippets: CodeSnippet[] = [];
  private _lastInsertedAt?: {
    position: vscode.Position;
    filePath: string;
    uid: string;
  };

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) {
    // 初期化時にスニペットを読み込む
    this._loadSnippets();
  }

  private _loadSnippets() {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        console.log("No workspace folders found");
        return;
      }

      const workspaceFolder = workspaceFolders[0];
      const settings = vscode.workspace.getConfiguration(
        "code-inserter",
        workspaceFolder.uri
      );
      const snippetsJson = settings.get<string>(SnippetManager.SETTINGS_KEY);

      if (snippetsJson) {
        try {
          this._snippets = JSON.parse(snippetsJson);
          console.log(
            "Loaded snippets from workspace settings:",
            this._snippets
          );
        } catch (parseError) {
          console.error("Error parsing snippets JSON:", parseError);
          this._snippets = [];
        }
      } else {
        this._snippets = [];
        console.log("No saved snippets found in workspace settings");
      }
    } catch (error) {
      console.error("Error loading snippets:", error);
      this._snippets = [];
    }
  }

  private async _saveSnippets(snippets: CodeSnippet[]) {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        console.log("No workspace folders found");
        return;
      }

      const workspaceFolder = workspaceFolders[0];
      const settings = vscode.workspace.getConfiguration(
        "code-inserter",
        workspaceFolder.uri
      );

      // スニペットをJSON文字列に変換
      const snippetsJson = JSON.stringify(snippets);
      await settings.update(SnippetManager.SETTINGS_KEY, snippetsJson, true);

      this._snippets = snippets;
      console.log("Snippets saved to workspace settings:", snippets);
    } catch (error) {
      console.error("Error saving snippets:", error);
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
      webviewView.webview.html = this._getWebviewContent(webviewView.webview);
      console.log("Webview HTML set successfully");
    } catch (error) {
      console.error("Error setting webview HTML:", error);
    }

    // WebViewが準備できたら保存されたスニペットを送信
    webviewView.webview.onDidReceiveMessage((message) => {
      if (message.type === "ready") {
        // WebViewが準備完了したらスニペットを送信
        this._sendSnippetsToWebView();
      }
    });

    webviewView.webview.onDidReceiveMessage(
      async (message) => {
        console.log("Received message:", message);
        switch (message.type) {
          case "hello":
            const text = message.text || "Hello World from React!";
            vscode.window.showInformationMessage(text);
            return;
          case "insert":
            await this.insertCodeAtCursor(message.code, message.snippetId);
            return;
          case "jumpToLocation":
            await this.jumpToLocation(message.fileName, message.line);
            return;
          case "updateSnippets":
            if (message.snippets) {
              await this._saveSnippets(message.snippets);
            }
            return;
          case "removeCode":
            if (message.uid) {
              await this.removeCodeByUid(message.uid);
            }
            return;
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

  private _sendSnippetsToWebView() {
    if (this._view) {
      console.log("Sending snippets to WebView:", this._snippets);
      this._view.webview.postMessage({
        type: "loadSnippets",
        snippets: this._snippets,
      });
    }
  }

  private async insertCodeAtCursor(code: string, filePath: string) {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("アクティブなエディタが見つかりません");
        return;
      }

      // 現在のカーソル位置を取得
      const position = editor.selection.active;

      // 挿入するコードの前後にコメントを追加
      const uid = this.generateUid();
      const wrappedCode = `/// code inserter uid=${uid} START\n${code}\n/// code inserter uid=${uid} END`;

      // コードを挿入
      await editor.edit((editBuilder) => {
        editBuilder.insert(position, wrappedCode);
      });

      // 挿入位置を記録
      this._lastInsertedAt = {
        position: position,
        filePath: filePath,
        uid: uid,
      };

      // 挿入したコードの位置に移動
      const newPosition = position.translate(0, wrappedCode.length);
      editor.selection = new vscode.Selection(newPosition, newPosition);
      editor.revealRange(new vscode.Range(newPosition, newPosition));

      // 挿入成功を通知
      vscode.window.showInformationMessage("コードを挿入しました");
    } catch (error) {
      console.error("コード挿入エラー:", error);
      vscode.window.showErrorMessage("コードの挿入に失敗しました");
    }
  }

  private generateUid(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private _getWebviewContent(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "dist", "webview", "index.js")
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "dist", "webview", "styles.css")
    );

    return `<!DOCTYPE html>
            <html lang="ja">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline' 'unsafe-eval'; img-src ${webview.cspSource} data:;">
                <title>Code Inserter</title>
                <style>
                    #root {
                        height: 100%;
                        width: 100%;
                    }
                    body {
                        padding: 0;
                        margin: 0;
                        height: 100vh;
                        width: 100vw;
                        overflow: hidden;
                    }
                </style>
                <link rel="stylesheet" href="${styleUri}">
            </head>
            <body>
                <div id="root"></div>
                <script>
                    window.addEventListener('error', function(e) {
                        console.error('Error in script:', e);
                    });
                    
                    // WebViewの準備完了時に通知
                    window.addEventListener('load', function() {
                        const vscode = acquireVsCodeApi();
                        vscode.postMessage({ type: 'ready' });
                    });
                </script>
                <script src="${scriptUri}"></script>
            </body>
            </html>`;
  }

  private async jumpToLocation(fileName: string, line: number) {
    try {
      const document = await vscode.workspace.openTextDocument(fileName);
      const position = new vscode.Position(line - 1, 0);
      const selection = new vscode.Selection(position, position);

      await vscode.window.showTextDocument(document, {
        selection: selection,
        preserveFocus: true,
      });
    } catch (error) {
      console.error("Error jumping to location:", error);
      vscode.window.showErrorMessage("指定された位置に移動できませんでした");
    }
  }

  private async removeCodeByUid(uid: string) {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("アクティブなエディタが見つかりません");
        return;
      }

      const document = editor.document;
      const text = document.getText();

      // uidを含むコメントブロックを探す
      const startPattern = new RegExp(`/// code inserter uid=${uid} START`);
      const endPattern = new RegExp(`/// code inserter uid=${uid} END`);

      const startMatch = text.match(startPattern);
      const endMatch = text.match(endPattern);

      if (!startMatch || !endMatch) {
        vscode.window.showErrorMessage(
          "該当するコードブロックが見つかりません"
        );
        return;
      }

      const startIndex = startMatch.index!;
      const endIndex = endMatch.index! + endMatch[0].length;

      // コードブロックを削除
      await editor.edit((editBuilder) => {
        editBuilder.delete(
          new vscode.Range(
            document.positionAt(startIndex),
            document.positionAt(endIndex)
          )
        );
      });

      vscode.window.showInformationMessage("コードを削除しました");
    } catch (error) {
      console.error("コード削除エラー:", error);
      vscode.window.showErrorMessage("コードの削除に失敗しました");
    }
  }

  public dispose() {
    this._disposables.forEach((d) => d.dispose());
  }
}
