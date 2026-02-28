import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe, createPaymentIntent, refundPayment } from "@/lib/stripe"
import { sendBookingConfirmationEmail } from "@/lib/email"
import { notifyOfflineUserForProposal } from "@/lib/offline-push-notifications"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Only PRO users can create booking proposals
    if (session.user.role !== "PRO") {
      return NextResponse.json({ message: "Only professionals can create appointment proposals" }, { status: 403 })
    }

    const body = await request.json()
    const { proId, title, description, startTime, endTime, location, price } = body

    // Verify the pro exists and is actually a PRO
    const pro = await prisma.user.findFirst({
      where: {
        id: proId,
        role: "PRO",
      },
    })

    if (!pro) {
      return NextResponse.json({ message: "Professional not found" }, { status: 404 })
    }

    // Check for conflicts
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        proId,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        OR: [
          {
            AND: [{ startTime: { lte: new Date(startTime) } }, { endTime: { gt: new Date(startTime) } }],
          },
          {
            AND: [{ startTime: { lt: new Date(endTime) } }, { endTime: { gte: new Date(endTime) } }],
          },
        ],
      },
    })

    if (conflictingBooking) {
      return NextResponse.json({ message: "Time slot is not available" }, { status: 400 })
    }

    // Calculate deposit (25% of total price)
    const depositAmount = price * 0.25

    // Get client info
    const client = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!client) {
      return NextResponse.json({ message: "Client not found" }, { status: 404 })
    }

    // Create Stripe payment intent for deposit
    const paymentIntent = await createPaymentIntent({
      amount: depositAmount,
      currency: "eur",
      appointmentId: "", // Will be updated after booking creation
      clientId: session.user.id,
      proId,
      description: `Deposit for ${title}`,
    })

    const booking = await prisma.booking.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location,
        price,
        depositAmount,
        clientId: session.user.id,
        proId,
        status: "PENDING",
      },
      include: {
        client: {
          select: {
            id: true,
            username: true,
            avatar: true,
            email: true,
          },
        },
        pro: {
          select: {
            id: true,
            username: true,
            businessName: true,
            avatar: true,
            email: true,
          },
        },
      },
    })

    // Create payment record
    await prisma.payment.create({
      data: {
        amount: depositAmount,
        currency: "EUR",
        status: "PENDING",
        stripePaymentIntentId: paymentIntent.paymentIntentId,
        description: `Deposit for ${title}`,
        senderId: session.user.id,
        receiverId: proId,
        bookingId: booking.id,
      },
    })

    // Create notification for the pro
    await prisma.notification.create({
      data: {
        title: "New Booking Request",
        message: `${session.user.username} has requested a booking for "${title}"`,
        type: "BOOKING",
        userId: proId,
        data: {
          bookingId: booking.id,
          type: "booking_request",
        },
      },
    })

    // Send push notification if pro is offline
    try {
      await notifyOfflineUserForProposal(
        proId,
        session.user.id,
        {
          bookingId: booking.id,
          title: title
        }
      );
    } catch (error) {
      console.error("Error sending offline push notification:", error);
      // Ne pas faire échouer la création du booking si la notification push échoue
    }

    return NextResponse.json({
      message: "Booking created successfully",
      booking,
              paymentIntent: {
          id: paymentIntent.paymentIntentId,
          clientSecret: paymentIntent.clientSecret,
          amount: depositAmount,
        },
    })
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, action } = body

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: true,
        pro: true,
        payments: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 })
    }

    // Check permissions
    const isClient = booking.clientId === session.user.id
    const isPro = booking.proId === session.user.id

    if (!isClient && !isPro) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    let updatedBooking

    switch (action) {
      case "confirm":
        if (!isPro) {
          return NextResponse.json({ message: "Only the professional can confirm bookings" }, { status: 403 })
        }
        updatedBooking = await prisma.booking.update({
          where: { id: bookingId },
          data: { status: "CONFIRMED" },
          include: { client: true, pro: true },
        })

        // Send confirmation emails
        await Promise.all([
          sendBookingConfirmationEmail(booking.client.email, {
            title: booking.title,
            startTime: booking.startTime,
            endTime: booking.endTime,
            proName: booking.pro.businessName || booking.pro.username,
            clientName: booking.client.username,
            price: booking.price,
          }),
          sendBookingConfirmationEmail(booking.pro.email, {
            title: booking.title,
            startTime: booking.startTime,
            endTime: booking.endTime,
            proName: booking.pro.businessName || booking.pro.username,
            clientName: booking.client.username,
            price: booking.price,
          }),
        ])
        break

      case "cancel":
        updatedBooking = await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: "CANCELLED",
          },
          include: { client: true, pro: true },
        })

        // Handle deposit refund/transfer based on who cancelled
        if (booking.depositAmount && booking.depositAmount > 0) {
          const depositPayment = booking.payments.find((p: any) => p.amount === booking.depositAmount)
          if (depositPayment && depositPayment.status === "COMPLETED") {
            if (isClient) {
              // Client cancelled - deposit goes to pro
              await prisma.transaction.create({
                data: {
                  amount: booking.depositAmount,
                  currency: "EUR",
                  type: "DEPOSIT",
                  status: "completed",
                  description: `Deposit forfeited for cancelled booking: ${booking.title}`,
                  userId: booking.proId,
                  paymentId: depositPayment.id,
                },
              })
            } else {
              // Pro cancelled - refund deposit to client
              await refundPayment(depositPayment.stripePaymentIntentId!)

              await prisma.transaction.create({
                data: {
                  amount: booking.depositAmount,
                  currency: "EUR",
                  type: "REFUND",
                  status: "completed",
                  description: `Deposit refunded for cancelled booking: ${booking.title}`,
                  userId: booking.clientId,
                  paymentId: depositPayment.id,
                },
              })
            }
          }
        }
        break

      case "complete": {
        if (!isPro) {
          return NextResponse.json({ message: "Only the professional can complete bookings" }, { status: 403 })
        }
        updatedBooking = await prisma.booking.update({
          where: { id: bookingId },
          data: { status: "COMPLETED" },
          include: { client: true, pro: true },
        })

        // Create invoice for remaining amount
        const remainingAmount = booking.price - (booking.depositAmount || 0)
        if (remainingAmount > 0) {
          const invoiceNumber = `INV-${Date.now()}`
          await prisma.invoice.create({
            data: {
              invoiceNumber,
              amount: remainingAmount,
              currency: "EUR",
              description: `Final payment for ${booking.title}`,
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
              issuerId: booking.proId,
              receiverId: booking.clientId,
              bookingId: booking.id,
            },
          })
        }
        break
      }

      default:
        return NextResponse.json({ message: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({
      message: "Booking updated successfully",
      booking: updatedBooking,
    })
  } catch (error) {
    console.error("Error updating booking:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
