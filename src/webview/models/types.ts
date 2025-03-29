export interface CodeSnippet {
  id: string;
  name: string;
  code: string;
  is_inserted?: boolean;
  lastInsertedAt?: {
    positions: number[];
    filePath: string;
    timestamp: string;
  };
}
