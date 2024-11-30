import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
            status: { in: ['ACTIVE', 'active'] }
          },
          orderBy: [
            { type: 'asc' },
            { effectiveDate: 'desc' }
          ],
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

    if (!client || client.policies.length === 0) {
      return NextResponse.json({
        client: {
          id: client?.id,
          fullName: client?.fullName,
          email: client?.email,
          phoneNumber: client?.phoneNumber,
          dateOfBirth: client?.dateOfBirth?.toISOString().split('T')[0] || '',
        },
        hasPolicies: false,
        message: "No active policies found"
      });
    }

    // Process policies and ensure proper data format
    const processedPolicies = client.policies.map(policy => ({
      id: policy.id,
      policyNumber: policy.policyNumber,
      type: policy.type.toLowerCase(),
      status: policy.status.toLowerCase(),
      issueDate: policy.issueDate.toISOString().split('T')[0],
      effectiveDate: policy.effectiveDate.toISOString().split('T')[0],
      expirationDate: policy.expirationDate.toISOString().split('T')[0],
      coverageDetails: typeof policy.coverageDetails === 'string'
        ? JSON.parse(policy.coverageDetails)
        : policy.coverageDetails,
      premiumDetails: typeof policy.premiumDetails === 'string'
        ? JSON.parse(policy.premiumDetails)
        : policy.premiumDetails,
    }));

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
      hasPolicies: true,
      defaultAddress: client.addresses[0] || null,
      policies: processedPolicies,
      policyTypes: [...new Set(processedPolicies.map(p => p.type))],
      recentDocuments: client.documents,
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
