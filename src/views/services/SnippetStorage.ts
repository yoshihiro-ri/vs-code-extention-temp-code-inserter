import * as vscode from "vscode";
import { CodeSnippet } from "../types";

export class SnippetStorage {
  private static readonly SETTINGS_KEY = "snippets";

  constructor(private readonly workspaceFolder: vscode.WorkspaceFolder) {}

  async loadSnippets(): Promise<CodeSnippet[]> {
    try {
      const settings = vscode.workspace.getConfiguration(
        "code-inserter",
        this.workspaceFolder.uri
      );
      const snippetsJson = settings.get<string>(SnippetStorage.SETTINGS_KEY);

      if (snippetsJson) {
        try {
          const snippets = JSON.parse(snippetsJson);
          console.log("Loaded snippets from workspace settings:", snippets);
          return snippets;
        } catch (parseError) {
          console.error("Error parsing snippets JSON:", parseError);
          return [];
        }
      } else {
        console.log("No saved snippets found in workspace settings");
        return [];
      }
    } catch (error) {
      console.error("Error loading snippets:", error);
      return [];
    }
  }

  async saveSnippets(snippets: CodeSnippet[]): Promise<void> {
    try {
      const settings = vscode.workspace.getConfiguration(
        "code-inserter",
        this.workspaceFolder.uri
      );

      const snippetsJson = JSON.stringify(snippets);
      await settings.update(SnippetStorage.SETTINGS_KEY, snippetsJson, true);

      console.log("Snippets saved to workspace settings:", snippets);
    } catch (error) {
      console.error("Error saving snippets:", error);
    }
  }
}
