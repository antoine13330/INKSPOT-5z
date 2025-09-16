import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PRO") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const proId = session.user.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5");

    // Récupérer les factures récentes
    const invoices = await prisma.invoice.findMany({
      where: { 
        receiverId: proId 
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        payment: {
          select: {
            status: true,
            amount: true,
            paidAt: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    });

    // Formater les données pour le dashboard
    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      currency: invoice.currency,
      description: invoice.description,
      status: invoice.payment?.status === "COMPLETED" ? "paid" : "pending",
      dueDate: invoice.dueDate,
      client: {
        name: `${invoice.sender.firstName || ''} ${invoice.sender.lastName || ''}`.trim() || invoice.sender.username,
        email: invoice.sender.email
      },
      paidAt: invoice.payment?.paidAt,
      createdAt: invoice.createdAt
    }));

    return NextResponse.json({ invoices: formattedInvoices });
  } catch (error) {
    console.error("Error fetching pro invoices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
