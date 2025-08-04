import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

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
      // Don't reveal if user exists or not for security
      return NextResponse.json({ message: "If an account exists, a password reset email has been sent" });
    }

    // Generate reset token
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: resetToken,
        expires: expiresAt,
        userId: user.id,
      },
    });

    // Send reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: email,
      subject: "Reset your password",
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <a href="${resetUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
      `,
    });

    return NextResponse.json({ message: "If an account exists, a password reset email has been sent" });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: "Failed to send password reset email" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Find and validate token
    const resetToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "Invalid reset token" }, { status: 400 });
    }

    if (resetToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json({ error: "Reset token has expired" }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    await prisma.user.update({
      where: { email: resetToken.identifier },
      data: { passwordHash: hashedPassword },
    });

    // Delete used token
    await prisma.verificationToken.delete({
      where: { token },
    });

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
} 