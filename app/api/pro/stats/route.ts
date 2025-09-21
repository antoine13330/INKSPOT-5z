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

    // Calculer les statistiques des rendez-vous
    const totalBookings = await prisma.appointment.count({
      where: { proId }
    });

    const pendingBookings = await prisma.appointment.count({
      where: { 
        proId,
        status: "PROPOSED"
      }
    });

    const completedBookings = await prisma.appointment.count({
      where: { 
        proId,
        status: "COMPLETED"
      }
    });

    // Calculer les revenus
    const totalRevenueResult = await prisma.payment.aggregate({
      where: {
        receiverId: proId,
        status: "COMPLETED"
      },
      _sum: {
        amount: true
      }
    });

    const totalRevenue = totalRevenueResult._sum.amount || 0;

    // Revenus du mois en cours
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyRevenueResult = await prisma.payment.aggregate({
      where: {
        receiverId: proId,
        status: "COMPLETED",
        createdAt: {
          gte: startOfMonth
        }
      },
      _sum: {
        amount: true
      }
    });

    const monthlyRevenue = monthlyRevenueResult._sum.amount || 0;

    // Calculer le nombre de clients uniques
    const totalClients = await prisma.appointment.findMany({
      where: { proId },
      select: { clientId: true },
      distinct: ['clientId']
    });

    const stats = {
      totalBookings,
      pendingBookings,
      completedBookings,
      totalRevenue,
      monthlyRevenue,
      totalClients: totalClients.length
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching pro stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

