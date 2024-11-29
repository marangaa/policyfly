"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { 
  Download, 
  RefreshCw, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  Calendar,
  X,
  LayoutTemplate
} from "lucide-react";

interface DocumentWithTemplate {
  id: string;
  name: string;
  createdAt: Date;
  data: Record<string, string | number | boolean>;
  template: {
    name: string;
    id: string;
  };
}

interface DocumentsTableProps {
  documents: DocumentWithTemplate[];
  totalPages: number;
  currentPage: number;
}

export function DocumentsTable({
  documents,
  totalPages,
  currentPage,
}: DocumentsTableProps) {
  const router = useRouter();
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithTemplate | null>(null);

  const handleRegenerate = async (document: DocumentWithTemplate) => {
    setRegeneratingId(document.id);
    try {
      router.push(`/documents/new?template=${document.template.id}&prefill=${document.id}`);
    } catch (error) {
      console.error("Regeneration error:", error);
      toast.error("Failed to regenerate document");
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    setDeletingId(documentId);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete document");

      toast.success("Document deleted successfully");
      router.refresh();
    } catch (error) {
      console.error("Deletion error:", error);
      toast.error("Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    router.push(`/documents?page=${newPage}`);
  };

  return (
    <div className="bg-white shadow-lg rounded-xl border border-gray-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-4 text-left">
                <span className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <FileText className="w-4 h-4" />
                  Document Name
                </span>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <LayoutTemplate className="w-4 h-4" />
                  Template
                </span>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <Calendar className="w-4 h-4" />
                  Created
                </span>
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {documents.map((document) => (
              <tr key={document.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <button
                    onClick={() => setSelectedDocument(document)}
                    className="text-base font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {document.name}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{document.template.name}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {new Date(document.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-4">
                    <a
                      href={`/api/documents/${document.id}/download`}
                      className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                      download
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </a>
                    <button
                      onClick={() => handleRegenerate(document)}
                      disabled={regeneratingId === document.id}
                      className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-800 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${regeneratingId === document.id ? 'animate-spin' : ''}`} />
                      <span>{regeneratingId === document.id ? "Regenerating..." : "Regenerate"}</span>
                    </button>
                    <button
                      onClick={() => handleDelete(document.id)}
                      disabled={deletingId === document.id}
                      className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{deletingId === document.id ? "Deleting..." : "Delete"}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing page <span className="font-semibold">{currentPage}</span> of{" "}
              <span className="font-semibold">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDocument && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 backdrop-blur-sm">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Document Preview
                  </h3>
                  <button
                    onClick={() => setSelectedDocument(null)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="mt-4">
                  <iframe
                    src={`/api/documents/${selectedDocument.id}/preview`}
                    className="w-full h-[32rem] border border-gray-200 rounded-lg"
                  />
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    onClick={() => setSelectedDocument(null)}
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}