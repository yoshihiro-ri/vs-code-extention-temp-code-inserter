export interface CodeSnippet {
    id: string;
    name: string;
    code: string;
    lastInsertedAt?: {
        positions: number[];
        fileName: string;
        filePath: string;
        timestamp: string;
    };
} 