import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Define the update schema
const updateTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = updateTemplateSchema.parse(body);

    // Update the template
    const updatedTemplate = await prisma.template.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error("Template update error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 },
    );
  }
}

// Handle template deletion
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    await prisma.template.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Template deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 },
    );
  }
}
