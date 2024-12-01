
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!params?.id) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid client ID" }), 
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        addresses: {
          where: { isDefault: true },
          take: 1,
        },
        policies: {
          where: { status: { in: ['ACTIVE', 'active'] } },
          orderBy: { effectiveDate: 'desc' }
        }
      }
    });

    if (!client) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Client not found",
          message: `No client found with ID: ${params.id}`
        }), 
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Process the response data
    const responseData = {
      success: true,
      data: {
        client: {
          id: client.id,
          fullName: client.fullName,
          email: client.email,
          phoneNumber: client.phoneNumber,
          dateOfBirth: client.dateOfBirth?.toISOString()
        },
        hasPolicies: client.policies.length > 0,
        defaultAddress: client.addresses[0] || null,
        policies: client.policies.map(policy => ({
          id: policy.id,
          policyNumber: policy.policyNumber,
          type: policy.type.toLowerCase(),
          status: policy.status.toLowerCase(),
          issueDate: policy.issueDate.toISOString(),
          effectiveDate: policy.effectiveDate.toISOString(),
          expirationDate: policy.expirationDate.toISOString(),
          coverageDetails: typeof policy.coverageDetails === 'string' 
            ? JSON.parse(policy.coverageDetails) 
            : policy.coverageDetails,
          premiumDetails: typeof policy.premiumDetails === 'string'
            ? JSON.parse(policy.premiumDetails)
            : policy.premiumDetails
        })),
        policyTypes: [...new Set(client.policies.map(p => p.type))]
      }
    };

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch client details",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
