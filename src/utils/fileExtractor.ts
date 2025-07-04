import mammoth from 'mammoth';

export interface ExtractedContent {
  text: string;
  metadata?: {
    title?: string;
    author?: string;
    pages?: number;
    wordCount?: number;
  };
}

export class FileExtractor {
  static async extractText(file: File): Promise<ExtractedContent> {
    const fileType = this.getFileType(file);
    
    switch (fileType) {
      case 'docx':
        return this.extractFromDocx(file);
      case 'pdf':
        return this.extractFromPdf(file);
      case 'rtf':
        return this.extractFromRtf(file);
      case 'txt':
        return this.extractFromTxt(file);
      default:
        throw new Error(`Unsupported file type: ${file.type}`);
    }
  }

  private static getFileType(file: File): string {
    const extension = file.name.toLowerCase().split('.').pop();
    const mimeType = file.type.toLowerCase();

    // Check by extension first
    if (extension === 'docx' || mimeType.includes('wordprocessingml')) return 'docx';
    if (extension === 'pdf' || mimeType.includes('pdf')) return 'pdf';
    if (extension === 'rtf' || mimeType.includes('rtf')) return 'rtf';
    if (extension === 'txt' || mimeType.includes('text/plain')) return 'txt';

    throw new Error('Unsupported file format');
  }

  private static async extractFromDocx(file: File): Promise<ExtractedContent> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      return {
        text: result.value,
        metadata: {
          title: file.name.replace(/\.[^/.]+$/, ''),
          wordCount: result.value.split(/\s+/).length
        }
      };
    } catch (error) {
      throw new Error(`Failed to extract DOCX content: ${error}`);
    }
  }

  private static async extractFromPdf(file: File): Promise<ExtractedContent> {
    try {
      // For browser environment, we'll use a simpler approach
      // In a real implementation, you'd use pdf-parse or similar
      const arrayBuffer = await file.arrayBuffer();
      
      // This is a simplified PDF text extraction
      // In production, you'd want to use a proper PDF parsing library
      const text = await this.simplePdfExtraction(arrayBuffer);
      
      return {
        text,
        metadata: {
          title: file.name.replace(/\.[^/.]+$/, ''),
          wordCount: text.split(/\s+/).length
        }
      };
    } catch (error) {
      throw new Error(`Failed to extract PDF content: ${error}`);
    }
  }

  private static async simplePdfExtraction(arrayBuffer: ArrayBuffer): Promise<string> {
    // This is a very basic PDF text extraction
    // In a real implementation, use pdf-parse or PDF.js
    const uint8Array = new Uint8Array(arrayBuffer);
    const text = new TextDecoder('utf-8').decode(uint8Array);
    
    // Extract text between stream objects (very basic)
    const textMatches = text.match(/stream\s*(.*?)\s*endstream/gs);
    if (textMatches) {
      return textMatches
        .map(match => match.replace(/stream\s*|\s*endstream/g, ''))
        .join('\n')
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable chars
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    // Fallback: try to extract readable text
    return text
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static async extractFromRtf(file: File): Promise<ExtractedContent> {
    try {
      const text = await file.text();
      
      // Basic RTF text extraction
      // Remove RTF control codes and extract plain text
      let cleanText = text
        .replace(/\\[a-z]+\d*\s?/g, '') // Remove RTF control words
        .replace(/[{}]/g, '') // Remove braces
        .replace(/\\\\/g, '\\') // Unescape backslashes
        .replace(/\\'/g, "'") // Unescape quotes
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      // Clean and normalize the text
      cleanText = cleanText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, ' ')
        .replace(/\f/g, '\n')
        .replace(/\v/g, '\n')
        .replace(/[^\S\n]+/g, ' ') // Replace multiple spaces with single space, but preserve newlines
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple consecutive newlines with double newlines
        .trim();

      return {
        text: cleanText,
        metadata: {
          title: file.name.replace(/\.[^/.]+$/, ''),
          wordCount: cleanText.split(/\s+/).length
        }
      };
    } catch (error) {
      throw new Error(`Failed to extract RTF content: ${error}`);
    }
  }

  private static async extractFromTxt(file: File): Promise<ExtractedContent> {
    try {
      // Enhanced text reading with encoding detection
      const arrayBuffer = await file.arrayBuffer();
      let text: string;

      // Try UTF-8 first
      const decoder = new TextDecoder('utf-8');
      text = decoder.decode(arrayBuffer);
      
      // If UTF-8 decoding produces replacement characters, try other encodings
      if (text.includes('�') || text.includes('Ã')) {
        const decoderLatin1 = new TextDecoder('iso-8859-9'); // Turkish encoding
        text = decoderLatin1.decode(arrayBuffer);
      }

      return {
        text,
        metadata: {
          title: file.name.replace(/\.[^/.]+$/, ''),
          wordCount: text.split(/\s+/).length
        }
      };
    } catch (error) {
      throw new Error(`Failed to extract text content: ${error}`);
    }
  }
}