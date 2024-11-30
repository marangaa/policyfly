import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } }

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        addresses: {
          where: { isDefault: true },
          take: 1,
        },
        policies: {
          where: { 
            // Convert to uppercase to match schema
            status: { in: ['ACTIVE', 'active'] }
          },
          orderBy: {
            effectiveDate: "desc",
          },
          take: 1,
        },
        documents: {
          orderBy: { createdAt: "desc" },
          take: 3,
          select: {
            id: true,
            name: true,
            createdAt: true,
            templateId: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" }, 
        { status: 404 }
      );
    }

    // Get active policy with properly formatted dates
    const activePolicy = client.policies[0];
    const today = new Date();

    // Format the response with complete data mapping
    return NextResponse.json({
      client: {
        id: client.id,
        fullName: client.fullName,
        email: client.email,
        phoneNumber: client.phoneNumber,
        dateOfBirth: client.dateOfBirth?.toISOString().split('T')[0] || '',
      },
      defaultAddress: client.addresses[0] || null,
      activePolicy: activePolicy ? {
        id: activePolicy.id,
        policyNumber: activePolicy.policyNumber,
        type: activePolicy.type.toLowerCase(), // Normalize type for form
        status: activePolicy.status.toLowerCase(), // Normalize status for form
        issueDate: activePolicy.issueDate?.toISOString().split('T')[0] || '',
        effectiveDate: activePolicy.effectiveDate?.toISOString().split('T')[0] || '',
        expirationDate: activePolicy.expirationDate?.toISOString().split('T')[0] || '',
        coverageDetails: typeof activePolicy.coverageDetails === 'string' 
          ? JSON.parse(activePolicy.coverageDetails)
          : activePolicy.coverageDetails,
        premiumDetails: typeof activePolicy.premiumDetails === 'string'
          ? JSON.parse(activePolicy.premiumDetails)
          : activePolicy.premiumDetails
      } : null,
      recentDocuments: client.documents,
      signatureDates: {
        representative: today.toISOString().split("T")[0],
        policyholder: today.toISOString().split("T")[0],
      },
      defaultTerms: `Standard terms and conditions apply to this ${client.policies[0]?.type || ""} insurance policy. The policyholder agrees to all terms and conditions set forth in this document.`,
    });
  } catch (error) {
    console.error("Client details error:", error);
    
    // More specific error handling
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch client details" },
      { status: 500 }
    );
  }
}
