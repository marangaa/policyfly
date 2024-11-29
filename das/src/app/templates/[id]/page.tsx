import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TemplateDetailForm } from "./template-detail-form";
import { 
  FileText, 
  Clock, 
  Download, 
  Calendar,
  Settings,
  AlertCircle
} from "lucide-react";

// Helper function to format dates in a consistent way
function formatDate(date: Date | string) {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

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
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Page Header with Template Information */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Template Configuration
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl">
              Configure your template settings and view recently generated documents.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Template Details Card */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            <TemplateDetailForm template={template} />
          </div>

          {/* Recent Documents Section with Enhanced Styling */}
          <div className="border-t border-gray-100 bg-gray-50">
            <div className="p-8">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Recent Documents
                </h2>
              </div>

              {template.documents.length > 0 ? (
                <div className="space-y-4">
                  {template.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <div>
                              <h3 className="text-base font-medium text-gray-900 truncate">
                                {doc.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <p className="text-sm text-gray-600">
                                  Created {formatDate(doc.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4 flex-shrink-0">
                          <a
                            href={`/api/documents/${doc.id}/download`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                              text-sm font-medium text-blue-600 hover:text-blue-800
                              hover:bg-blue-50 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-gray-50 p-3">
                      <AlertCircle className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium text-gray-900">
                        No Documents Yet
                      </h3>
                      <p className="text-sm text-gray-600 max-w-sm">
                        Documents generated using this template will appear here. 
                        Start by creating your first document.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}