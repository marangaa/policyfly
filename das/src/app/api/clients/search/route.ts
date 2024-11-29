// app/api/clients/search/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
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
      take: 5, // Limit results to prevent overwhelming the UI
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Client search error:", error);
    return NextResponse.json(
      { error: "Failed to search clients" },
      { status: 500 },
    );
  }
}
