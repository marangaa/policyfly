import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ 
        success: true,
        data: { clients: [] }
      });
    }

    // Fetch clients with active policies
    const clients = await prisma.client.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          {
            policies: {
              some: {
                policyNumber: { contains: query, mode: "insensitive" },
              },
            },
          },
        ],
      },
      include: {
        addresses: {
          where: { isDefault: true },
          take: 1
        },
        policies: {
          where: { 
            status: { in: ['ACTIVE', 'active'] }
          },
          select: {
            id: true,
            policyNumber: true,
            type: true,
            status: true,
            coverageDetails: true,
            premiumDetails: true
          }
        }
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    const processedClients = clients.map(client => ({
      id: client.id,
      fullName: client.fullName,
      email: client.email,
      phoneNumber: client.phoneNumber,
      dateOfBirth: client.dateOfBirth.toISOString(),
      defaultAddress: client.addresses[0] || null,
      activePolicies: client.policies.map(policy => ({
        ...policy,
        coverageDetails: typeof policy.coverageDetails === 'string' 
          ? JSON.parse(policy.coverageDetails) 
          : policy.coverageDetails,
        premiumDetails: typeof policy.premiumDetails === 'string'
          ? JSON.parse(policy.premiumDetails)
          : policy.premiumDetails
      }))
    }));

    return NextResponse.json({
      success: true,
      data: { clients: processedClients }
    });
  } catch (error) {
    console.error("Client search error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to search clients",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
