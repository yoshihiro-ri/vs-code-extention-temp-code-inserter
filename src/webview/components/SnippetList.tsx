import * as React from "react";
import { CodeSnippet } from "../models/types";
import SnippetItem from "./SnippetItem";

interface SnippetListProps {
  snippets: CodeSnippet[];
  onInsert: (code: string, snippetId: string) => void;
  onDelete: (id: string) => void;
  onJumpToLocation?: (fileName: string, filePath: string, line: number) => void;
}

const SnippetList: React.FC<SnippetListProps> = ({
  snippets,
  onInsert,
  onDelete,
  onJumpToLocation,
}) => {
  const renderSnippets = () => {
    if (snippets.length === 0) {
      return (
        <div className="empty-list-message">
          スニペットがありません。新しいスニペットを追加してください。
        </div>
      );
    }

    return snippets.map((snippet) => (
      <SnippetItem
        key={snippet.id}
        snippet={snippet}
        onInsert={onInsert}
        onDelete={onDelete}
        onJumpToLocation={onJumpToLocation}
      />
    ));
  };

  return <div className="snippet-list">{renderSnippets()}</div>;
};

export default SnippetList;
