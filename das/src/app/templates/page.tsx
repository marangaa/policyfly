import { prisma } from "@/lib/prisma";
import { TemplatesTable } from "./templates-table";
import Link from "next/link";

export default async function TemplatesPage() {
  // Fetch templates using server component
  const templates = await prisma.template.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Document Templates</h1>
          <Link
            href="/templates/upload"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Upload Template
          </Link>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">
              No templates yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by uploading your first document template.
            </p>
            <div className="mt-6">
              <Link
                href="/templates/upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600"
              >
                Upload Template
              </Link>
            </div>
          </div>
        ) : (
          <TemplatesTable templates={templates} />
        )}
      </div>
    </div>
  );
}
