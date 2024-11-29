import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const documentId = params.id;

    // Fetch document details
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // Read the document file
    const filePath = path.join(
      process.cwd(),
      "uploads",
      "documents",
      document.filePath,
    );
    const buffer = await fs.readFile(filePath);

    // Create response with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${document.name}"`,
      },
    });
  } catch (error) {
    console.error("Document download error:", error);
    return NextResponse.json(
      { error: "Failed to download document" },
      { status: 500 },
    );
  }
}
