import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

const MAX_BYTES = 5 * 1024 * 1024;

export async function extractPrivateDocument(buffer: Buffer, mimeType: string): Promise<string> {
  if (buffer.byteLength > MAX_BYTES) throw new Error("Document exceeds the 5 MB limit");
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.slice(0, 50_000);
  }
  if (mimeType === "application/pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text.slice(0, 50_000);
    } finally {
      await parser.destroy();
    }
  }
  throw new Error("Only PDF and DOCX documents are supported");
}
