import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

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
    insertHistory: any[];
    lastInsertedAt?: {
        positions: number[];
        fileName: string;
        filePath: string;
        timestamp: string;
    };
}

export class HelloWorldView implements vscode.WebviewViewProvider {
    public static readonly viewType = 'code-inserter.helloWorldView';

    private _view?: vscode.WebviewView;
    private _disposables: vscode.Disposable[] = [];
    // 最後の挿入操作を記録
    private _lastInsertOperation?: InsertOperation;
    // スニペットを保存するためのストレージキー
    private static readonly STORAGE_KEY = 'code-inserter.snippets';
    // 保存されたスニペット
    private _snippets: CodeSnippet[] = [];

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _context: vscode.ExtensionContext
    ) {
        // 保存されたスニペットを読み込む
        this._loadSnippets();
    }

    // 保存されたスニペットをロードする
    private _loadSnippets() {
        try {
            // ExtensionContextのglobalStateから保存されたスニペットを取得
            const snippetsJson = this._context.globalState.get<string>(HelloWorldView.STORAGE_KEY);
            
            if (snippetsJson) {
                this._snippets = JSON.parse(snippetsJson);
                console.log('Loaded snippets from globalState:', this._snippets);
            } else {
                this._snippets = [];
                console.log('No saved snippets found in globalState');
            }
        } catch (error) {
            console.error('Error loading snippets:', error);
            this._snippets = [];
        }
    }

    // スニペットを保存する
    private async _saveSnippets(snippets: CodeSnippet[]) {
        try {
            this._snippets = snippets;
            // ExtensionContextのglobalStateに保存
            await this._context.globalState.update(
                HelloWorldView.STORAGE_KEY,
                JSON.stringify(snippets)
            );
            console.log('Snippets saved to globalState:', snippets);
        } catch (error) {
            console.error('Error saving snippets:', error);
        }
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        console.log('Resolving webview view');
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'dist')
            ]
        };

        try {
            webviewView.webview.html = this._getWebviewContent(webviewView.webview);
            console.log('Webview HTML set successfully');
        } catch (error) {
            console.error('Error setting webview HTML:', error);
        }

        // WebViewが準備できたら保存されたスニペットを送信
        webviewView.webview.onDidReceiveMessage(
            message => {
                if (message.type === 'ready') {
                    // WebViewが準備完了したらスニペットを送信
                    this._sendSnippetsToWebView();
                }
            }
        );

        webviewView.webview.onDidReceiveMessage(
            async message => {
                console.log('Received message:', message);
                switch (message.type) {
                    case 'hello':
                        const text = message.text || 'Hello World from React!';
                        vscode.window.showInformationMessage(text);
                        return;
                    case 'insert':
                        await this.insertCodeAtCursor(message.code, message.snippetId);
                        return;
                    case 'jumpToLocation':
                        await this.jumpToLocation(message.fileName, message.line);
                        return;
                    case 'updateSnippets':
                        // スニペットの保存処理
                        if (message.snippets) {
                            await this._saveSnippets(message.snippets);
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

    // 保存されたスニペットをWebViewに送信
    private _sendSnippetsToWebView() {
        if (this._view) {
            console.log('Sending snippets to WebView:', this._snippets);
            this._view.webview.postMessage({
                type: 'loadSnippets',
                snippets: this._snippets
            });
        }
    }

    private async insertCodeAtCursor(code: string, snippetId?: string): Promise<void> {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('エディタが開かれていません。');
                return;
            }

            // エディタの選択範囲にテキストを挿入
            let insertPositions: number[] = [];
            
            await editor.edit(editBuilder => {
                editor.selections.forEach(selection => {
                    // 挿入前の行番号を記録
                    const line = selection.start.line + 1; // 1-indexed
                    insertPositions.push(line);
                    
                    editBuilder.replace(selection, code);
                });
            });

            // ファイル名とパスを取得
            const fileName = editor.document.fileName.split('/').pop() || editor.document.fileName;
            const filePath = editor.document.fileName;

            // 挿入情報をWebViewに送信
            if (this._view) {
                this._view.webview.postMessage({
                    type: 'insertComplete',
                    positions: insertPositions,
                    fileName: fileName,
                    filePath: filePath,
                    timestamp: new Date().toLocaleString(),
                    snippetId: snippetId
                });
            }

            vscode.window.showInformationMessage(`コードを挿入しました。(${insertPositions.join(', ')}行目)`);
        } catch (error) {
            console.error('Error inserting code:', error);
            vscode.window.showErrorMessage('コードの挿入中にエラーが発生しました。');
        }
    }

    private _getWebviewContent(webview: vscode.Webview) {
        // ReactのビルドファイルへのパスURIを取得
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'index.js')
        );

        // デバッグメッセージを出力
        console.log('Script URI:', scriptUri.toString());

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline' 'unsafe-eval'; img-src ${webview.cspSource} data:;">
            <title>Hello World</title>
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

    // 特定のファイルの特定の行にジャンプする関数
    private async jumpToLocation(fileName: string, line: number): Promise<void> {
        try {
            // ワークスペースから該当するファイルを検索
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage('ワークスペースが開かれていません。');
                return;
            }

            let targetUri: vscode.Uri | undefined;

            // ファイルパスが絶対パスかどうかを確認
            if (fileName.startsWith('/')) {
                // 絶対パスの場合は直接ファイルを開く
                targetUri = vscode.Uri.file(fileName);
            } else {
                // ファイル名だけが保存されている場合、フルパスを再構築する
                // まずは現在のファイルのディレクトリを基準にする
                const activeEditor = vscode.window.activeTextEditor;

                if (activeEditor) {
                    const currentDir = vscode.Uri.file(
                        activeEditor.document.fileName.substring(0, activeEditor.document.fileName.lastIndexOf('/'))
                    );
                    const possiblePath = vscode.Uri.joinPath(currentDir, fileName);

                    try {
                        await vscode.workspace.fs.stat(possiblePath);
                        targetUri = possiblePath;
                    } catch {
                        // ファイルが見つからない場合は、ワークスペース全体を検索
                        targetUri = undefined;
                    }
                }

                // ワークスペース全体からファイルを検索
                if (!targetUri) {
                    const files = await vscode.workspace.findFiles(`**/${fileName}`, null, 1);
                    if (files.length === 0) {
                        vscode.window.showErrorMessage(`ファイル "${fileName}" が見つかりませんでした。`);
                        return;
                    }
                    targetUri = files[0];
                }
            }

            // ファイルを開く
            try {
                const document = await vscode.workspace.openTextDocument(targetUri);
                const editor = await vscode.window.showTextDocument(document);
                
                // 行にジャンプ (0-indexed なので -1 する)
                const position = new vscode.Position(line - 1, 0);
                editor.selection = new vscode.Selection(position, position);
                
                // エディタをスクロールして該当行を表示
                editor.revealRange(
                    new vscode.Range(position, position),
                    vscode.TextEditorRevealType.InCenter
                );
                
                vscode.window.showInformationMessage(`${fileName.split('/').pop()} の ${line}行目にジャンプしました。`);
            } catch (error) {
                console.error('Error opening document:', error);
                vscode.window.showErrorMessage(`ファイル "${fileName}" を開けませんでした。`);
            }
        } catch (error) {
            console.error('Error jumping to location:', error);
            vscode.window.showErrorMessage('指定位置へのジャンプ中にエラーが発生しました。');
        }
    }

    public dispose() {
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
} 