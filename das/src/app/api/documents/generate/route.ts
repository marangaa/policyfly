// app/api/documents/generate/route.ts
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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { templateId, clientId, variables } = body

    // Validate the request
    if (!templateId || !variables) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Fetch complete data from database
    const [template, client] = await Promise.all([
      prisma.template.findUnique({
        where: { id: templateId }
      }),
      clientId ? prisma.client.findUnique({
        where: { id: clientId },
        include: {
          addresses: {
            where: { isDefault: true },
            take: 1
          },
          policies: {
            where: { status: 'active' },
            orderBy: { effectiveDate: 'desc' },
            take: 1
          }
        }
      }) : null
    ])

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Read template file
    const templatePath = path.join(process.cwd(), 'uploads', 'templates', template.filePath)
    const templateContent = await fs.readFile(templatePath)

    // Create ZIP instance
    const zip = new PizZip(templateContent)

    // Configure document generator
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      parser: angularParser
    })

    // Process variables for conditions
    const activePolicy = client?.policies[0]

    // Prepare comprehensive data object
    const processedVariables = {
      ...variables,
      
      // Format dates
      issue_date: formatDate(variables.issue_date || activePolicy?.issueDate),
      effective_date: formatDate(variables.effective_date || activePolicy?.effectiveDate),
      expiration_date: formatDate(variables.expiration_date || activePolicy?.expirationDate),
      
      // Convert currency strings to numbers for comparisons
      coverage_limit_number: parseCurrencyToNumber(variables.coverage_limit),
      
      // Policy details
      policy_type: variables.policy_type || activePolicy?.type || '',
      policy_number: variables.policy_number || activePolicy?.policyNumber || '',
      status: variables.status || activePolicy?.status || 'pending',
      
      // Premium information
      premiumDetails: activePolicy?.premiumDetails || {
        annualPremium: '0',
        paymentFrequency: 'monthly',
        nextPaymentDue: new Date().toISOString(),
        discount: 0
      },
      
      // Coverage details based on policy type
      coverageDetails: {
        ...activePolicy?.coverageDetails,
        ...variables.coverageDetails
      },

      // Helper functions for string operations
      includes: (str: string, search: string) => str?.includes?.(search) || false,
      startsWith: (str: string, search: string) => str?.startsWith?.(search) || false,
      endsWith: (str: string, search: string) => str?.endsWith?.(search) || false,

      // Signature dates default to today
      representative_signature_date: formatDate(new Date()),
      policyholder_signature_date: formatDate(new Date())
    }

    // Render document with processed variables
    doc.render(processedVariables)

    // Generate buffer
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    })

    // Create filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `${template.name}-${timestamp}.docx`
    const filePath = path.join(process.cwd(), 'uploads', 'documents', fileName)

    // Ensure documents directory exists
    await fs.mkdir(path.join(process.cwd(), 'uploads', 'documents'), { recursive: true })

    // Save document
    await fs.writeFile(filePath, buffer)

    // Create database record
    const document = await prisma.document.create({
      data: {
        name: fileName,
        filePath: fileName,
        templateId,
        clientId,
        data: processedVariables
      }
    })

    // Generate download URL
    const downloadUrl = `/api/documents/${document.id}/download`

    return NextResponse.json({
      message: 'Document generated successfully',
      documentId: document.id,
      downloadUrl,
      filename: fileName
    })

  } catch (error) {
    console.error('Document generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
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