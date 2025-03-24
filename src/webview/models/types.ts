export interface InsertHistory {
    positions: number[];
    fileName: string;
    filePath: string;
    timestamp: string;
}

export interface CodeSnippet {
    id: string;
    name: string;
    code: string;
    insertHistory: InsertHistory[];
    lastInsertedAt?: InsertHistory;
} 