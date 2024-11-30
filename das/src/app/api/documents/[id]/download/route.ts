import { NextRequest, NextResponse } from "next/server";
import { DocumentService } from "@/services/document.service";
import { AppError } from "@/lib/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { buffer, filename } = await DocumentService.downloadDocument(params.id);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Document download error:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    return NextResponse.json(
      { error: "Failed to download document" },
      { status: 500 }
    );
  }
}