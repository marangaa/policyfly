'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Template } from '@prisma/client'
import toast from 'react-hot-toast'

interface DocumentGenerationFormProps {
  templates: Template[]
  initialTemplate: Template | null
}

export function DocumentGenerationForm({
  templates,
  initialTemplate
}: DocumentGenerationFormProps) {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(initialTemplate)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId) || null
    setSelectedTemplate(template)
    setFormData({})
    setPreviewUrl(null)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTemplate) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          variables: formData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate document')
      }

      const data = await response.json()
      setPreviewUrl(data.previewUrl)
      toast.success('Document generated successfully!')
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate document')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="bg-white shadow-sm rounded-lg">
      {/* Template Selection */}
      <div className="p-6 border-b border-gray-200">
        <label 
          htmlFor="template" 
          className="block text-sm font-medium text-gray-700"
        >
          Select Template
        </label>
        <select
          id="template"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={selectedTemplate?.id || ''}
          onChange={(e) => handleTemplateChange(e.target.value)}
        >
          <option value="">Choose a template...</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      {/* Dynamic Form Fields */}
      {selectedTemplate && (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {(selectedTemplate.variables as string[]).map((variable) => (
            <div key={variable}>
              <label
                htmlFor={variable}
                className="block text-sm font-medium text-gray-700"
              >
                {variable.charAt(0).toUpperCase() + variable.slice(1)}
              </label>
              <input
                type="text"
                id={variable}
                name={variable}
                value={formData[variable] || ''}
                onChange={(e) => 
                  setFormData({ ...formData, [variable]: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          ))}

          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/templates')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 
                ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isGenerating ? 'Generating...' : 'Generate Document'}
            </button>
          </div>
        </form>
      )}

      {/* Document Preview */}
      {previewUrl && (
        <div className="p-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Document Preview
          </h3>
          <div className="aspect-[8.5/11] w-full border border-gray-200 rounded-lg overflow-hidden">
            <iframe
              src={previewUrl}
              className="w-full h-full"
              title="Document preview"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <a
              href={previewUrl}
              download
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Download Document
            </a>
          </div>
        </div>
      )}
    </div>
  )
}