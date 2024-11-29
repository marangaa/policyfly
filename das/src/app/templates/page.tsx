import { prisma } from "@/lib/prisma";
import { TemplatesTable } from "./templates-table";
import Link from "next/link";
import { 
  FileText, 
  Upload, 
  PlusCircle,
  FolderUp,
  Settings
} from "lucide-react";

export default async function TemplatesPage() {
  // Fetch templates with error handling
  const templates = await prisma.template.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { documents: true }
      }
    }
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Page Header with Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Document Templates
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl">
              Manage your document templates and generate new documents quickly and efficiently.
            </p>
          </div>
          
          <Link
            href="/templates/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
              bg-blue-600 text-white font-medium shadow-sm
              hover:bg-blue-700 focus:outline-none focus:ring-2 
              focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload Template
          </Link>
        </div>

        {/* Templates Content */}
        {templates.length === 0 ? (
          <div className="relative rounded-xl border border-gray-200 bg-white p-12">
            <div className="text-center max-w-sm mx-auto space-y-6">
              {/* Empty State Icon */}
              <div className="rounded-full bg-blue-50 p-4 w-16 h-16 mx-auto">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              
              {/* Empty State Content */}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  No templates yet
                </h3>
                <p className="text-base text-gray-600">
                  Get started by uploading your first document template. 
                  Templates help you generate consistent documents quickly.
                </p>
              </div>
              
              {/* Call to Action */}
              <div className="flex justify-center">
                <Link
                  href="/templates/upload"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
                    bg-blue-600 text-white font-medium
                    hover:bg-blue-700 focus:outline-none focus:ring-2 
                    focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <PlusCircle className="w-5 h-5" />
                  Create Your First Template
                </Link>
              </div>
            </div>

            {/* Background Pattern */}
            <div className="absolute inset-0 -z-10 overflow-hidden rounded-xl">
              <div className="absolute inset-0 bg-grid-gray-100 [mask-image:radial-gradient(white,transparent_70%)]" />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <TemplatesTable templates={templates} />
          </div>
        )}

        {/* Quick Tips Section */}
        {templates.length > 0 && (
          <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
            <div className="flex gap-3">
              <FolderUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-medium text-blue-900">Quick Tips</h3>
                <p className="text-sm text-blue-800">
                  Use the template manager to organize and update your templates. 
                  You can edit template details, view usage statistics, and manage variables.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}