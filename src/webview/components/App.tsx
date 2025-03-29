import * as React from 'react';
import { useState, useEffect } from 'react';
import SnippetForm from './SnippetForm';
import SnippetList from './SnippetList';
import { CodeSnippet } from '../models/types';

// VSCodeのAPIとのメッセージハンドラー
declare const acquireVsCodeApi: () => {
    postMessage: (message: any) => void;
    setState: (state: any) => void;
    getState: () => any;
};

// VSCodeのAPIを取得
const vscode = acquireVsCodeApi();

// メインアプリコンポーネント
const App: React.FC = () => {
    // スニペットの状態を管理
    const [snippets, setSnippets] = useState<CodeSnippet[]>([]);

    // 初期化時にVSCodeから保存されたスニペットを読み込む
    useEffect(() => {
        // メッセージハンドラを設定
        const messageHandler = (event: MessageEvent) => {
            const message = event.data;
            
            switch (message.type) {
                case 'loadSnippets':
                    setSnippets(message.snippets || []);
                    break;
                case 'insertComplete':
                    // 挿入完了時の処理
                    if (message.snippetId && message.positions && message.fileName) {
                        updateSnippetInsertionInfo(
                            message.snippetId,
                            message.positions,
                            message.fileName,
                            message.filePath
                        );
                    }
                    break;
            }
        };

        // イベントリスナーを追加
        window.addEventListener('message', messageHandler);

        // コンポーネントがアンマウントされるときにリスナーを削除
        return () => {
            window.removeEventListener('message', messageHandler);
        };
    }, []);

    // スニペットの挿入情報を更新する関数
    const updateSnippetInsertionInfo = (
        snippetId: string,
        positions: number[],
        fileName: string,
        filePath?: string
    ) => {
        setSnippets(prevSnippets => {
            const updatedSnippets = prevSnippets.map(snippet => {
                if (snippet.id === snippetId) {
                    return {
                        ...snippet,
                        lastInsertedAt: {
                            positions,
                            fileName,
                            filePath: filePath || '',
                            timestamp: new Date().toISOString()
                        }
                    };
                }
                return snippet;
            });
            
            // VSCodeに更新を通知
            vscode.postMessage({
                type: 'updateSnippets',
                snippets: updatedSnippets
            });
            
            return updatedSnippets;
        });
    };

    // 新しいスニペットを追加する関数
    const handleAddSnippet = (name: string, code: string) => {
        const newSnippet: CodeSnippet = {
            id: crypto.randomUUID(),
            name,
            code
        };
        
        const updatedSnippets = [...snippets, newSnippet];
        setSnippets(updatedSnippets);
        
        // VSCodeに更新を通知
        vscode.postMessage({
            type: 'updateSnippets',
            snippets: updatedSnippets
        });
        
        return true;
    };

    // スニペットを削除する関数
    const handleDeleteSnippet = (id: string) => {
        const updatedSnippets = snippets.filter(snippet => snippet.id !== id);
        setSnippets(updatedSnippets);
        
        // VSCodeに更新を通知
        vscode.postMessage({
            type: 'updateSnippets',
            snippets: updatedSnippets
        });
    };

    // スニペットを挿入する関数
    const handleInsertSnippet = (code: string, snippetId: string) => {
        // VSCodeに挿入リクエストを送信
        vscode.postMessage({
            type: 'insert',
            code,
            snippetId
        });
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <h1 className="app-title">Code Snippets</h1>
            </header>
            
            <main className="app-content">
                <div className="form-section">
                    <h2 className="section-title">Add New Snippet</h2>
                    <SnippetForm onAddSnippet={handleAddSnippet} />
                </div>
                
                <div className="list-section">
                    <h2 className="section-title">Your Snippets</h2>
                    <SnippetList 
                        snippets={snippets}
                        onInsert={handleInsertSnippet}
                        onDelete={handleDeleteSnippet}
                    />
                </div>
            </main>
        </div>
    );
};

export default App; 