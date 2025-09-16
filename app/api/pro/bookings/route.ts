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

    // Récupérer les RDV récents
    const bookings = await prisma.appointment.findMany({
      where: { proId },
      include: {
        client: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        payments: {
          where: {
            status: "COMPLETED"
          },
          select: {
            amount: true,
            type: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    });

    // Formater les données pour le dashboard
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      title: booking.title,
      status: booking.status,
      date: booking.appointmentDate,
      client: {
        name: `${booking.client.firstName || ''} ${booking.client.lastName || ''}`.trim() || booking.client.username,
        avatar: booking.client.avatar
      },
      price: booking.price,
      paidAmount: booking.payments.reduce((sum, payment) => sum + payment.amount, 0),
      createdAt: booking.createdAt
    }));

    return NextResponse.json({ bookings: formattedBookings });
  } catch (error) {
    console.error("Error fetching pro bookings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
