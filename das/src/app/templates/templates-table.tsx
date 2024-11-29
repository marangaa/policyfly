"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Template } from "@prisma/client";
import { 
  Search, 
  Filter,
  FileText, 
  Plus,
  Trash2,
  Calendar,
  TagIcon,
  BracesIcon,
  ChevronRight,
  AlertCircle,
  MoreHorizontal,
  Settings
} from "lucide-react";
import toast from "react-hot-toast";

interface TemplatesTableProps {
  templates: Template[];
}

export function TemplatesTable({ templates }: TemplatesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Memoized categories
  const categories = useMemo(() => {
    const uniqueCategories = new Set(templates.map(t => t.category));
    return ["all", ...Array.from(uniqueCategories)];
  }, [templates]);

  // Memoized filtered templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch = searchTerm 
        ? template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.description?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      
      const matchesCategory = selectedCategory === "all" || 
        template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchTerm, selectedCategory]);

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template? This action cannot be undone.")) {
      return;
    }

    setDeleteLoading(id);
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete template");
      }
      
      toast.success("Template deleted successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Search and Filter Controls */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search templates by name or description..."
              className="block w-full pl-10 pr-4 py-2.5 text-base rounded-lg
                border border-gray-200 bg-gray-50
                focus:border-blue-500 focus:ring-blue-500 focus:bg-white
                transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="relative min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="block w-full pl-10 pr-10 py-2.5 text-base rounded-lg
                border border-gray-200 bg-gray-50 appearance-none
                focus:border-blue-500 focus:ring-blue-500 focus:bg-white
                transition-colors cursor-pointer"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option key={`category-${category}`} value={category}>
                  {category === 'all' 
                    ? 'All Categories' 
                    : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Templates Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-4 text-left">
                <span className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <Settings className="w-4 h-4" />
                  Template Name
                </span>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <TagIcon className="w-4 h-4" />
                  Category
                </span>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <BracesIcon className="w-4 h-4" />
                  Variables
                </span>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <Calendar className="w-4 h-4" />
                  Created
                </span>
              </th>
              <th className="px-6 py-4 text-right">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredTemplates.map((template) => (
              <tr key={`template-${template.id}`} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <Link
                      href={`/templates/${template.id}`}
                      className="group inline-flex items-center gap-2 text-base font-medium 
                        text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {template.name}
                      <FileText className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    {template.description && (
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {template.description}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg
                    text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {template.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {(template.variables as string[]).slice(0, 3).map((variable, index) => (
                      <span
                        key={`${template.id}-var-${index}`}
                        className="flex items-center px-2.5 py-1 text-sm rounded-lg
                          bg-blue-50 text-blue-700 border border-blue-100"
                      >
                        {variable}
                      </span>
                    ))}
                    {(template.variables as string[]).length > 3 && (
                      <span className="flex items-center gap-1 px-2.5 py-1 text-sm rounded-lg
                        bg-gray-50 text-gray-600 border border-gray-100"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                        {(template.variables as string[]).length - 3} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {new Date(template.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/documents/new?template=${template.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
                        text-emerald-600 hover:text-emerald-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Generate
                    </Link>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      disabled={deleteLoading === template.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
                        text-red-600 hover:text-red-800 transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deleteLoading === template.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="p-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No templates found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedCategory !== 'all'
                ? "Try adjusting your search or filter to find what you're looking for."
                : "Get started by creating your first template."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}