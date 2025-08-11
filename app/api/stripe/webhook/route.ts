import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;

      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;

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

      case "account.updated":
        await handleAccountUpdated(event.data.object);
        break;

      case "customer.created":
        await handleCustomerCreated(event.data.object);
        break;

      case "payout.failed":
        await handlePayoutFailed(event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

async function handlePaymentSucceeded(paymentIntent: unknown) {
  const { customer, amount, currency, metadata } = paymentIntent;

  // Update booking status if it's a booking payment
  if (metadata.bookingId) {
    await prisma.booking.update({
      where: { id: metadata.bookingId },
      data: {
        status: "CONFIRMED",
      },
    });

    // Get booking to find sender and receiver
    const booking = await prisma.booking.findUnique({
      where: { id: metadata.bookingId },
      include: { client: true, pro: true },
    });

    if (booking) {
      // Create payment record
      await prisma.payment.create({
        data: {
          amount: amount / 100, // Convert from cents
          currency,
          status: "COMPLETED",
          stripePaymentIntentId: paymentIntent.id,
          bookingId: metadata.bookingId,
          senderId: booking.clientId,
          receiverId: booking.proId,
        },
      });
    }
  }
}

async function handlePaymentFailed(paymentIntent: unknown) {
  const { metadata } = paymentIntent;

  if (metadata.bookingId) {
    await prisma.booking.update({
      where: { id: metadata.bookingId },
      data: {
        status: "CANCELLED",
      },
    });

    // Get booking to find sender and receiver
    const booking = await prisma.booking.findUnique({
      where: { id: metadata.bookingId },
      include: { client: true, pro: true },
    });

    if (booking) {
      await prisma.payment.create({
        data: {
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: "FAILED",
          stripePaymentIntentId: paymentIntent.id,
          bookingId: metadata.bookingId,
          senderId: booking.clientId,
          receiverId: booking.proId,
        },
      });
    }
  }
}

async function handleCheckoutCompleted(session: unknown) {
  const { customer, metadata } = session;

  // Update user with Stripe customer ID if not already set
  if (customer && metadata.userId) {
    await prisma.user.update({
      where: { id: metadata.userId },
      data: { stripeCustomerId: customer },
    });
  }
}

async function handleCustomerCreated(customer: unknown) {
  const { id, email, metadata } = customer;

  if (metadata.userId) {
    await prisma.user.update({
      where: { id: metadata.userId },
      data: { stripeCustomerId: id },
    });
  }
}

async function handleTransferCreated(transfer: unknown) {
  try {
    // Handle transfer creation (payouts to connected accounts)
    const payment = await prisma.payment.findFirst({
      where: {
        stripePaymentIntentId: transfer.source_transaction,
      },
      include: {
        receiver: true,
      },
    })

    if (payment) {
      await prisma.notification.create({
        data: {
          title: "Payment Transferred",
          message: `Payment of €${transfer.amount / 100} has been transferred to your account`,
          type: "PAYMENT",
          userId: payment.receiverId,
          data: {
            paymentId: payment.id,
            transferId: transfer.id,
            amount: transfer.amount / 100,
            type: "transfer_created",
          },
        },
      })
    }
  } catch (error) {
    console.error("Error handling transfer created:", error)
  }
}

async function handlePayoutFailed(payout: unknown) {
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

async function handleDisputeCreated(dispute: unknown) {
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

async function handleDisputeUpdated(dispute: unknown) {
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

async function handleRefundCreated(refund: unknown) {
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

async function handleRefundUpdated(refund: unknown) {
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

async function handleAccountUpdated(account: unknown) {
  try {
    // Update user's Stripe account status
    await prisma.user.updateMany({
      where: {
        stripeAccountId: account.id,
      },
              data: {
          verified: account.charges_enabled,
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
            type: "PAYMENT",
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
