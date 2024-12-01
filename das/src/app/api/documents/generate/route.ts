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

function parseCurrency(value: string | number): number {
  if (typeof value === 'number') return value;
  return Number(value.replace(/[^0-9.-]+/g, ''));
}

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseCurrency(value) : value;
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

    // Fetch all required data with specific policy type
    const [template, client] = await Promise.all([
      prisma.template.findUnique({ where: { id: templateId } }),
      prisma.client.findUnique({
        where: { id: clientId },
        include: {
          addresses: { where: { isDefault: true } },
          policies: {
            where: { 
              type: variables.policy_type,
              status: { in: ['active', 'ACTIVE'] }
            },
            orderBy: { effectiveDate: 'desc' },
            take: 1,
            include: {
              // Add any additional relations you need
            }
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
      return NextResponse.json({ 
        error: `No active ${variables.policy_type} policy found for this client` 
      }, { status: 404 });
    }

    // Process policy details
    const coverageDetails = typeof activePolicy.coverageDetails === 'string' 
      ? JSON.parse(activePolicy.coverageDetails)
      : activePolicy.coverageDetails;

    const premiumDetails = typeof activePolicy.premiumDetails === 'string'
      ? JSON.parse(activePolicy.premiumDetails)
      : activePolicy.premiumDetails;

    const claimsHistory = typeof activePolicy.claimsHistory === 'string'
      ? JSON.parse(activePolicy.claimsHistory)
      : activePolicy.claimsHistory;

    // Create complete document variables
    const documentVariables = {
      // Basic Policy Information
      policy_number: activePolicy.policyNumber,
      policy_type: activePolicy.type,
      package_type: activePolicy.packageType,
      payment_status: activePolicy.paymentStatus,
      issue_date: formatDate(activePolicy.issueDate),
      effective_date: formatDate(activePolicy.effectiveDate),
      expiration_date: formatDate(activePolicy.expirationDate),
      policy_status: activePolicy.status.toUpperCase(),
      underwriting_status: activePolicy.underwritingStatus,
      renewal_status: activePolicy.renewalStatus,

      // Claims Information
      total_claims: claimsHistory?.totalClaims || 0,
      open_claims: claimsHistory?.openClaims || 0,
      last_claim_date: claimsHistory?.lastClaimDate 
        ? formatDate(claimsHistory.lastClaimDate) 
        : 'No Claims',

      // Policyholder Information
      policyholder_name: client.fullName,
      policyholder_address: defaultAddress?.street || '',
      policyholder_city_state_zip: defaultAddress 
        ? `${defaultAddress.city}, ${defaultAddress.state} ${defaultAddress.zipCode}`
        : '',
      policyholder_phone: client.phoneNumber,
      policyholder_email: client.email,
      policyholder_dob: formatDate(client.dateOfBirth),

      // Coverage Information
      liability_coverage: formatCurrency(coverageDetails.limit),
      collision_deductible: formatCurrency(coverageDetails.deductible),
      coverage_description: coverageDetails.description,

      // Vehicle Information (for auto policies)
      vehicle_make: coverageDetails.vehicleInfo?.make || '',
      vehicle_model: coverageDetails.vehicleInfo?.model || '',
      vehicle_year: coverageDetails.vehicleInfo?.year || '',
      vehicle_vin: coverageDetails.vehicleInfo?.vin || '',

      // Premium Information
      annual_premium: formatCurrency(premiumDetails.annualPremium),
      monthly_premium: formatCurrency(premiumDetails.annualPremium / 12),
      payment_frequency: premiumDetails.paymentFrequency,
      next_payment_due: formatDate(premiumDetails.nextPaymentDue),
      total_discount: formatCurrency(premiumDetails.discount),
      net_premium: formatCurrency(premiumDetails.annualPremium - premiumDetails.discount),

      // Additional calculated fields
      monthly_payment: formatCurrency(
        (premiumDetails.annualPremium - premiumDetails.discount) / 12
      ),

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
    const clientId = params.id;

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        addresses: {
          where: { isDefault: true },
          take: 1
        },
        policies: {
          where: { 
            status: { in: ['active', 'ACTIVE'] }
          },
          orderBy: { 
            effectiveDate: 'desc'
          }
        }
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const policyTypes = [...new Set(client.policies.map(p => p.type))];
    const hasPolicies = client.policies.length > 0;

    // Format response with all necessary data
    return NextResponse.json({
      client: {
        id: client.id,
        fullName: client.fullName,
        email: client.email,
        phoneNumber: client.phoneNumber,
        dateOfBirth: client.dateOfBirth.toISOString()
      },
      defaultAddress: client.addresses[0] || null,
      policies: client.policies.map(policy => ({
        ...policy,
        issueDate: policy.issueDate.toISOString(),
        effectiveDate: policy.effectiveDate.toISOString(),
        expirationDate: policy.expirationDate.toISOString()
      })),
      hasPolicies,
      policyTypes
    });

  } catch (error) {
    console.error('Client details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client details' },
      { status: 500 }
    );
  }
}