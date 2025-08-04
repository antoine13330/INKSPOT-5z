import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get("stripe-signature")!

    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 })
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object)
        break

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object)
        break

      case "charge.dispute.created":
        await handleDisputeCreated(event.data.object)
        break

      case "charge.dispute.updated":
        await handleDisputeUpdated(event.data.object)
        break

      case "refund.created":
        await handleRefundCreated(event.data.object)
        break

      case "refund.updated":
        await handleRefundUpdated(event.data.object)
        break

      case "transfer.created":
        await handleTransferCreated(event.data.object)
        break

      case "payout.paid":
        await handlePayoutPaid(event.data.object)
        break

      case "payout.failed":
        await handlePayoutFailed(event.data.object)
        break

      case "account.updated":
        await handleAccountUpdated(event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ message: "Webhook error" }, { status: 500 })
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    // Update payment status
    const payment = await prisma.payment.update({
      where: {
        stripePaymentIntentId: paymentIntent.id,
      },
      data: {
        status: "COMPLETED",
      },
      include: {
        booking: {
          include: {
            client: true,
            pro: true,
          },
        },
      },
    })

    if (payment.booking) {
      // If this is a deposit payment, confirm the booking
      if (payment.amount === payment.booking.depositAmount) {
        await prisma.booking.update({
          where: { id: payment.booking.id },
          data: { status: "CONFIRMED" },
        })

        // Create notifications
        await Promise.all([
          prisma.notification.create({
            data: {
              title: "Booking Confirmed",
              message: `Your booking "${payment.booking.title}" has been confirmed`,
              type: "BOOKING",
              userId: payment.booking.clientId,
              data: {
                bookingId: payment.booking.id,
                type: "booking_confirmed",
              },
            },
          }),
          prisma.notification.create({
            data: {
              title: "Deposit Received",
              message: `Deposit received for "${payment.booking.title}"`,
              type: "PAYMENT",
              userId: payment.booking.proId,
              data: {
                bookingId: payment.booking.id,
                paymentId: payment.id,
                type: "deposit_received",
              },
            },
          }),
        ])
      }

      // Create transaction record
      await prisma.transaction.create({
        data: {
          amount: payment.amount,
          currency: payment.currency,
          type: payment.amount === payment.booking.depositAmount ? "DEPOSIT" : "BOOKING_PAYMENT",
          status: "completed",
          description: payment.description || `Payment for ${payment.booking.title}`,
          userId: payment.receiverId,
          paymentId: payment.id,
        },
      })
    }
  } catch (error) {
    console.error("Error handling payment succeeded:", error)
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  try {
    await prisma.payment.update({
      where: {
        stripePaymentIntentId: paymentIntent.id,
      },
      data: {
        status: "FAILED",
      },
    })
  } catch (error) {
    console.error("Error handling payment failed:", error)
  }
}

async function handleTransferCreated(transfer: any) {
  try {
    // Record the transfer
    await prisma.transaction.create({
      data: {
        amount: transfer.amount / 100, // Convert from cents
        currency: transfer.currency.toUpperCase(),
        type: "PAYOUT",
        status: "completed",
        stripeTransferId: transfer.id,
        description: transfer.description || "Payout to professional",
        userId: transfer.destination, // This should be mapped to user ID
      },
    })
  } catch (error) {
    console.error("Error handling transfer created:", error)
  }
}

async function handlePayoutPaid(payout: any) {
  try {
    // Update transaction status if needed
    const transactions = await prisma.transaction.updateMany({
      where: {
        stripeTransferId: payout.id,
      },
      data: {
        status: "completed",
      },
    })

    // Get the transaction to send notification
    const transaction = await prisma.transaction.findFirst({
      where: {
        stripeTransferId: payout.id,
      },
      include: {
        user: true,
      },
    })

    if (transaction) {
      // Create notification for successful payout
      await prisma.notification.create({
        data: {
          title: "Payout Completed",
          message: `Your payout of €${Math.abs(transaction.amount)} has been completed`,
          type: "PAYMENT",
          userId: transaction.userId,
          data: {
            transactionId: transaction.id,
            amount: Math.abs(transaction.amount),
            type: "payout_completed",
          },
        },
      })
    }
  } catch (error) {
    console.error("Error handling payout paid:", error)
  }
}

async function handlePayoutFailed(payout: any) {
  try {
    // Update transaction status to failed
    const transaction = await prisma.transaction.findFirst({
      where: {
        stripeTransferId: payout.id,
      },
      include: {
        user: true,
      },
    })

    if (transaction) {
      await prisma.transaction.update({
        where: {
          id: transaction.id,
        },
        data: {
          status: "failed",
        },
      })

      // Create notification for failed payout
      await prisma.notification.create({
        data: {
          title: "Payout Failed",
          message: `Your payout of €${Math.abs(transaction.amount)} has failed. Please contact support.`,
          type: "PAYMENT",
          userId: transaction.userId,
          data: {
            transactionId: transaction.id,
            amount: Math.abs(transaction.amount),
            type: "payout_failed",
            failureReason: payout.failure_message,
          },
        },
      })
    }
  } catch (error) {
    console.error("Error handling payout failed:", error)
  }
}

