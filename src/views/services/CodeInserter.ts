import * as vscode from "vscode";

export class CodeInserter {
  generateUid(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async insertCodeAtCursor(
    code: string,
    snippetId: string,
    onInsertComplete?: (snippetId: string) => void
  ): Promise<string> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      throw new Error("アクティブなエディタが見つかりません");
    }

    const position = editor.selection.active;
    const wrappedCode = `\n/// code inserter snippetId=${snippetId} START\n${code}\n/// code inserter snippetId=${snippetId} END\n`;

    await editor.edit((editBuilder) => {
      editBuilder.insert(position, wrappedCode);
    });

    // 挿入したコードの行数を計算
    const lines = wrappedCode.split("\n").length;
    // 挿入位置から行数を加算して、次の行の改行位置を取得
    const newPosition = position.translate(lines, 0);
    editor.selection = new vscode.Selection(newPosition, newPosition);
    editor.revealRange(new vscode.Range(newPosition, newPosition));

    if (onInsertComplete) {
      onInsertComplete(snippetId);
    }

    return snippetId;
  }

  async removeCodeByUid(uid: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      throw new Error("アクティブなエディタが見つかりません");
    }

    const document = editor.document;
    const text = document.getText();

    const startPattern = new RegExp(`/// code inserter uid=${uid} START`);
    const endPattern = new RegExp(`/// code inserter uid=${uid} END`);

    const startMatch = text.match(startPattern);
    const endMatch = text.match(endPattern);

    if (!startMatch || !endMatch) {
      throw new Error("該当するコードブロックが見つかりません");
    }

    const startIndex = startMatch.index!;
    const endIndex = endMatch.index! + endMatch[0].length;

    await editor.edit((editBuilder) => {
      editBuilder.delete(
        new vscode.Range(
          document.positionAt(startIndex),
          document.positionAt(endIndex)
        )
      );
    });
  }

  async jumpToLocation(filePath: string, line: number): Promise<void> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        throw new Error("ワークスペースフォルダが見つかりません");
      }

      // 相対パスから絶対パスに変換
      const absolutePath = vscode.Uri.joinPath(workspaceFolder.uri, filePath);
      const document = await vscode.workspace.openTextDocument(absolutePath);
      const position = new vscode.Position(line - 1, 0);
      const selection = new vscode.Selection(position, position);

      await vscode.window.showTextDocument(document, {
        selection: selection,
        preserveFocus: true,
      });
    } catch (error) {
      console.error("Error jumping to location:", error);
      throw new Error("指定された位置に移動できませんでした");
    }
  }

  async removeCodeBySnippetId(snippetId: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      throw new Error("アクティブなエディタが見つかりません");
    }

    const document = editor.document;
    const text = document.getText();

    const startPattern = new RegExp(
      `/// code inserter snippetId=${snippetId} START`
    );
    const endPattern = new RegExp(
      `/// code inserter snippetId=${snippetId} END`
    );

    const startMatch = text.match(startPattern);
    const endMatch = text.match(endPattern);

    if (!startMatch || !endMatch) {
      throw new Error("該当するコードブロックが見つかりません");
    }

    const startIndex = startMatch.index!;
    const endIndex = endMatch.index! + endMatch[0].length;

    await editor.edit((editBuilder) => {
      editBuilder.delete(
        new vscode.Range(
          document.positionAt(startIndex),
          document.positionAt(endIndex)
        )
      );
    });
  }
}
