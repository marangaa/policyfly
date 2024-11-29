"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { 
  Upload, 
  Loader2, 
  CheckCircle2, 
  BracesIcon,
  FileUp,
  Info
} from "lucide-react";

export default function UploadTemplatePage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="space-y-3">
          <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
            <FileUp className="w-8 h-8 text-blue-600" />
            Upload Template
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Upload your Word document template. We&apos;ll automatically detect variables and prepare it for document generation.
          </p>
        </div>

        {/* Upload Guidelines */}
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h2 className="font-medium text-blue-900">Template Requirements</h2>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Only .docx files are supported</li>
                <li>• Use {"{variable_name}"} syntax for template variables</li>
                <li>• Maximum file size: 10MB</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <TemplateUploadForm />
        </div>
      </div>
    </div>
  );
}

// Form Component
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
  const [uploading, setUploading] = useState(false);
  const [extractedVariables, setExtractedVariables] = useState<string[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (!file.name.endsWith(".docx")) {
      toast.error("Please upload a .docx file");
      return;
    }

    setUploading(true);
    setExtractedVariables([]);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "insurance");

      const response = await fetch("/api/templates/upload", {
        method: "POST",
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (!response.ok) {
        const errorMessage = data.details || data.error || "Upload failed";
        throw new Error(errorMessage);
      }

      toast.success("Template uploaded successfully!");
      setExtractedVariables(data.template.variables);
      setUploadSuccess(true);

    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload template"
      );
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="p-8 space-y-6">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-12 transition-all duration-200
          ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
          ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${uploadSuccess ? "border-green-500 bg-green-50" : ""}
        `}
      >
        <input {...getInputProps()} disabled={uploading} />
        <div className="space-y-4 text-center">
          {uploading ? (
            <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
          ) : uploadSuccess ? (
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
          ) : (
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
          )}

          <div>
            {uploading ? (
              <div className="space-y-2">
                <p className="text-lg font-medium text-blue-700">
                  Uploading template...
                </p>
                <p className="text-sm text-blue-600">Please wait while we process your file</p>
              </div>
            ) : uploadSuccess ? (
              <p className="text-lg font-medium text-green-700">
                Template uploaded successfully!
              </p>
            ) : isDragActive ? (
              <p className="text-lg font-medium text-blue-700">
                Drop your template file here...
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700">
                  Drop your template file here, or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Supports .docx files up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Extracted Variables Display */}
      {extractedVariables.length > 0 && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BracesIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Detected Variables
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {extractedVariables.map((variable) => (
                <div
                  key={variable}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg
                    bg-white border border-gray-200 shadow-sm
                    text-gray-800 font-medium text-sm"
                >
                  <span className="text-blue-600 font-mono">{`{`}</span>
                  {variable}
                  <span className="text-blue-600 font-mono">{`}`}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}