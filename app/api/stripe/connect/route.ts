import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic"
import { getServerSession } from "next-auth";
export const dynamic = "force-dynamic"
import { authOptions } from "@/lib/auth";
export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic"
import { createStripeAccount, getAccountLink } from "@/lib/stripe";
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a PRO
    if (session.user.role !== "PRO") {
      return NextResponse.json({ error: "Only PRO users can connect Stripe" }, { status: 403 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already has a Stripe account
    if (user.stripeAccountId) {
      return NextResponse.json({ error: "User already has a Stripe account" }, { status: 400 });
    }

    // Create Stripe Connect account
    const account = await createStripeAccount(
      session.user.id,
      user.email,
      "FR" // Default to France, can be made configurable
    );

    // Update user with Stripe account ID
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeAccountId: account.id },
    });

    // Create account link for onboarding
    const accountLink = await getAccountLink(
      account.id,
      `${process.env.NEXT_PUBLIC_APP_URL}/pro/dashboard?refresh=true`,
      `${process.env.NEXT_PUBLIC_APP_URL}/pro/dashboard`
    );

    return NextResponse.json({
      accountId: account.id,
      accountLink: accountLink.url,
    });
  } catch (error) {
    console.error("Error creating Stripe account:", error);
    return NextResponse.json({ error: "Failed to create Stripe account" }, { status: 500 });
  }
} 