'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Template } from '@prisma/client';
import toast from 'react-hot-toast';
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
} from 'lucide-react';

// Type definitions
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
    vehicleInfo?: {
      make: string;
      model: string;
      year: number;
      vin: string;
    };
    propertyInfo?: {
      constructionYear: number;
      squareFeet: number;
      constructionType: string;
    };
    termLength?: string;
  };
  status: string;
  premiumDetails?: {
    annualPremium: number;
    paymentFrequency: string;
  };
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

// Policy type-specific form fields
const POLICY_TYPE_FIELDS = {
  auto: [
    { key: 'policy_number', label: 'Policy Number', type: 'text' },
    { key: 'issue_date', label: 'Issue Date', type: 'date' },
    { key: 'effective_date', label: 'Effective Date', type: 'date' },
    { key: 'expiration_date', label: 'Expiration Date', type: 'date' },
    { key: 'status', label: 'Policy Status', type: 'select', 
      options: ['active', 'pending', 'expired'] },
    { key: 'premiumDetails.annualPremium', label: 'Annual Premium', type: 'number' },
    { key: 'premiumDetails.paymentFrequency', label: 'Payment Frequency', type: 'select',
      options: ['monthly', 'quarterly', 'semi-annual', 'annual'] },
    { key: 'coverageDetails.vehicleInfo.make', label: 'Vehicle Make', type: 'text' },
    { key: 'coverageDetails.vehicleInfo.model', label: 'Vehicle Model', type: 'text' },
    { key: 'coverageDetails.vehicleInfo.year', label: 'Vehicle Year', type: 'number' },
    { key: 'coverageDetails.vehicleInfo.vin', label: 'Vehicle VIN', type: 'text' },
    { key: 'coverage_limit', label: 'Coverage Limit', type: 'currency' },
    { key: 'deductible_amount', label: 'Deductible Amount', type: 'currency' }
  ],
  home: [
    { key: 'policy_number', label: 'Policy Number', type: 'text' },
    { key: 'issue_date', label: 'Issue Date', type: 'date' },
    { key: 'effective_date', label: 'Effective Date', type: 'date' },
    { key: 'expiration_date', label: 'Expiration Date', type: 'date' },
    { key: 'status', label: 'Policy Status', type: 'select',
      options: ['active', 'pending', 'expired'] },
    { key: 'premiumDetails.annualPremium', label: 'Annual Premium', type: 'number' },
    { key: 'premiumDetails.paymentFrequency', label: 'Payment Frequency', type: 'select',
      options: ['monthly', 'quarterly', 'semi-annual', 'annual'] },
    { key: 'coverageDetails.propertyInfo.constructionYear', label: 'Construction Year', type: 'number' },
    { key: 'coverageDetails.propertyInfo.squareFeet', label: 'Square Feet', type: 'number' },
    { key: 'coverageDetails.propertyInfo.constructionType', label: 'Construction Type', type: 'select',
      options: ['Wood Frame', 'Masonry', 'Steel Frame', 'Concrete'] },
    { key: 'coverage_limit', label: 'Dwelling Coverage', type: 'currency' },
    { key: 'coverageDetails.personalPropertyLimit', label: 'Personal Property Coverage', type: 'currency' }
  ],
  life: [
    { key: 'policy_number', label: 'Policy Number', type: 'text' },
    { key: 'issue_date', label: 'Issue Date', type: 'date' },
    { key: 'effective_date', label: 'Effective Date', type: 'date' },
    { key: 'expiration_date', label: 'Expiration Date', type: 'date' },
    { key: 'status', label: 'Policy Status', type: 'select',
      options: ['active', 'pending', 'expired'] },
    { key: 'premiumDetails.annualPremium', label: 'Annual Premium', type: 'number' },
    { key: 'premiumDetails.paymentFrequency', label: 'Payment Frequency', type: 'select',
      options: ['monthly', 'quarterly', 'semi-annual', 'annual'] },
    { key: 'coverage_limit', label: 'Death Benefit Amount', type: 'currency' },
    { key: 'coverage_description', label: 'Coverage Type', type: 'select',
      options: ['Term Life - 20 Years', 'Whole Life', 'Universal Life'] },
    { key: 'coverageDetails.termLength', label: 'Term Length', type: 'select',
      options: ['10 Years', '20 Years', '30 Years'] }
  ]
};

