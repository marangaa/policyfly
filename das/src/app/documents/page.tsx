// app/documents/page.tsx
import { prisma } from "@/lib/prisma";
import { DocumentsTable } from "./documents-table";
import Link from "next/link";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { page?: string; templateId?: string };
}) {
  const page = Number(searchParams.page) || 1;
  const pageSize = 10;

  // Create the database query
  const baseQuery = {
    where: searchParams.templateId
      ? { templateId: searchParams.templateId }
      : {},
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

  // Execute queries in parallel for better performance
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
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">
              Generated Documents
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all documents generated from your templates. You can
              preview, download, or regenerate any document.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              href="/documents/new"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              Generate New Document
            </Link>
          </div>
        </div>

        <div className="mt-8">
          {documents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No documents
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by generating your first document.
              </p>
              <div className="mt-6">
                <Link
                  href="/documents/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Generate New Document
                </Link>
              </div>
            </div>
          ) : (
            <DocumentsTable
              documents={documents.map((doc) => ({
                ...doc,
                data: doc.data as Record<string, any>,
              }))}
              totalPages={Math.ceil(totalCount / pageSize)}
              currentPage={page}
            />
          )}
        </div>
      </div>
    </div>
  );
}
