import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.verified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

    // Generate verification token
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: expiresAt,
        userId: user.id,
      },
    });

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}`;
    
    await sendEmail({
      to: email,
      subject: "Verify your email address",
      html: `
        <h1>Welcome to INKSPOT!</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Verify Email
        </a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      `,
    });

    return NextResponse.json({ message: "Verification email sent" });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 });
    }

    // Find and validate token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: "Invalid verification token" }, { status: 400 });
    }

    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json({ error: "Verification token has expired" }, { status: 400 });
    }

    // Update user as verified
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { 
        verified: true,
        emailVerified: new Date(),
      },
    });

    // Delete used token
    await prisma.verificationToken.delete({
      where: { token },
    });

    return NextResponse.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json({ error: "Failed to verify email" }, { status: 500 });
  }
} 