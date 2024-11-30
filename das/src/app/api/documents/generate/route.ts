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


// Helper to format dates consistently

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(num);
}

function formatDate(date: string | Date): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { templateId, clientId, variables } = body;

    // Validate required data
    if (!templateId || !clientId) {
      return NextResponse.json({ error: 'Template ID and Client ID are required' }, { status: 400 });
    }

    // Fetch all required data
    const [template, client] = await Promise.all([
      prisma.template.findUnique({ where: { id: templateId } }),
      prisma.client.findUnique({
        where: { id: clientId },
        include: {
          addresses: { where: { isDefault: true } },
          policies: {
            where: { type: variables.policy_type, status: 'active' },
            orderBy: { effectiveDate: 'desc' },
            take: 1
          }
        }
      })
    ]);

    if (!template || !client) {
      return NextResponse.json({ error: 'Template or client not found' }, { status: 404 });
    }

    const defaultAddress = client.addresses[0];
    const activePolicy = client.policies[0];

    if (!activePolicy) {
      return NextResponse.json({ error: 'No active policy found' }, { status: 404 });
    }

    // Process policy details
    const coverageDetails = typeof activePolicy.coverageDetails === 'string' 
      ? JSON.parse(activePolicy.coverageDetails)
      : activePolicy.coverageDetails;

    const premiumDetails = typeof activePolicy.premiumDetails === 'string'
      ? JSON.parse(activePolicy.premiumDetails)
      : activePolicy.premiumDetails;

    // Create complete document variables
    const documentVariables = {
      // Client Information
      full_name: client.fullName,
      email_address: client.email,
      phone_number: client.phoneNumber,
      date_of_birth: formatDate(client.dateOfBirth),
      
      // Address Information
      address: defaultAddress?.street || '',
      city_state_zip: defaultAddress 
        ? `${defaultAddress.city}, ${defaultAddress.state} ${defaultAddress.zipCode}`
        : '',

      // Policy Information
      policy_number: activePolicy.policyNumber,
      policy_type: activePolicy.type,
      issue_date: formatDate(activePolicy.issueDate),
      effective_date: formatDate(activePolicy.effectiveDate),
      expiration_date: formatDate(activePolicy.expirationDate),
      status: activePolicy.status,

      // Coverage Details
      coverage_limit: formatCurrency(coverageDetails.limit),
      deductible: formatCurrency(coverageDetails.deductible),
      coverage_description: coverageDetails.description,

      // Premium Details
      annual_premium: formatCurrency(premiumDetails.annualPremium),
      payment_frequency: premiumDetails.paymentFrequency,
      next_payment_due: formatDate(premiumDetails.nextPaymentDue),
      discount_amount: formatCurrency(premiumDetails.discount),

      // Type-specific details
      ...(activePolicy.type === 'auto' && coverageDetails.vehicleInfo ? {
        vehicle_make: coverageDetails.vehicleInfo.make,
        vehicle_model: coverageDetails.vehicleInfo.model,
        vehicle_year: coverageDetails.vehicleInfo.year,
        vehicle_vin: coverageDetails.vehicleInfo.vin
      } : {}),

      ...(activePolicy.type === 'home' && coverageDetails.propertyInfo ? {
        property_construction_year: coverageDetails.propertyInfo.constructionYear,
        property_square_feet: coverageDetails.propertyInfo.squareFeet,
        property_construction_type: coverageDetails.propertyInfo.constructionType
      } : {}),

      ...(activePolicy.type === 'life' ? {
        term_length: coverageDetails.termLength
      } : {}),

      // Document metadata
      generated_date: formatDate(new Date()),
      generated_by: 'System'
    };

    // Generate document using template
    const templatePath = path.join(process.cwd(), 'uploads', 'templates', template.filePath);
    const templateContent = await fs.readFile(templatePath);
    const zip = new PizZip(templateContent);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      parser: angularParser
    });

    doc.render(documentVariables);

    // Save the generated document
    const buffer = doc.getZip().generate({ type: 'nodebuffer' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${client.fullName}-${template.name}-${timestamp}.docx`.replace(/\s+/g, '-');
    const filePath = path.join(process.cwd(), 'uploads', 'documents', fileName);

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);

    // Create document record
    const document = await prisma.document.create({
      data: {
        name: fileName,
        filePath: fileName,
        templateId,
        clientId,
        data: documentVariables
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