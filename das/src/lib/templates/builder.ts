import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export interface TemplateSection {
  id: string;
  name: string;
  content: string;
  isOptional?: boolean;
}

export interface TemplateBuilder {
  name: string;
  description: string;
  category: string;
  sections: TemplateSection[];
  variables: Set<string>;
}

export function createTemplateBuilder(name: string): TemplateBuilder {
  return {
    name,
    description: "",
    category: "general",
    sections: [],
    variables: new Set(),
  };
}

export function addSection(
  builder: TemplateBuilder,
  section: Omit<TemplateSection, "id">,
): TemplateBuilder {
  const id = `section-${builder.sections.length + 1}`;
  builder.sections.push({ ...section, id });

  // Extract variables from the section content
  const variableRegex = /{{([^{}]+)}}/g;
  let match;
  while ((match = variableRegex.exec(section.content)) !== null) {
    builder.variables.add(match[1].trim());
  }

  return builder;
}

export const insuranceTemplates = {
  policyAgreement: () => {
    const builder = createTemplateBuilder("Insurance Policy Agreement");
    builder.description = "Standard insurance policy agreement template";
    builder.category = "insurance";

    addSection(builder, {
      name: "Header",
      content: `
INSURANCE POLICY AGREEMENT

Policy Number: {{policyNumber}}
Date: {{issueDate}}

BETWEEN:
{{insurerName}} (hereinafter referred to as "the Insurer")
AND
{{policyholderName}} (hereinafter referred to as "the Policyholder")
`,
    });

    addSection(builder, {
      name: "Coverage Details",
      content: `
COVERAGE DETAILS

Type of Coverage: {{coverageType}}
Coverage Amount: {{coverageAmount}}
Deductible: {{deductibleAmount}}
Premium: {{premiumAmount}}
Coverage Period: From {{startDate}} to {{endDate}}
`,
    });

    addSection(builder, {
      name: "Optional Riders",
      content: `
ADDITIONAL COVERAGE RIDERS
{{#if hasRiders}}
The following additional coverage riders are included in this policy:
{{ridersList}}
{{/if}}
`,
      isOptional: true,
    });

    return builder;
  },

  claimForm: () => {
    const builder = createTemplateBuilder("Insurance Claim Form");
    builder.description = "Standard insurance claim form template";
    builder.category = "insurance";

    addSection(builder, {
      name: "Claimant Information",
      content: `
INSURANCE CLAIM FORM

Claim Number: {{claimNumber}}
Date of Submission: {{submissionDate}}

CLAIMANT INFORMATION
Name: {{claimantName}}
Policy Number: {{policyNumber}}
Contact Number: {{contactNumber}}
Email: {{emailAddress}}
`,
    });

    addSection(builder, {
      name: "Incident Details",
      content: `
INCIDENT DETAILS

Date of Incident: {{incidentDate}}
Location: {{incidentLocation}}
Description of Incident:
{{incidentDescription}}

Estimated Loss Amount: {{estimatedLossAmount}}
`,
    });

    return builder;
  },
};

export async function generateTemplate(
  builder: TemplateBuilder,
  baseTemplate: Buffer,
): Promise<Buffer> {
  const zip = new PizZip(baseTemplate);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  // Combine all sections into one document
  const content = builder.sections
    .map((section) => section.content)
    .join("\n\n");

  doc.setData({ content });
  doc.render();

  return doc.getZip().generate({ type: "nodebuffer" });
}
