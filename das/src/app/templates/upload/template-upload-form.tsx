'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'

export function TemplateUploadForm() {
  const [uploading, setUploading] = useState(false)
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    const file = acceptedFiles[0]
    if (!file.name.endsWith('.docx')) {
      toast.error('Please upload a .docx file')
      return
    }

    setUploading(true)
    try {
      // Create FormData and append file
      const formData = new FormData()
      formData.append('file', file)

      // Upload template
      const response = await fetch('/api/templates/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      await response.json()
      toast.success('Template uploaded successfully!')
      
      // Here we could redirect to template details page
      // or show extracted variables
      
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload template')
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  })

  return (
    <div className="mt-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} disabled={uploading} />
        <div className="space-y-2">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 48 48"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 14v20c0 4.418 3.582 8 8 8h16c4.418 0 8-3.582 8-8V14m-20 6l8-8 8 8m-8-8v28"
            />
          </svg>
          <div className="text-gray-600">
            {isDragActive ? (
              <p>Drop the template file here...</p>
            ) : (
              <p>
                Drag and drop a template file here, or click to select
                <br />
                <span className="text-sm text-gray-500">
                  (Only .docx files are accepted)
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}