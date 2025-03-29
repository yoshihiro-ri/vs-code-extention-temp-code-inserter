import * as React from "react";
import { CodeSnippet } from "../models/types";

// スニペットアイテムのコンポーネント
export interface SnippetItemProps {
  snippet: CodeSnippet;
  onInsert: (code: string, snippetId: string) => void;
  onDelete: (id: string) => void;
  onJumpToLocation?: (fileName: string, filePath: string, line: number) => void;
}

const SnippetItem: React.FC<SnippetItemProps> = ({
  snippet,
  onInsert,
  onDelete,
  onJumpToLocation,
}) => {
  const handleInsert = () => {
    onInsert(snippet.code, snippet.id);
  };

  const handleDelete = () => {
    onDelete(snippet.id);
  };

  const handleJumpToLocation = () => {
    if (snippet.lastInsertedAt && onJumpToLocation) {
      const { fileName, filePath, positions } = snippet.lastInsertedAt;
      // 最初の挿入位置（行）にジャンプ
      if (positions.length > 0) {
        onJumpToLocation(fileName, filePath, positions[0]);
      }
    }
  };

  // 最後の挿入情報を表示用にフォーマット
  const formatLastInserted = () => {
    if (!snippet.lastInsertedAt) return null;

    const { fileName, positions, timestamp } = snippet.lastInsertedAt;
    const date = new Date(timestamp);
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

    return (
      <div className="insertion-info">
        <span
          className="info-badge"
          onClick={handleJumpToLocation}
          style={{ cursor: "pointer" }}
          title="クリックしてファイルにジャンプ"
        >
          location: {fileName} (行: {positions.join(", ")}) - {formattedDate}
        </span>
      </div>
    );
  };

  return (
    <div className="snippet-container">
      <div className="snippet-header">
        <span className="snippet-title">{snippet.name}</span>
        <div>
          <button className="button-primary" onClick={handleInsert}>
            挿入
          </button>
          <button className="button-danger" onClick={handleDelete}>
            削除
          </button>
        </div>
      </div>
      <pre className="code-preview">{snippet.code}</pre>
      {formatLastInserted()}
    </div>
  );
};

export default SnippetItem;
