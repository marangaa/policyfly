"use client";

import { useState } from "react";
import Link from "next/link";
import { Template } from "@prisma/client";

interface TemplatesTableProps {
  templates: Template[];
}

export function TemplatesTable({ templates }: TemplatesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Get unique categories for filter dropdown
  const categories = ["all", ...new Set(templates.map((t) => t.category))];

  // Filter templates based on search and category
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  async function handleDeleteTemplate(id: string): Promise<void> {
    if (confirm("Are you sure you want to delete this template?")) {
      try {
        const response = await fetch(`/api/templates/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete the template");
        }
        // Optionally, you can update the state to remove the deleted template from the list
        // setTemplates(prevTemplates => prevTemplates.filter(template => template.id !== id));
        alert("Template deleted successfully");
        // Optionally, you can refresh the page or navigate to another page
        // window.location.reload();
      } catch (error) {
        console.error("Error deleting template:", error);
        alert("An error occurred while deleting the template");
      }
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Search and Filter Controls */}
      <div className="p-4 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-1 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search templates..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <select
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Template Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Variables
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTemplates.map((template) => (
              <tr key={template.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/templates/${template.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {template.name}
                  </Link>
                  {template.description && (
                    <p className="text-sm text-gray-500">
                      {template.description}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {template.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {(template.variables as string[])
                      .slice(0, 3)
                      .map((variable, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs rounded-md bg-gray-100"
                        >
                          {variable}
                        </span>
                      ))}
                    {(template.variables as string[]).length > 3 && (
                      <span className="px-2 py-1 text-xs rounded-md bg-gray-100">
                        +{(template.variables as string[]).length - 3} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(template.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <Link
                      href={`/documents/new?template=${template.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Generate
                    </Link>
                    <Link
                      href={`/templates/${template.id}/edit`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
