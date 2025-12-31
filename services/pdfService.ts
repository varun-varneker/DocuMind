
import { DocumentChunk } from '../types';

// Declare PDF.js globally as it's loaded via CDN
declare const pdfjsLib: any;

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export const extractTextFromPdf = async (file: File): Promise<DocumentChunk[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const chunks: DocumentChunk[] = [];
  const CHUNK_SIZE = 800; // characters
  const CHUNK_OVERLAP = 150;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    
    // Simple sliding window chunking
    let start = 0;
    let chunkIdx = 0;
    
    while (start < pageText.length) {
      const end = Math.min(start + CHUNK_SIZE, pageText.length);
      const text = pageText.substring(start, end);
      
      chunks.push({
        id: `p${i}-c${chunkIdx}`,
        text,
        pageNumber: i,
        metadata: {
          chunkIndex: chunkIdx,
          totalChunks: 0 // Will be updated later
        }
      });
      
      if (end === pageText.length) break;
      start += (CHUNK_SIZE - CHUNK_OVERLAP);
      chunkIdx++;
    }
  }

  return chunks;
};
