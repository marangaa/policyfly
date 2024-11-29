import { TemplateUploadForm } from "./template-upload-form";

export default function UploadTemplatePage() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-semibold mb-6">Upload Template</h1>
        <TemplateUploadForm />
      </div>
    </div>
  );
}
