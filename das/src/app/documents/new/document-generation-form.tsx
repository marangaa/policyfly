"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Template } from "@prisma/client";
import toast from "react-hot-toast";
import { Search, Loader2 } from "lucide-react";

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


interface DocumentGenerationFormProps {
  templates: Template[];
  initialTemplate: Template | null;
}

export function DocumentGenerationForm({
  templates,
  initialTemplate,
}: DocumentGenerationFormProps) {
  const router = useRouter();

  // State management
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    initialTemplate,
  );
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchDebounceTimeout, setSearchDebounceTimeout] =
    useState<NodeJS.Timeout>();

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId) || null;
    setSelectedTemplate(template);
    // Preserve client data but reset any template-specific fields
    if (selectedClient) {
      autoFillForm(selectedClient);
    } else {
      setFormData({});
    }
  };

  // Debounced search function
  const searchClients = async (query: string) => {
    if (query.length < 2) {
      setClients([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `/api/clients/search?q=${encodeURIComponent(query)}`,
      );
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

  // Handle search input changes with debounce
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (searchDebounceTimeout) {
      clearTimeout(searchDebounceTimeout);
    }
    const timeout = setTimeout(() => searchClients(value), 300);
    setSearchDebounceTimeout(timeout);
  };

  // Update the ClientDetails interface first to match our enhanced API response
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

  // Updated autoFillForm function
  const autoFillForm = async (client: Client) => {
    setSelectedClient(client);
    setSearchQuery(client.fullName);
    setClients([]); // Clear search results

    try {
      const response = await fetch(`/api/clients/${client.id}/details`);
      if (!response.ok) throw new Error("Failed to fetch client details");

      const data: ClientDetails = await response.json();

      // Create a complete mapped data object with all possible fields
      const mappedData: Record<string, string> = {
        // Personal Information
        full_name: data.client.fullName,
        email_address: data.client.email,
        phone_number: data.client.phoneNumber,
        date_of_birth: data.client.dateOfBirth,

        // Address Information - Always include these fields even if empty
        address: data.defaultAddress?.street || "",
        city_state_zip: data.defaultAddress
          ? `${data.defaultAddress.city}, ${data.defaultAddress.state} ${data.defaultAddress.zipCode}`
          : "",

        // Policy Information
        policy_number: data.activePolicy?.policyNumber || "",
        policy_type: data.activePolicy?.type || "",
        issue_date: data.activePolicy?.issueDate || "",
        effective_date: data.activePolicy?.effectiveDate || "",
        expiration_date: data.activePolicy?.expirationDate || "",

        // Coverage Details
        coverage_description:
          data.activePolicy?.coverageDetails?.description || "",
        coverage_limit: data.activePolicy?.coverageDetails?.limit || "",
        deductible_amount: data.activePolicy?.coverageDetails?.deductible || "",

        // Signature Dates - Use provided dates or today
        representative_signature_date: data.signatureDates.representative,
        policyholder_signature_date: data.signatureDates.policyholder,

        // Terms and Conditions
        terms_and_conditions: data.defaultTerms,
      };

      setFormData(mappedData);
      toast.success("Form auto-filled with client data");
    } catch (error) {
      console.error("Auto-fill error:", error);
      toast.error("Failed to auto-fill form");
      // Initialize with empty data on error
      setFormData({});
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/documents/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          clientId: selectedClient?.id,
          variables: formData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate document");
      }

      const data = await response.json();

      // Download the generated document
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

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (searchDebounceTimeout) {
        clearTimeout(searchDebounceTimeout);
      }
    };
  }, [searchDebounceTimeout]);

  return (
    <div className="bg-white shadow-sm rounded-lg divide-y divide-gray-200">
      {/* Client Search Section */}
      <div className="p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Client
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Search by name, email, or policy number..."
          />
          {searching ? (
            <Loader2 className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          )}
        </div>

        {/* Search Results */}
        {clients.length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-gray-200">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => autoFillForm(client)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50"
              >
                <div className="font-medium">{client.fullName}</div>
                <div className="text-sm text-gray-500">{client.email}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Template Selection */}
      <div className="p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Template
        </label>
        <select
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={selectedTemplate?.id || ""}
          onChange={(e) => handleTemplateChange(e.target.value)}
        >
          <option value="">Choose a template...</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} ({(template.variables as string[]).length}{" "}
              variables)
            </option>
          ))}
        </select>
      </div>

      {/* Variable Input Form */}
      {selectedTemplate && (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {(selectedTemplate.variables as string[]).map((variable) => (
              <div key={variable}>
                <label className="block text-sm font-medium text-gray-700">
                  {variable
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </label>
                <input
                  type="text"
                  value={formData[variable] || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [variable]: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  placeholder={`Enter ${variable.split("_").join(" ")}`}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 
                ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isGenerating ? (
                <span className="flex items-center">
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Generating...
                </span>
              ) : (
                "Generate Document"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
