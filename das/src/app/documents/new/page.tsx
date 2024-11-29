import { prisma } from "@/lib/prisma";
import { DocumentGenerationForm } from "./document-generation-form";
import { redirect } from "next/navigation";

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: { template?: string };
}) {
  // Fetch all templates for the selection dropdown
  const templates = await prisma.template.findMany({
    orderBy: { name: "asc" },
  });

  if (templates.length === 0) {
    // If no templates exist, redirect to template upload
    redirect("/templates/upload");
  }

  // If a template ID is provided in the URL, fetch its details
  let selectedTemplate = null;
  if (searchParams.template) {
    selectedTemplate = await prisma.template.findUnique({
      where: { id: searchParams.template },
    });
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Generate New Document
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Fill in the template variables to generate your document.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <DocumentGenerationForm
            templates={templates}
            initialTemplate={selectedTemplate}
          />
        </div>
      </div>
    </div>
  );
}
