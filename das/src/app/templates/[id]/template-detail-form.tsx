"use client";

import { useState } from "react";
import { Template } from "@prisma/client";
import toast from "react-hot-toast";
import { 
  Pencil, 
  Save, 
  X, 
  Tag, 
  FileText, 
  FolderOpen,
  Loader2, 
  BracesIcon,
  AlertTriangle,
  InfoIcon
} from "lucide-react";

interface TemplateDetailFormProps {
  template: Template;
}

export function TemplateDetailForm({ template }: TemplateDetailFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: template.name,
    description: template.description || "",
    category: template.category,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update template");

      toast.success("Template updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update template");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Template Information Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Name Field */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-base font-semibold text-gray-800">
              <FileText className="w-5 h-5 text-blue-600" />
              Template Name
            </label>
            {isEditing ? (
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white 
                    text-gray-900 text-base placeholder-gray-400
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                    shadow-sm transition duration-150"
                  placeholder="Enter template name"
                  required
                />
              </div>
            ) : (
              <div className="px-4 py-3 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-base font-medium text-gray-900">{template.name}</p>
              </div>
            )}
          </div>

          {/* Category Field */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-base font-semibold text-gray-800">
              <FolderOpen className="w-5 h-5 text-blue-600" />
              Category
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white 
                  text-gray-900 text-base placeholder-gray-400
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                  shadow-sm transition duration-150"
                placeholder="Enter category name"
                required
              />
            ) : (
              <div className="px-4 py-3 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-base font-medium text-gray-900">{template.category}</p>
              </div>
            )}
          </div>

          {/* Description Field - Full Width */}
          <div className="space-y-3 lg:col-span-2">
            <label className="flex items-center gap-2 text-base font-semibold text-gray-800">
              <Tag className="w-5 h-5 text-blue-600" />
              Description
            </label>
            {isEditing ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white 
                  text-gray-900 text-base placeholder-gray-400
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                  shadow-sm transition duration-150 resize-none"
                placeholder="Enter template description"
              />
            ) : (
              <div className="px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 min-h-[100px]">
                <p className="text-base text-gray-800">
                  {template.description || 
                    <span className="text-gray-500 italic flex items-center gap-2">
                      <InfoIcon className="w-4 h-4" />
                      No description provided
                    </span>
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Variables Section */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BracesIcon className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Template Variables
                </h3>
              </div>
              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                {(template.variables as string[]).length} variables
              </span>
            </div>

            {(template.variables as string[]).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {(template.variables as string[]).map((variable, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg 
                      bg-white border border-gray-200 shadow-sm
                      text-gray-800 font-medium text-sm"
                  >
                    <span className="text-blue-600 font-mono">{`{`}</span>
                    {variable}
                    <span className="text-blue-600 font-mono">{`}`}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 text-gray-600 bg-white p-4 rounded-lg border border-gray-200">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <p className="text-sm">No variables defined for this template.</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: template.name,
                    description: template.description || "",
                    category: template.category,
                  });
                }}
                className="flex items-center gap-2 px-5 py-2.5 text-base font-medium 
                  text-gray-700 bg-white border border-gray-300 rounded-lg 
                  hover:bg-gray-50 hover:text-gray-900
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 
                  transition duration-150"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 text-base font-medium 
                  text-white bg-blue-600 rounded-lg
                  hover:bg-blue-700 focus:outline-none focus:ring-2 
                  focus:ring-offset-2 focus:ring-blue-500 
                  transition duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-base font-medium 
                text-white bg-blue-600 rounded-lg 
                hover:bg-blue-700 focus:outline-none focus:ring-2 
                focus:ring-offset-2 focus:ring-blue-500 
                transition duration-150"
            >
              <Pencil className="w-5 h-5" />
              Edit Template
            </button>
          )}
        </div>
      </form>
    </div>
  );
}