async function handleDisputeCreated(dispute: any) {
  try {
    // Find the payment associated with this dispute
    const payment = await prisma.payment.findFirst({
      where: {
        stripePaymentIntentId: dispute.payment_intent,
      },
      include: {
        sender: true,
        receiver: true,
        booking: true,
      },
    })

    if (payment) {
      // Create dispute record (you might want to add a disputes table)
      // For now, create notifications
      await Promise.all([
        prisma.notification.create({
          data: {
            title: "Payment Dispute",
            message: `A dispute has been created for your payment of €${payment.amount}`,
            type: "PAYMENT",
            userId: payment.senderId,
            data: {
              paymentId: payment.id,
              disputeId: dispute.id,
              amount: payment.amount,
              reason: dispute.reason,
              type: "dispute_created",
            },
          },
        }),
        prisma.notification.create({
          data: {
            title: "Payment Dispute",
            message: `A dispute has been created for payment you received of €${payment.amount}`,
            type: "PAYMENT",
            userId: payment.receiverId,
            data: {
              paymentId: payment.id,
              disputeId: dispute.id,
              amount: payment.amount,
              reason: dispute.reason,
              type: "dispute_created",
            },
          },
        }),
      ])
    }
  } catch (error) {
    console.error("Error handling dispute created:", error)
  }
}

async function handleDisputeUpdated(dispute: any) {
  try {
    // Find the payment associated with this dispute
    const payment = await prisma.payment.findFirst({
      where: {
        stripePaymentIntentId: dispute.payment_intent,
      },
      include: {
        sender: true,
        receiver: true,
      },
    })

    if (payment) {
      const status = dispute.status
      let message = ""

      switch (status) {
        case "won":
          message = `Dispute resolved in your favor for payment of €${payment.amount}`
          break
        case "lost":
          message = `Dispute was lost for payment of €${payment.amount}`
          break
        case "needs_response":
          message = `Dispute requires your response for payment of €${payment.amount}`
          break
        default:
          message = `Dispute status updated to ${status} for payment of €${payment.amount}`
      }

      // Notify relevant parties
      await Promise.all([
        prisma.notification.create({
          data: {
            title: "Dispute Update",
            message,
            type: "PAYMENT",
            userId: payment.senderId,
            data: {
              paymentId: payment.id,
              disputeId: dispute.id,
              status,
              type: "dispute_updated",
            },
          },
        }),
        prisma.notification.create({
          data: {
            title: "Dispute Update",
            message,
            type: "PAYMENT",
            userId: payment.receiverId,
            data: {
              paymentId: payment.id,
              disputeId: dispute.id,
              status,
              type: "dispute_updated",
            },
          },
        }),
      ])
    }
  } catch (error) {
    console.error("Error handling dispute updated:", error)
  }
}

async function handleRefundCreated(refund: any) {
  try {
    // Find the payment associated with this refund
    const payment = await prisma.payment.findFirst({
      where: {
        stripePaymentIntentId: refund.payment_intent,
      },
      include: {
        sender: true,
        receiver: true,
      },
    })

    if (payment) {
      // The refund record should already be created by the refund API
      // Just create notifications if they don't already exist
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: payment.senderId,
          data: {
            path: ["type"],
            equals: "refund_processed",
          },
        },
      })

      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            title: "Refund Processed",
            message: `Refund of €${refund.amount / 100} has been processed via Stripe`,
            type: "PAYMENT",
            userId: payment.senderId,
            data: {
              paymentId: payment.id,
              refundId: refund.id,
              amount: refund.amount / 100,
              type: "refund_processed",
            },
          },
        })
      }
    }
  } catch (error) {
    console.error("Error handling refund created:", error)
  }
}

async function handleRefundUpdated(refund: any) {
  try {
    // Handle refund status updates (succeeded, failed, etc.)
    const payment = await prisma.payment.findFirst({
      where: {
        stripePaymentIntentId: refund.payment_intent,
      },
      include: {
        sender: true,
        receiver: true,
      },
    })

    if (payment && refund.status === "failed") {
      await prisma.notification.create({
        data: {
          title: "Refund Failed",
          message: `Refund of €${refund.amount / 100} has failed. Please contact support.`,
          type: "PAYMENT",
          userId: payment.senderId,
          data: {
            paymentId: payment.id,
            refundId: refund.id,
            amount: refund.amount / 100,
            type: "refund_failed",
            failureReason: refund.failure_reason,
          },
        },
      })
    }
  } catch (error) {
    console.error("Error handling refund updated:", error)
  }
}

async function handleAccountUpdated(account: any) {
  try {
    // Update user's Stripe account status
    await prisma.user.updateMany({
      where: {
        stripeAccountId: account.id,
      },
      data: {
        stripeAccountStatus: account.charges_enabled ? "active" : "pending",
      },
    })

    // If account is now enabled, notify the user
    if (account.charges_enabled) {
      const user = await prisma.user.findFirst({
        where: {
          stripeAccountId: account.id,
        },
      })

      if (user) {
        await prisma.notification.create({
          data: {
            title: "Account Verified",
            message: "Your Stripe account has been verified and you can now receive payments",
            type: "ACCOUNT",
            userId: user.id,
            data: {
              accountId: account.id,
              type: "account_verified",
            },
          },
        })
      }
    }
  } catch (error) {
    console.error("Error handling account updated:", error)
  }
}
