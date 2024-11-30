// app/api/clients/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ clients: [] });
    }

    // Search for clients with matching name, email, or policy number
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
        policies: {
          where: { status: { in: ['ACTIVE', 'active'] } },
          select: {
            id: true,
            policyNumber: true,
            type: true,
          }
        }
      },
      take: 5, // Limit results to prevent overwhelming the UI
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ 
      clients: clients.map(client => ({
        id: client.id,
        fullName: client.fullName,
        email: client.email,
        phoneNumber: client.phoneNumber,
        dateOfBirth: client.dateOfBirth.toISOString(),
        activePolicies: client.policies
      }))
    });
  } catch (error) {
    console.error("Client search error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to search clients" },
      { status: 500 }
    );
  }
}
