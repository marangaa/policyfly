"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Template } from "@prisma/client";
import toast from "react-hot-toast";
import { 
  Search, 
  Loader2, 
  FileText, 
  User, 
  ChevronDown,
  Mail,
  Phone,
  X,
  Check,
  Clock,
  FileCheck,
  AlertCircle
} from "lucide-react";

interface Client {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
}

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

interface Policy {
  id: string;
  policyNumber: string;
  type: string;
  effectiveDate: string;
  expirationDate: string;
  coverageDetails: {
    description?: string;
    limit?: string;
    deductible?: string;
  };
  status: string;
}

interface ClientDetails {
  client: Client;
  defaultAddress?: Address;
  activePolicy?: Policy & {
    issueDate: string;
  };
  recentDocuments?: Array<{
    id: string;
    name: string;
    createdAt: string;
    templateId: string;
  }>;
  signatureDates: {
    representative: string;
    policyholder: string;
  };
  defaultTerms: string;
}

interface DocumentGenerationFormProps {
  templates: Template[];
  initialTemplate: Template | null;
}

export function DocumentGenerationForm({
  templates,
  initialTemplate,
}: DocumentGenerationFormProps) {
  const router = useRouter();

  // State management with clear initial values
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(initialTemplate);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchDebounceTimeout, setSearchDebounceTimeout] = useState<NodeJS.Timeout>();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Handle template selection with data preservation
  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId) || null;
    setSelectedTemplate(template);
    
    // Preserve existing client data while resetting template-specific fields
    if (selectedClient) {
      autoFillForm(selectedClient);
    } else {
      setFormData({});
    }
    setFormErrors({});
  };

  // Implement debounced search for better performance
  const searchClients = async (query: string) => {
    if (query.length < 2) {
      setClients([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/clients/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setClients(data.clients);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search clients");
      setClients([]);
    } finally {
      setSearching(false);
    }
  };

  // Handle search input with debouncing
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (searchDebounceTimeout) {
      clearTimeout(searchDebounceTimeout);
    }
    const timeout = setTimeout(() => searchClients(value), 300);
    setSearchDebounceTimeout(timeout);
  };

  // Comprehensive form autofill with error handling
  const autoFillForm = async (client: Client) => {
    setSelectedClient(client);
    setSearchQuery(client.fullName);
    setClients([]);

    try {
      const response = await fetch(`/api/clients/${client.id}/details`);
      if (!response.ok) throw new Error("Failed to fetch client details");

      const data: ClientDetails = await response.json();

      // Create a complete mapped data object with all possible fields
      const mappedData: Record<string, string> = {
        full_name: data.client.fullName,
        email_address: data.client.email,
        phone_number: data.client.phoneNumber,
        date_of_birth: data.client.dateOfBirth,
        address: data.defaultAddress?.street || "",
        city_state_zip: data.defaultAddress
          ? `${data.defaultAddress.city}, ${data.defaultAddress.state} ${data.defaultAddress.zipCode}`
          : "",
        policy_number: data.activePolicy?.policyNumber || "",
        policy_type: data.activePolicy?.type || "",
        issue_date: data.activePolicy?.issueDate || "",
        effective_date: data.activePolicy?.effectiveDate || "",
        expiration_date: data.activePolicy?.expirationDate || "",
        coverage_description: data.activePolicy?.coverageDetails?.description || "",
        coverage_limit: data.activePolicy?.coverageDetails?.limit || "",
        deductible_amount: data.activePolicy?.coverageDetails?.deductible || "",
        representative_signature_date: data.signatureDates.representative,
        policyholder_signature_date: data.signatureDates.policyholder,
        terms_and_conditions: data.defaultTerms,
      };

      setFormData(mappedData);
      toast.success("Form auto-filled with client data");
    } catch (error) {
      console.error("Auto-fill error:", error);
      toast.error("Failed to auto-fill form");
      setFormData({});
    }
  };

  // Enhanced form validation and submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    // Validate required fields
    const errors: Record<string, string> = {};
    (selectedTemplate.variables as string[]).forEach((variable) => {
      if (!formData[variable]?.trim()) {
        errors[variable] = "This field is required";
      }
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fill in all required fields");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          clientId: selectedClient?.id,
          variables: formData,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate document");

      const data = await response.json();

      // Handle document download
      const downloadResponse = await fetch(data.downloadUrl);
      const blob = await downloadResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename || "generated-document.docx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Document generated successfully!");
      router.push("/documents");
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate document");
    } finally {
      setIsGenerating(false);
    }
  };

  // Cleanup effect for search debouncing
  useEffect(() => {
    return () => {
      if (searchDebounceTimeout) {
        clearTimeout(searchDebounceTimeout);
      }
    };
  }, [searchDebounceTimeout]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 divide-y divide-gray-100">
        {/* Client Search Section */}
        <div className="p-8">
          <div className="space-y-2">
            <label className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Find Client
            </label>
            <p className="text-sm text-gray-600 leading-relaxed">
              Search for a client by their name, email, or policy number to auto-fill the form.
            </p>
          </div>

          <div className="mt-4 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="pl-11 pr-4 py-3 w-full rounded-lg border-gray-200 bg-gray-50 focus:bg-white
                shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base transition-colors"
              placeholder="Start typing to search..."
            />
            {searching ? (
              <Loader2 className="absolute left-3 top-3.5 h-5 w-5 text-blue-600 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            )}
          </div>

          {/* Enhanced Search Results */}
          {clients.length > 0 && (
            <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => autoFillForm(client)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-blue-50 transition-colors
                    group relative"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {client.fullName}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {client.email}
                        </span>
                        {client.phoneNumber && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {client.phoneNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedClient?.id === client.id ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <FileCheck className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Template Selection */}
        <div className="p-8">
          <div className="space-y-2">
            <label className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Document Template
            </label>
            <p className="text-sm text-gray-600 leading-relaxed">
              Choose a template to generate your document. Each template contains specific variables that need to be filled.
            </p>
          </div>

          <div className="mt-4 relative">
            <select
              className="appearance-none w-full rounded-lg border-gray-200 bg-gray-50 focus:bg-white
                py-3 px-4 pr-10 text-base focus:border-blue-500 focus:ring-blue-500 transition-colors"
              value={selectedTemplate?.id || ""}
              onChange={(e) => handleTemplateChange(e.target.value)}
            >
              <option value="">Select a template...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({(template.variables as string[]).length} fields)
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Variable Input Form */}
        {selectedTemplate && (
          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-2 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Document Information
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Fill in the required information for your document. All fields are mandatory.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {(selectedTemplate.variables as string[]).map((variable) => (
                <div key={variable} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {variable
                      .split("_")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData[variable] || ""}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          [variable]: e.target.value,
                        }));
                        if (formErrors[variable]) {
                          setFormErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors[variable];
                            return newErrors;
                          });
                        }
                      }}
                      className={`block w-full rounded-lg border-gray-200 bg-gray-50 focus:bg-white
                        shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base transition-colors
                        ${formErrors[variable] ? 'border-red-300' : ''}`}
                      required
                      placeholder={`Enter ${variable.split("_").join(" ").toLowerCase()}`}
                    />
                    {formErrors[variable] && (
                      <div className="absolute right-3 top-2.5">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {formErrors[variable] && (
                    <p className="mt-1 text-sm text-red-600">{formErrors[variable]}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Form Actions */}
            <div className="mt-8 flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600">
                {selectedClient && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Generating for: <strong>{selectedClient.fullName}</strong></span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300
                    rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
                    focus:ring-gray-500 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg
                    hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                    focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center gap-2 min-w-[180px] justify-center"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Generate Document</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Processing Indicator */}
            {isGenerating && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
                  <p className="text-sm text-blue-600">
                    Processing your document. This may take a few moments...
                  </p>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}