import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

interface AnalyzedVariable {
  name: string;
  type: "text" | "number" | "date" | "boolean" | "list";
  required: boolean;
  description?: string;
}

interface AnalysisResult {
  variables: AnalyzedVariable[];
  sections: {
    name: string;
    content: string;
    variables: string[];
  }[];
}

export async function analyzeTemplate(buffer: Buffer): Promise<AnalysisResult> {
  try {
    // Load the document
    const zip = new PizZip(buffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const text = doc.getFullText();
    const variables = new Map<string, AnalyzedVariable>();
    const sections = [];

    // Regular expression for variables with type hints
    // Example: {{amount:number}} or {{date:date}} or {{name:text}}
    const varRegex = /{{([^{}]+)}}/g;
    let match;

    while ((match = varRegex.exec(text)) !== null) {
      const fullMatch = match[1].trim();
      const [name, type = "text"] = fullMatch.split(":");

      // Infer variable type based on name or type hint
      const inferredType = inferVariableType(name, type);

      variables.set(name, {
        name,
        type: inferredType,
        required: !name.endsWith("?"),
        description: generateVariableDescription(name, inferredType),
      });
    }

    // Identify document sections (paragraphs with their own variables)
    const paragraphs = text.split("\n\n");
    let currentSection = { name: "Main", content: "", variables: [] };

    for (const paragraph of paragraphs) {
      if (paragraph.trim()) {
        const sectionVars = [];
        let sectionMatch;
        while ((sectionMatch = varRegex.exec(paragraph)) !== null) {
          sectionVars.push(sectionMatch[1].trim().split(":")[0]);
        }

        if (sectionVars.length > 0) {
          if (currentSection.variables.length > 0) {
            sections.push({ ...currentSection });
            currentSection = {
              name: inferSectionName(paragraph),
              content: paragraph,
              variables: sectionVars,
            };
          } else {
            currentSection.content = paragraph;
            currentSection.variables = sectionVars;
          }
        }
      }
    }

    sections.push(currentSection);

    return {
      variables: Array.from(variables.values()),
      sections,
    };
  } catch (error) {
    console.error("Template analysis error:", error);
    throw new Error("Failed to analyze template");
  }
}

function inferVariableType(
  name: string,
  hint: string,
): "text" | "number" | "date" | "boolean" | "list" {
  const nameLower = name.toLowerCase();

  if (hint !== "text") {
    return hint as any;
  }

  // Infer type based on common naming patterns
  if (nameLower.includes("date") || nameLower.includes("when")) {
    return "date";
  }
  if (
    nameLower.includes("amount") ||
    nameLower.includes("number") ||
    nameLower.includes("total")
  ) {
    return "number";
  }
  if (
    nameLower.includes("is") ||
    nameLower.includes("has") ||
    nameLower.endsWith("?")
  ) {
    return "boolean";
  }
  if (nameLower.includes("list") || nameLower.endsWith("s")) {
    return "list";
  }

  return "text";
}

function generateVariableDescription(name: string, type: string): string {
  const readableName = name
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()
    .trim();

  const typeDescriptions = {
    date: "Enter a date",
    number: "Enter a numeric value",
    boolean: "Select Yes or No",
    list: "Enter multiple items, separated by commas",
    text: "Enter text",
  };

  return `${readableName.charAt(0).toUpperCase() + readableName.slice(1)} - ${typeDescriptions[type] || "Enter a value"}`;
}

function inferSectionName(content: string): string {
  // Try to find a heading-like line at the start of the section
  const lines = content.split("\n");
  const firstLine = lines[0].trim();

  if (firstLine.toUpperCase() === firstLine) {
    return firstLine;
  }

  return "Section";
}
