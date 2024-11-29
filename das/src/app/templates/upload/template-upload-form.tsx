"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { UploadIcon, Loader2 } from "lucide-react";

// Define TypeScript interfaces for better type safety
interface UploadResponse {
  message: string;
  template: {
    id: string;
    name: string;
    variables: string[];
  };
  error?: string;
  details?: string;
}

export function TemplateUploadForm() {
  // Add state for tracking upload progress and extracted variables
  const [uploading, setUploading] = useState(false);
  const [extractedVariables, setExtractedVariables] = useState<string[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (!file.name.endsWith(".docx")) {
      toast.error("Please upload a .docx file");
      return;
    }

    setUploading(true);
    setExtractedVariables([]);

    try {
      // Create FormData and append file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "insurance"); // You can make this dynamic if needed

      // Upload template with improved error handling
      const response = await fetch("/api/templates/upload", {
        method: "POST",
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (!response.ok) {
        // Handle specific error messages from the server
        const errorMessage = data.details || data.error || "Upload failed";
        throw new Error(errorMessage);
      }

      // Show success message and store extracted variables
      toast.success("Template uploaded successfully!");
      setExtractedVariables(data.template.variables);

      // You could emit an event or call a callback here to notify parent components
      // onUploadSuccess?.(data.template)
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload template",
      );
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 transition-all duration-200
          ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
          ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <input {...getInputProps()} disabled={uploading} />
        <div className="space-y-4 text-center">
          {uploading ? (
            <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
          ) : (
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
          )}

          <div className="text-gray-600">
            {uploading ? (
              <p>Uploading template...</p>
            ) : isDragActive ? (
              <p className="text-blue-500 font-medium">
                Drop the template file here...
              </p>
            ) : (
              <div>
                <p className="font-medium">
                  Drag and drop a template file here, or click to select
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Only .docx files are accepted
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Show extracted variables after successful upload */}
      {extractedVariables.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Template Variables Found:
          </h3>
          <div className="flex flex-wrap gap-2">
            {extractedVariables.map((variable) => (
              <span
                key={variable}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full 
                          text-xs font-medium bg-blue-100 text-blue-800"
              >
                {variable}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
