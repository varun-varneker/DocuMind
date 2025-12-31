
export interface DocumentChunk {
  id: string;
  text: string;
  pageNumber: number;
  metadata: {
    chunkIndex: number;
    totalChunks: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: DocumentChunk[];
  timestamp: Date;
}

export interface VectorMatch {
  chunk: DocumentChunk;
  score: number;
}

export interface ProcessingState {
  status: 'idle' | 'parsing' | 'chunking' | 'ready' | 'error';
  progress: number;
  message?: string;
}
