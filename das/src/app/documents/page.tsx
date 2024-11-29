import { prisma } from "@/lib/prisma";
import { DocumentsTable } from "./documents-table";
import Link from "next/link";
import { Plus, FileText } from "lucide-react"; // Import icons for enhanced visual elements

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { page?: string; templateId?: string };
}) {
  const page = Number(searchParams.page) || 1;
  const pageSize = 10;

  const baseQuery = {
    where: searchParams.templateId ? { templateId: searchParams.templateId } : {},
    include: {
      template: {
        select: {
          name: true,
          id: true,
        },
      },
    },
    orderBy: { createdAt: "desc" as const },
  };

  const [documents, totalCount] = await Promise.all([
    prisma.document.findMany({
      ...baseQuery,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.document.count({
      where: baseQuery.where,
      orderBy: baseQuery.orderBy,
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Generated Documents
            </h1>
            <p className="mt-3 text-lg leading-relaxed text-gray-600 max-w-3xl">
              A list of all documents generated from your templates. You can
              preview, download, or regenerate any document.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 flex-shrink-0">
            <Link
              href="/documents/new"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="w-5 h-5" />
              Generate New Document
            </Link>
          </div>
        </div>

        <div className="mt-8">
          {documents.length === 0 ? (
            <div className="relative text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-blue-50 p-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    No documents yet
                  </h3>
                  <p className="text-base text-gray-600 max-w-sm mx-auto">
                    Get started by generating your first document using our template system.
                  </p>
                </div>
                <div className="mt-6">
                  <Link
                    href="/documents/new"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Plus className="w-5 h-5" />
                    Generate New Document
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <DocumentsTable
                documents={documents.map((doc) => ({
                  ...doc,
                  data: doc.data as Record<string, any>,
                }))}
                totalPages={Math.ceil(totalCount / pageSize)}
                currentPage={page}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}