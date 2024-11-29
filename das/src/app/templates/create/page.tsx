import { insuranceTemplates } from "@/lib/templates/builder";
import { TemplateCustomizationForm } from "./template-customization-form";

export default function CreateTemplatePage() {
  const templates = Object.entries(insuranceTemplates).map(
    ([key, builder]) => ({
      id: key,
      ...builder(),
    }),
  );

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0">
        <h2 className="text-2xl font-bold mb-6">Create New Template</h2>
        <TemplateCustomizationForm baseTemplates={templates} />
      </div>
    </div>
  );
}
