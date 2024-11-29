import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    // First, fetch the document to get its file path
    const document = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // Delete the physical file
    const filePath = join(
      process.cwd(),
      "uploads",
      "documents",
      document.filePath,
    );
    await unlink(filePath);

    // Delete the database record
    await prisma.document.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Document deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 },
    );
  }
}
