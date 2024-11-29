"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TemplateBuilder, TemplateSection } from "@/lib/templates/builder";
import toast from "react-hot-toast";

interface TemplateCustomizationFormProps {
  baseTemplates: TemplateBuilder[];
}

export function TemplateCustomizationForm({
  baseTemplates,
}: TemplateCustomizationFormProps) {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateBuilder | null>(null);
  const [customizations, setCustomizations] = useState<{
    name: string;
    description: string;
    sections: TemplateSection[];
  }>({
    name: "",
    description: "",
    sections: [],
  });

  const handleTemplateSelect = (templateId: string) => {
    const template = baseTemplates.find((t) => t.id === templateId) || null;
    if (template) {
      setSelectedTemplate(template);
      setCustomizations({
        name: `Custom ${template.name}`,
        description: template.description,
        sections: template.sections,
      });
    }
  };

  const handleSectionUpdate = (sectionId: string, content: string) => {
    setCustomizations((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, content } : section,
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    try {
      const response = await fetch("/api/templates/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: customizations.name,
          description: customizations.description,
          sections: customizations.sections,
          baseTemplate: selectedTemplate.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create template");
      }

      toast.success("Template created successfully!");
      router.push("/templates");
    } catch (error) {
      console.error("Template creation error:", error);
      toast.error("Failed to create template");
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg">
      {/* Template Selection */}
      <div className="p-6 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700">
          Select Base Template
        </label>
        <select
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={selectedTemplate?.id || ""}
          onChange={(e) => handleTemplateSelect(e.target.value)}
        >
          <option value="">Choose a template...</option>
          {baseTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTemplate && (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Template Name
            </label>
            <input
              type="text"
              value={customizations.name}
              onChange={(e) =>
                setCustomizations((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Template Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={customizations.description}
              onChange={(e) =>
                setCustomizations((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Sections */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Template Sections</h3>
            {customizations.sections.map((section) => (
              <div key={section.id} className="border rounded-md p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {section.name}
                  {section.isOptional && (
                    <span className="ml-2 text-sm text-gray-500">
                      (Optional)
                    </span>
                  )}
                </h4>
                <textarea
                  value={section.content}
                  onChange={(e) =>
                    handleSectionUpdate(section.id, e.target.value)
                  }
                  rows={5}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push("/templates")}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Create Template
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
