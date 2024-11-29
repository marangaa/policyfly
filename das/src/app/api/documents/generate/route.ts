import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { templateId, clientId, variables } = body;

    // Validate the request
    if (!templateId || !variables) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Fetch the template
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    // Read the template file
    const templatePath = path.join(
      process.cwd(),
      "uploads",
      "templates",
      template.filePath,
    );
    const templateContent = await fs.readFile(templatePath);

    // Create and configure document generator
    const zip = new PizZip(templateContent);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Render the document with provided variables
    doc.render(variables);

    // Generate the document buffer
    const buffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    // Create a filename for the generated document
    const timestamp = new Date().toISOString().replace(/[:\.]/g, "-");
    const fileName = `${template.name}-${timestamp}.docx`;
    const filePath = path.join(process.cwd(), "uploads", "documents", fileName);

    // Ensure the documents directory exists
    await fs.mkdir(path.join(process.cwd(), "uploads", "documents"), {
      recursive: true,
    });

    // Save the generated document
    await fs.writeFile(filePath, buffer);

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        name: fileName,
        filePath: fileName,
        templateId,
        clientId,
        data: variables,
      },
    });

    // Generate a temporary download URL
    const downloadUrl = `/api/documents/${document.id}/download`;

    return NextResponse.json({
      message: "Document generated successfully",
      documentId: document.id,
      downloadUrl,
      filename: fileName,
    });
  } catch (error) {
    console.error("Document generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate document" },
      { status: 500 },
    );
  }
}
