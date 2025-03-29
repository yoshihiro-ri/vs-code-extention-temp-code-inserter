import * as React from "react";
import { useState, useEffect } from "react";
import SnippetForm from "./components/SnippetForm";
import SnippetList from "./components/SnippetList";
import { CodeSnippet } from "./models/types";

// VSCodeのAPIとのメッセージハンドラー
declare const acquireVsCodeApi: () => {
  postMessage: (message: any) => void;
  setState: (state: any) => void;
  getState: () => any;
};

// VSCodeのAPIを一度だけ取得
const vscode = acquireVsCodeApi();

// メインアプリコンポーネント
const App: React.FC = () => {
  // スニペットの状態を管理
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);

  // 初期化時にVSCodeから保存されたスニペットを読み込む
  useEffect(() => {
    // WebViewの準備完了を通知
    vscode.postMessage({
      type: "ready",
    });

    // メッセージハンドラを設定
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;

      switch (message.type) {
        case "loadSnippets":
          setSnippets(message.snippets || []);
          break;
        case "insertComplete":
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
    window.addEventListener("message", messageHandler);

    // コンポーネントがアンマウントされるときにリスナーを削除
    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, []);

  // スニペットの挿入情報を更新する関数
  const updateSnippetInsertionInfo = (
    snippetId: string,
    positions: number[],
    fileName: string,
    filePath: string
  ) => {
    setSnippets((prevSnippets) => {
      const updatedSnippets = prevSnippets.map((snippet) => {
        if (snippet.id === snippetId) {
          return {
            ...snippet,
            lastInsertedAt: {
              positions,
              filePath,
              timestamp: new Date().toISOString(),
            },
          };
        }
        return snippet;
      });

      // VSCodeに更新を通知
      vscode.postMessage({
        type: "updateSnippets",
        snippets: updatedSnippets,
      });

      return updatedSnippets;
    });
  };

  // 新しいスニペットを追加する関数
  const handleAddSnippet = (name: string, code: string) => {
    const newSnippet: CodeSnippet = {
      id: crypto.randomUUID(),
      name,
      code,
    };

    const updatedSnippets = [...snippets, newSnippet];
    setSnippets(updatedSnippets);

    // VSCodeに更新を通知
    vscode.postMessage({
      type: "updateSnippets",
      snippets: updatedSnippets,
    });

    return true;
  };

  // スニペットを削除する関数
  const handleDeleteSnippet = (id: string) => {
    const updatedSnippets = snippets.filter((snippet) => snippet.id !== id);
    setSnippets(updatedSnippets);

    // VSCodeに更新を通知
    vscode.postMessage({
      type: "updateSnippets",
      snippets: updatedSnippets,
    });
  };

  // スニペットを挿入する関数
  const handleInsertSnippet = (
    code: string,
    snippetId: string,
    lastInsertedAt: { filePath: string; positions: number[] }
  ) => {
    // VSCodeに挿入リクエストを送信
    vscode.postMessage({
      type: "insert",
      code,
      snippetId,
      lastInsertedAt,
    });
  };

  // 特定のファイルの特定行にジャンプする関数
  const handleJumpToLocation = (filePath: string, line: number) => {
    // VSCodeにジャンプリクエストを送信
    vscode.postMessage({
      type: "jumpToLocation",
      filePath,
      line,
    });
  };

  // スニペットを取り消す関数
  const handleRetract = (id: string) => {
    // コードの削除を要求
    vscode.postMessage({
      type: "removeCode",
      snippetId: id,
    });

    const updatedSnippets = snippets.map((snippet) => {
      if (snippet.id === id) {
        return {
          ...snippet,
          is_inserted: false,
          lastInsertedAt: undefined,
        };
      }
      return snippet;
    });

    setSnippets(updatedSnippets);

    // VSCodeに更新を通知
    vscode.postMessage({
      type: "updateSnippets",
      snippets: updatedSnippets,
    });
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">コードスニペット管理</h1>
      </header>

      <main className="app-content">
        <div className="form-section">
          <h2 className="section-title">新しいスニペットを追加</h2>
          <SnippetForm onAddSnippet={handleAddSnippet} />
        </div>

        <div className="list-section">
          <h2 className="section-title">登録済みスニペット</h2>
          <SnippetList
            snippets={snippets}
            onInsert={handleInsertSnippet}
            onDelete={handleDeleteSnippet}
            onJumpToLocation={handleJumpToLocation}
            onRetract={handleRetract}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
