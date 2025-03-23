import * as React from 'react';

// VS Code WebViewとの通信用インターフェースを宣言
declare global {
    interface Window {
        acquireVsCodeApi: () => {
            postMessage: (message: any) => void;
        };
    }
}

// VSCodeのAPIを取得
const vscode = window.acquireVsCodeApi();

const App: React.FC = () => {
    React.useEffect(() => {
        console.log('App component mounted');
    }, []);

    const handleClick = () => {
        console.log('Button clicked');
        vscode.postMessage({
            command: 'hello'
        });
    };

    return (
        <div className="app" style={{ padding: '20px' }}>
            <h1>Hello World from React!</h1>
            <p>これはReactで作成されたWebViewです。</p>
            <button 
                onClick={handleClick}
                style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--vscode-button-background, #0e639c)',
                    color: 'var(--vscode-button-foreground, white)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                クリックしてください！
            </button>
        </div>
    );
};

export default App; 