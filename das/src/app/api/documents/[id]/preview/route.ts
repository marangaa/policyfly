import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    const filePath = join(
      process.cwd(),
      "uploads",
      "documents",
      document.filePath,
    );
    const stats = await stat(filePath);

    // Create readable stream
    const stream = createReadStream(filePath);

    // Return the file for preview (inline display)
    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `inline; filename="${document.name}"`,
        "Content-Length": stats.size.toString(),
      },
    });
  } catch (error) {
    console.error("Document preview error:", error);
    return NextResponse.json(
      { error: "Failed to preview document" },
      { status: 500 },
    );
  }
}
