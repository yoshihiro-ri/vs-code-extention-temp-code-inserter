import { useState, useEffect } from 'react';
import { CodeSnippet, InsertHistory } from '../models/types';

export interface UseSnippetsReturn {
  snippets: CodeSnippet[];
  addSnippet: (name: string, code: string) => boolean;
  deleteSnippet: (id: string) => void;
  updateSnippetInsertHistory: (params: {
    snippetId?: string;
    positions: number[];
    fileName: string;
    filePath?: string;
    timestamp: string;
  }) => void;
}

const STORAGE_KEY = 'codeSnippets';

export const useSnippets = (): UseSnippetsReturn => {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);

  // ローカルストレージからスニペットを読み込む
  useEffect(() => {
    try {
      const savedSnippets = localStorage.getItem(STORAGE_KEY);
      if (savedSnippets) {
        const snippetsData = JSON.parse(savedSnippets);
        setSnippets(snippetsData);
      }
    } catch (error) {
      console.error('Failed to load snippets:', error);
    }
  }, []);

  // スニペットが変更されたら保存する
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
  }, [snippets]);

  // 新しいスニペットを追加
  const addSnippet = (name: string, code: string): boolean => {
    if (name.trim() && code.trim()) {
      const newSnippet: CodeSnippet = {
        id: Date.now().toString(),
        name,
        code,
        insertHistory: []
      };
      setSnippets([...snippets, newSnippet]);
      return true;
    }
    return false;
  };

  // スニペットを削除
  const deleteSnippet = (id: string) => {
    setSnippets(snippets.filter(snippet => snippet.id !== id));
  };

  // 挿入情報を更新する
  const updateSnippetInsertHistory = ({
    snippetId,
    positions,
    fileName,
    filePath,
    timestamp
  }: {
    snippetId?: string;
    positions: number[];
    fileName: string;
    filePath?: string;
    timestamp: string;
  }) => {
    setSnippets(currentSnippets => {
      const updatedSnippets = [...currentSnippets];
      
      // 挿入情報オブジェクトを作成（filePathが未定義の場合は空文字列を設定）
      const insertInfo: InsertHistory = {
        positions,
        fileName,
        filePath: filePath || '',
        timestamp
      };
      
      // スニペットIDが含まれている場合、そのスニペットを更新
      if (snippetId) {
        const index = updatedSnippets.findIndex(s => s.id === snippetId);
        if (index >= 0) {
          const targetSnippet = updatedSnippets[index];
          updatedSnippets[index] = {
            ...targetSnippet,
            lastInsertedAt: insertInfo
          };
          return updatedSnippets;
        }
      }
      
      // スニペットIDがない場合、または対応するスニペットが見つからない場合は最後のスニペットを更新
      if (updatedSnippets.length > 0) {
        const lastUsedSnippet = updatedSnippets[updatedSnippets.length - 1];
        const updatedSnippet = {
          ...lastUsedSnippet,
          lastInsertedAt: insertInfo
        };
        updatedSnippets[updatedSnippets.length - 1] = updatedSnippet;
      }
      
      return updatedSnippets;
    });
  };

  return {
    snippets,
    addSnippet,
    deleteSnippet,
    updateSnippetInsertHistory
  };
}; 