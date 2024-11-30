import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import expressions from 'angular-expressions'
import { promises as fs } from 'fs'
import path from 'path'

// Helper function to configure angular-parser for conditions
function angularParser(tag: string) {
  if (tag === '.') {
    return {
      get: function(s) { return s }
    }
  }
  const expr = expressions.compile(tag)
  return {
    get: function(scope, context) {
      let obj = {}
      const scopeList = context.scopeList
      const num = context.num
      for (let i = 0, len = num + 1; i < len; i++) {
        obj = Object.assign(obj, scopeList[i])
      }
      return expr(scope, obj)
    }
  }
}

// Helper to parse currency string to number
function parseCurrencyToNumber(value: string): number {
  if (!value) return 0
  return Number(value.replace(/[^0-9.-]+/g, ''))
}

// Helper to format dates consistently
function formatDate(date: Date | string | null): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function validateVariables(variables: Record<string, string | number | boolean>, template: { variables: string[] }): boolean {
  const requiredFields = template.variables as string[];
  return requiredFields.every(field => {
    const value = variables[field];
    return value !== undefined && value !== null && value !== '';
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { templateId, clientId, variables } = body;

    // Enhanced validation
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    if (!variables || Object.keys(variables).length === 0) {
      return NextResponse.json(
        { error: 'Document variables are required' },
        { status: 400 }
      );
    }

    // Fetch template first to validate
    const template = await prisma.template.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Fetch client if provided
    let client = null;
    if (clientId) {
      client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
          addresses: {
            where: { isDefault: true },
            take: 1
          },
          policies: {
            where: { status: 'active' },
            orderBy: [
              { type: 'asc' },
              { effectiveDate: 'desc' }
            ]
          }
        }
      });

      if (!client) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        );
      }
    }

    // Process variables for document generation
    const processedVariables = {
      ...variables,
      
      // Client information
      client_name: variables.full_name || client?.fullName || '',
      client_email: variables.email_address || client?.email || '',
      client_phone: variables.phone_number || client?.phoneNumber || '',
      
      // Format dates consistently
      issue_date: formatDate(variables.issue_date),
      effective_date: formatDate(variables.effective_date),
      expiration_date: formatDate(variables.expiration_date),
      
      // Convert currency strings to numbers for comparisons
      coverage_limit_number: parseCurrencyToNumber(variables.coverage_limit),
      
      // Policy information
      policy_number: variables.policy_number || '',
      policy_type: variables.policy_type || '',
      status: variables.status || 'pending',

      // Address formatting
      formatted_address: client?.addresses[0] ? 
        `${client.addresses[0].street}, ${client.addresses[0].city}, ${client.addresses[0].state} ${client.addresses[0].zipCode}` : 
        variables.address || '',

      // Helper functions
      includes: (str: string, search: string) => str?.includes?.(search) || false,
      startsWith: (str: string, search: string) => str?.startsWith?.(search) || false,
      endsWith: (str: string, search: string) => str?.endsWith?.(search) || false,

      // Dates for signatures
      representative_signature_date: formatDate(new Date()),
      policyholder_signature_date: formatDate(new Date())
    };

    // Read and process template
    const templatePath = path.join(process.cwd(), 'uploads', 'templates', template.filePath);
    const templateContent = await fs.readFile(templatePath);
    const zip = new PizZip(templateContent);

    // Configure document generator
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      parser: angularParser
    });

    // Render document
    doc.render(processedVariables);

    // Generate buffer
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    });

    // Create filename and save
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${template.name}-${timestamp}.docx`;
    const filePath = path.join(process.cwd(), 'uploads', 'documents', fileName);

    await fs.mkdir(path.join(process.cwd(), 'uploads', 'documents'), { recursive: true });
    await fs.writeFile(filePath, buffer);

    // Create database record
    const document = await prisma.document.create({
      data: {
        name: fileName,
        filePath: fileName,
        templateId,
        clientId,
        data: processedVariables
      }
    });

    return NextResponse.json({
      message: 'Document generated successfully',
      documentId: document.id,
      downloadUrl: `/api/documents/${document.id}/download`,
      filename: fileName
    });

  } catch (error) {
    console.error('Document generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// app/api/clients/[id]/details/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        addresses: {
          where: { isDefault: true },
          take: 1
        },
        policies: {
          where: { status: 'active' },
          orderBy: { 
            effectiveDate: 'desc'
          },
          take: 1
        }
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const activePolicy = client.policies[0]

    // Format response with all necessary data
    return NextResponse.json({
      client: {
        id: client.id,
        fullName: client.fullName,
        email: client.email,
        phoneNumber: client.phoneNumber,
        dateOfBirth: client.dateOfBirth
      },
      defaultAddress: client.addresses[0] || null,
      activePolicy: activePolicy ? {
        ...activePolicy,
        issueDate: activePolicy.issueDate.toISOString(),
        effectiveDate: activePolicy.effectiveDate.toISOString(),
        expirationDate: activePolicy.expirationDate.toISOString(),
        coverageDetails: activePolicy.coverageDetails,
        premiumDetails: activePolicy.premiumDetails
      } : null
    })

  } catch (error) {
    console.error('Client details error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client details' },
      { status: 500 }
    )
  }
}