import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TemplateDetailForm } from "./template-detail-form";

export default async function TemplatePage({
  params: { id },
}: {
  params: { id: string };
}) {
  const template = await prisma.template.findUnique({
    where: { id },
    include: {
      documents: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
    },
  });

  if (!template) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl font-semibold mb-6">Template Details</h1>

        <div className="bg-white shadow rounded-lg">
          <TemplateDetailForm template={template} />

          {/* Recent Documents Section */}
          <div className="px-6 py-4 border-t border-gray-200">
            <h3 className="text-lg font-medium">Recent Documents</h3>
            {template.documents.length > 0 ? (
              <ul className="mt-4 divide-y divide-gray-200">
                {template.documents.map((doc) => (
                  <li key={doc.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {doc.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Created {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <a
                        href={`/api/documents/${doc.id}/download`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Download
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-gray-500">
                No documents have been generated with this template yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
