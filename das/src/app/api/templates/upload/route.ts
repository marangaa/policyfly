import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { promises as fs } from "fs";
import path from "path";

type TemplateError = {
  properties: {
    errors?: Array<{ properties: { explanation: string } }>;
    explanation?: string;
  };
};

export async function POST(request: Request) {
  try {
    // Parse the incoming form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const category = (formData.get("category") as string) || "general";

    // Validate file existence and type
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".docx")) {
      return NextResponse.json(
        { error: "Only .docx files are allowed" },
        { status: 400 },
      );
    }

    // Read file content and convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      // Create a ZIP instance from the buffer
      const zip = new PizZip(buffer);

      // Configure Docxtemplater with error handling options
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        // Add error handling for undefined variables
        nullGetter: (part: any) => {
          if (!part.module) {
            return "{" + part.value + "}";
          }
          return "";
        },
      });

      // Get template content to extract variables
      const text = doc.getFullText();

      // Extract variables using updated regex for single curly braces
      const variableRegex = /{([^{}]+)}/g;
      const variables = new Set<string>();
      let match;

      while ((match = variableRegex.exec(text)) !== null) {
        // Clean up variable names and ensure they're valid
        const variableName = match[1].trim();
        if (variableName && !variableName.includes(" ")) {
          variables.add(variableName);
        }
      }

      // Ensure uploads directory exists
      const uploadDir = path.join(process.cwd(), "uploads", "templates");
      await fs.mkdir(uploadDir, { recursive: true });

      // Generate unique filename and save file
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = path.join(uploadDir, fileName);
      await fs.writeFile(filePath, buffer);

      // Save template to database with error handling
      const template = await prisma.template
        .create({
          data: {
            name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
            category,
            filePath: fileName,
            variables: Array.from(variables),
          },
        })
        .catch(async (dbError) => {
          // Clean up file if database save fails
          await fs.unlink(filePath).catch(console.error);
          throw dbError;
        });

      return NextResponse.json({
        message: "Template uploaded successfully",
        template: {
          id: template.id,
          name: template.name,
          variables: Array.from(variables),
        },
      });
    } catch (templateError) {
      // Handle specific Docxtemplater errors
      const error = templateError as TemplateError;
      if (error.properties && error.properties.errors instanceof Array) {
        // Collect all error explanations
        const errorMessages = error.properties.errors
          .map((e) => e.properties.explanation)
          .filter(Boolean)
          .join(", ");

        return NextResponse.json(
          {
            error: "Template format error",
            details:
              errorMessages ||
              error.properties.explanation ||
              "Invalid template format",
          },
          { status: 400 },
        );
      }
      throw templateError; // Re-throw if it's not a template error
    }
  } catch (error) {
    // Log the full error for debugging
    console.error("Template upload error:", error);

    // Return a user-friendly error message
    return NextResponse.json(
      {
        error: "Failed to process template",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}
