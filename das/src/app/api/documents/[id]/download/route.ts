import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

class DocumentNotFoundError extends Error {
  constructor(id: string) {
    super(`Document with id ${id} not found`);
  }
}

async function getDocument(id: string) {
  const document = await prisma.document.findUnique({
    where: { id },
  });
  
  if (!document) {
    throw new DocumentNotFoundError(id);
  }
  
  return document;
}

async function getDocumentBuffer(filePath: string) {
  const fullPath = path.join(process.cwd(), "uploads", "documents", filePath);
  return await fs.readFile(fullPath);
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const document = await getDocument(context.params.id);
    const buffer = await getDocumentBuffer(document.filePath);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${document.name}"`,
      },
    });
  } catch (error) {
    console.error("Document download error:", error);
    
    if (error instanceof DocumentNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: "Failed to download document" },
      { status: 500 }
    );
  }
}