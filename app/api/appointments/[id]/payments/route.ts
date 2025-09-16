import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get appointment with payments
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        pro: true,
        payments: {
          orderBy: { createdAt: 'desc' }
        },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Ensure user is either the client or pro of this appointment
    if (appointment.clientId !== session.user.id && appointment.proId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Calculate payment summary
    const completedPayments = appointment.payments.filter(p => p.status === 'COMPLETED');
    const totalPaid = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingBalance = appointment.price - totalPaid;

    // Determine payment types
    const hasDepositPayment = completedPayments.some(p => p.type === 'DEPOSIT');
    const hasFullPayment = completedPayments.some(p => p.type === 'FULL_PAYMENT');
    const hasRemainingPayment = completedPayments.some(p => p.type === 'REMAINING_BALANCE');

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        title: appointment.title,
        price: appointment.price,
        depositAmount: appointment.depositAmount,
        depositRequired: appointment.depositRequired,
        status: appointment.status,
        totalPaid,
        remainingBalance,
        hasDepositPayment,
        hasFullPayment,
        hasRemainingPayment,
        payments: appointment.payments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          type: payment.type,
          description: payment.description,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
        }))
      }
    });
  } catch (error) {
    console.error("Error fetching appointment payments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}