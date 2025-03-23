import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class HelloWorldView implements vscode.WebviewViewProvider {
    public static readonly viewType = 'code-inserter.helloWorldView';

    private _view?: vscode.WebviewView;
    private _disposables: vscode.Disposable[] = [];

    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) {}

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

        webviewView.webview.onDidReceiveMessage(
            message => {
                console.log('Received message:', message);
                switch (message.command) {
                    case 'hello':
                        vscode.window.showInformationMessage('Hello World from React!');
                        return;
                }
            },
            null,
            this._disposables
        );
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
            </script>
            <script src="${scriptUri}"></script>
        </body>
        </html>`;
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