const COMMON_FIELDS = [
  { key: 'full_name', label: 'Full Name', type: 'text' },
  { key: 'address', label: 'Address', type: 'text' },
  { key: 'city_state_zip', label: 'City, State, ZIP', type: 'text' },
  { key: 'phone_number', label: 'Phone Number', type: 'tel' },
  { key: 'email_address', label: 'Email Address', type: 'email' },
  { key: 'date_of_birth', label: 'Date of Birth', type: 'date' }
];

export function DocumentGenerationForm({
  templates,
  initialTemplate
}: DocumentGenerationFormProps) {
  const router = useRouter();

  // State management
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(initialTemplate);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedPolicyType, setSelectedPolicyType] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchDebounceTimeout, setSearchDebounceTimeout] = useState<NodeJS.Timeout>();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [availablePolicyTypes, setAvailablePolicyTypes] = useState<string[]>([]);

  // Get fields based on policy type
  const getFieldsForPolicyType = () => {
    const policyFields = selectedPolicyType ? POLICY_TYPE_FIELDS[selectedPolicyType as keyof typeof POLICY_TYPE_FIELDS] : [];
    return [...COMMON_FIELDS, ...policyFields];
  };

  // Format currency input
  const formatCurrency = (value: string) => {
    const num = value.replace(/[^\d.]/g, '');
    return num ? `$${Number(num).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}` : '';
  };

  // Handle template selection
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

  // Handle policy type selection
  const handlePolicyTypeChange = (type: string) => {
    setSelectedPolicyType(type);
    setFormData(prev => {
      const newData = { ...prev };
      // Clear previous policy-specific fields
      Object.keys(newData).forEach(key => {
        if (!COMMON_FIELDS.find(field => field.key === key)) {
          delete newData[key];
        }
      });
      return newData;
    });
  };

  // Handle form field changes
  const handleFieldChange = (key: string, value: string, type: string) => {
    let processedValue = value;
    if (type === 'currency') {
      processedValue = formatCurrency(value);
    }
    setFormData(prev => ({
      ...prev,
      [key]: processedValue
    }));
    
    if (formErrors[key]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  // Implement debounced search
  const searchClients = async (query: string) => {
    if (query.length < 2) {
      setClients([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/clients/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setClients(data.clients);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search clients');
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

  // Auto-fill form with client data
  const autoFillForm = async (client: Client) => {
    setSelectedClient(client);
    setSearchQuery(client.fullName);
    setClients([]);

    try {
      const response = await fetch(`/api/clients/${client.id}/details`);
      if (!response.ok) throw new Error('Failed to fetch client details');

      const data: ClientDetails = await response.json();
      
      // Ensure all date fields are properly formatted
      const formatDateStr = (dateStr: string | null | undefined) => 
        dateStr ? new Date(dateStr).toISOString().split('T')[0] : '';

      // Extract coverage details based on policy type
      const coverageDetails = data.activePolicy?.coverageDetails || {};
      const policyType = data.activePolicy?.type?.toLowerCase() || '';

      // Create mapped data with proper type checking
      const mappedData: Record<string, string> = {
        full_name: data.client.fullName || '',
        email_address: data.client.email || '',
        phone_number: data.client.phoneNumber || '',
        date_of_birth: formatDateStr(data.client.dateOfBirth),
        address: data.defaultAddress?.street || '',
        city_state_zip: data.defaultAddress
          ? `${data.defaultAddress.city}, ${data.defaultAddress.state} ${data.defaultAddress.zipCode}`
          : '',
        policy_number: data.activePolicy?.policyNumber || '',
        policy_type: policyType,
        issue_date: formatDateStr(data.activePolicy?.issueDate),
        effective_date: formatDateStr(data.activePolicy?.effectiveDate),
        expiration_date: formatDateStr(data.activePolicy?.expirationDate),
        
        // Handle specific policy type fields
        ...(policyType === 'auto' && {
          'coverageDetails.vehicleInfo.make': coverageDetails.vehicleInfo?.make || '',
          'coverageDetails.vehicleInfo.model': coverageDetails.vehicleInfo?.model || '',
          'coverageDetails.vehicleInfo.year': coverageDetails.vehicleInfo?.year?.toString() || '',
          'coverageDetails.vehicleInfo.vin': coverageDetails.vehicleInfo?.vin || '',
        }),
        
        ...(policyType === 'home' && {
          'coverageDetails.propertyInfo.constructionYear': coverageDetails.propertyInfo?.constructionYear?.toString() || '',
          'coverageDetails.propertyInfo.squareFeet': coverageDetails.propertyInfo?.squareFeet?.toString() || '',
          'coverageDetails.propertyInfo.constructionType': coverageDetails.propertyInfo?.constructionType || '',
        }),

        coverage_limit: coverageDetails.limit || '',
        deductible_amount: coverageDetails.deductible || '',
      };

      setFormData(mappedData);
      setSelectedPolicyType(policyType);
      toast.success('Form auto-filled with client data');
      const policyTypes = [...new Set(data.activePolicy ? [data.activePolicy.type.toLowerCase()] : [])];
      setAvailablePolicyTypes(policyTypes);

      // If there's only one policy type, auto-select it
      if (policyTypes.length === 1) {
        setSelectedPolicyType(policyTypes[0]);
      }
    } catch (error) {
      console.error('Auto-fill error:', error);
      toast.error('Failed to auto-fill form');
      setFormData({});
      setAvailablePolicyTypes([]);
    }
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    // Validate required fields
    const errors: Record<string, string> = {};
    const requiredFields = getFieldsForPolicyType();
    requiredFields.forEach((field) => {
      if (!formData[field.key]?.trim()) {
        errors[field.key] = 'This field is required';
      }
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          clientId: selectedClient?.id,
          variables: formData,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate document');

      const data = await response.json();

      // Handle document download
      const downloadResponse = await fetch(data.downloadUrl);
      const blob = await downloadResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename || 'generated-document.docx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Document generated successfully!');
      router.push('/documents');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate document');
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

  const renderPolicyTypeSelection = () => {
    // If no client is selected, show all policy types
    const policyTypes = selectedClient 
      ? availablePolicyTypes
      : ['auto', 'home', 'life'];

    if (policyTypes.length === 0) {
      return (
        <div className="p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-700">
            No active policies found for this client. Please select a different client or create a new policy.
          </p>
        </div>
      );
    }

    return (
      <select
        className="appearance-none w-full rounded-lg border-gray-200 bg-gray-50 focus:bg-white
          py-3 px-4 pr-10 text-base focus:border-blue-500 focus:ring-blue-500 transition-colors"
        value={selectedPolicyType}
        onChange={(e) => handlePolicyTypeChange(e.target.value)}
      >
        <option value="">Select policy type...</option>
        {policyTypes.map((type) => (
          <option key={type} value={type}>
            {type.charAt(0).toUpperCase() + type.slice(1)} Insurance
          </option>
        ))}
      </select>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-lg rounded-xl border border-gray-200 divide-y divide-gray-200">
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
              className="pl-11 pr-4 py-3 w-full rounded-lg border border-gray-300 bg-white 
                shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base text-gray-900
                placeholder:text-gray-500 transition-colors"
              placeholder="Start typing to search..."
            />
            {searching ? (
              <Loader2 className="absolute left-3 top-3.5 h-5 w-5 text-blue-600 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            )}
          </div>

          {/* Search Results */}
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

        {/* Template and Policy Type Selection */}
        <div className="p-8">
          <div className="space-y-6">
            <div>
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
                  className="appearance-none w-full rounded-lg border border-gray-300 bg-white
                    py-3 px-4 pr-10 text-base text-gray-900 focus:border-blue-500 focus:ring-blue-500 
                    transition-colors"
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                >
                  <option value="">Select a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="space-y-2">
                <label className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Policy Type
                </label>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Select the type of policy you&apos;re creating documentation for.
                </p>
              </div>

              <div className="mt-4 relative">
                {renderPolicyTypeSelection()}
                <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Form Fields */}
        {selectedTemplate && selectedPolicyType && (
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
              {getFieldsForPolicyType().map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <div className="relative">
                    {field.type === 'select' ? (
                      <select
                        value={formData[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value, field.type)}
                        className={`block w-full rounded-lg border border-gray-300 bg-white
                          shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base text-gray-900
                          transition-colors ${formErrors[field.key] ? 'border-red-300 bg-red-50' : ''}`}
                        required
                      >
                        <option value="">Select {field.label.toLowerCase()}...</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value, field.type)}
                        className={`block w-full rounded-lg border border-gray-300 bg-white
                          shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base text-gray-900
                          transition-colors ${formErrors[field.key] ? 'border-red-300 bg-red-50' : ''}`}
                        required
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    )}
                    {formErrors[field.key] && (
                      <div className="absolute right-3 top-2.5">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {formErrors[field.key] && (
                    <p className="mt-1 text-sm text-red-600">{formErrors[field.key]}</p>
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