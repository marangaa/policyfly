import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    context: { params: { id: string } }
  ) {
    try {
      const clientId = context.params.id;

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        addresses: {
          where: { isDefault: true },
          take: 1,
        },
        policies: {
          where: { status: "active" },
          orderBy: {
            effectiveDate: "desc",
          },
          take: 1,
          include: {
            // Include any other related policy data if needed
          },
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
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
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
        dateOfBirth: client.dateOfBirth.toISOString().split("T")[0], // Format as YYYY-MM-DD
      },
      defaultAddress: client.addresses[0] || null,
      activePolicy: activePolicy
        ? {
            ...activePolicy,
            effectiveDate: activePolicy.effectiveDate
              .toISOString()
              .split("T")[0],
            expirationDate: activePolicy.expirationDate
              .toISOString()
              .split("T")[0],
            coverageDetails: activePolicy.coverageDetails || {
              description: "",
              limit: "",
              deductible: "",
            },
            issueDate: activePolicy.effectiveDate.toISOString().split("T")[0],
          }
        : null,
      recentDocuments: client.documents,
      signatureDates: {
        representative: today.toISOString().split("T")[0],
        policyholder: today.toISOString().split("T")[0],
      },
      defaultTerms: `Standard terms and conditions apply to this ${client.policies[0]?.type || ""} insurance policy. The policyholder agrees to all terms and conditions set forth in this document.`,
    });
  } catch (error) {
    console.error("Client details error:", error);
    return NextResponse.json(
      { error: "Failed to fetch client details" },
      { status: 500 },
    );
  }
}
