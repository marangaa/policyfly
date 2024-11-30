import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";
import { DocumentNotFoundError } from "@/lib/errors";
import type { Document, DocumentDownloadResponse } from "@/types/document";

export class DocumentService {
  private static readonly UPLOAD_DIR = path.join(process.cwd(), "uploads", "documents");

  static async downloadDocument(id: string): Promise<DocumentDownloadResponse> {
    const document = await this.getDocument(id);
    const buffer = await this.getDocumentBuffer(document.filePath);

    return {
      buffer,
      filename: document.name
    };
  }

  private static async getDocument(id: string): Promise<Document> {
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) throw new DocumentNotFoundError(id);
    return document;
  }

  private static async getDocumentBuffer(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.UPLOAD_DIR, filePath);
    return await fs.readFile(fullPath);
  }
}