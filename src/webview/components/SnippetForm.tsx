import * as React from "react";
import { useState } from "react";

// スニペットフォームのプロパティ
export interface SnippetFormProps {
  onAddSnippet: (name: string, code: string) => boolean;
}

// スニペット作成フォームコンポーネント
const SnippetForm: React.FC<SnippetFormProps> = ({ onAddSnippet }) => {
  const [name, setName] = useState<string>("undefined");
  const [code, setCode] = useState<string>("");
  const [error, setError] = useState<string>("");

  // スニペット追加処理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // バリデーション
    if (!name || !name.trim()) {
      setError("スニペット名を入力してください");
      return;
    }

    if (!code.trim()) {
      setError("コードを入力してください");
      return;
    }

    const success = onAddSnippet(name, code);
    if (success) {
      // フォームをリセット
      setName("undefined");
      setCode("");
    }
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <div className="form-section">
        <label htmlFor="snippet-name" className="form-label">
          スニペット名
        </label>
        <input
          id="snippet-name"
          type="text"
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="スニペット名を入力"
        />
      </div>

      <div className="form-section">
        <label htmlFor="snippet-code" className="form-label">
          コード
        </label>
        <textarea
          id="snippet-code"
          className="form-textarea"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ここにコードを入力"
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button type="submit" className="button-secondary">
        スニペットを追加
      </button>
    </form>
  );
};

export default SnippetForm;
