import * as vscode from "vscode";

export class WebviewContentProvider {
  constructor(private readonly extensionUri: vscode.Uri) {}

  getWebviewContent(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "dist", "webview", "index.js")
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "dist", "webview", "styles.css")
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
                </script>
                <script src="${scriptUri}"></script>
            </body>
            </html>`;
  }
}
