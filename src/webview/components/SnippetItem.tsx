import * as React from "react";
import { CodeSnippet } from "../models/types";

// スニペットアイテムのコンポーネント
export interface SnippetItemProps {
  snippet: CodeSnippet;
  onInsert: (
    code: string,
    snippetId: string,
    lastInsertedAt: { filePath: string; positions: number[] }
  ) => void;
  onDelete: (id: string) => void;
  onJumpToLocation?: (filePath: string, line: number) => void;
  onRetract: (id: string) => void;
}

const SnippetItem: React.FC<SnippetItemProps> = ({
  snippet,
  onInsert,
  onDelete,
  onJumpToLocation,
  onRetract,
}) => {
  const handleInsert = () => {
    onInsert(snippet.code, snippet.id, {
      filePath: snippet.lastInsertedAt?.filePath || "",
      positions: snippet.lastInsertedAt?.positions || [],
    });
  };

  const handleDelete = () => {
    onDelete(snippet.id);
  };

  const handleRetraction = () => {
    if (snippet.lastInsertedAt && onJumpToLocation) {
      const { filePath, positions } = snippet.lastInsertedAt;
      // 最初の挿入位置（行）にジャンプ
      if (positions.length > 0) {
        onJumpToLocation(filePath, positions[0]);

        setTimeout(() => {
          onRetract(snippet.id);
        }, 200);
      }
    }
  };

  const handleJumpToLocation = () => {
    if (snippet.lastInsertedAt && onJumpToLocation) {
      const { filePath, positions } = snippet.lastInsertedAt;
      // 最初の挿入位置（行）にジャンプ
      if (positions.length > 0) {
        onJumpToLocation(filePath, positions[0]);
      }
    }
  };

  // 最後の挿入情報を表示用にフォーマット

  return (
    <div className="snippet-container">
      <div className="snippet-header">
        <span className="snippet-title">{snippet.name}</span>
        <div>
          {snippet.is_inserted && (
            <button className="button-primary" onClick={handleRetraction}>
              取り消し
            </button>
          )}
          <button className="button-primary" onClick={handleInsert}>
            挿入
          </button>
          <button className="button-danger" onClick={handleDelete}>
            削除
          </button>
        </div>
      </div>
      <pre className="code-preview">{snippet.code}</pre>
    </div>
  );
};

export default SnippetItem;
