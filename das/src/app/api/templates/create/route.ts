// app/api/templates/create/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import PizZip from "pizzip";

// Create directory if it doesn't exist
async function ensureDirectoryExists(dir: string) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    // Directory might already exist, which is fine
    if ((error as any).code !== "EEXIST") {
      throw error;
    }
  }
}

// Function to extract variables from a template
function extractTemplateVariables(content: string): Set<string> {
  const variableRegex = /{{([^{}]+)}}/g;
  const variables = new Set<string>();
  let match;

  while ((match = variableRegex.exec(content)) !== null) {
    // Clean up the variable name and add it
    const varName = match[1].trim().split(".")[0]; // Handle nested paths like user.name
    if (!varName.startsWith("#") && !varName.startsWith("/")) {
      // Ignore Handlebars helpers
      variables.add(varName);
    }
  }

  return variables;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), "uploads", "templates");
    await ensureDirectoryExists(uploadDir);

    // Combine sections into template content
    const templateContent = validatedData.sections
      .map((section) => section.content)
      .join("\n\n");

    // Extract variables
    const variables = extractTemplateVariables(templateContent);

    // Create Word document
    const zip = new PizZip();
    zip.file(
      "word/document.xml",
      `
      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:r>
              <w:t>${templateContent}</w:t>
            </w:r>
          </w:p>
        </w:body>
      </w:document>
    `,
    );

    // Generate file
    const buffer = zip.generate({ type: "nodebuffer" });

    // Save file
    const fileName = `${Date.now()}-${validatedData.name.replace(/\s+/g, "-").toLowerCase()}.docx`;
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Save to database
    const template = await prisma.template.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || "",
        category: validatedData.category || "general",
        filePath: fileName,
        variables: Array.from(variables),
      },
    });

    return NextResponse.json({
      message: "Template created successfully",
      template: {
        id: template.id,
        name: template.name,
        variables: Array.from(variables),
      },
    });
  } catch (error) {
    console.error("Template creation error:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 },
    );
  }
}
