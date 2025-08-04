import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { uploadToS3, generateFileName } from "@/lib/s3";
import { sendEmail } from "@/lib/email";
import { createStripeCustomer, createStripeAccount } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const userType = formData.get("userType") as "CLIENT" | "PRO";
    const avatar = formData.get("avatar") as File | null;

    // Validation
    if (!email || !username || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Validate user type
    if (!userType || !["CLIENT", "PRO"].includes(userType)) {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ error: "Email already registered" }, { status: 400 });
      }
      if (existingUser.username === username) {
        return NextResponse.json({ error: "Username already taken" }, { status: 400 });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Upload avatar to S3 if provided
    let avatarUrl: string | undefined;
    if (avatar) {
      if (avatar.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Avatar size too large. Maximum 5MB allowed." }, { status: 400 });
      }

      if (!avatar.type.startsWith("image/")) {
        return NextResponse.json({ error: "Invalid file type. Only images are allowed." }, { status: 400 });
      }

      try {
        const fileName = generateFileName(avatar.name, "avatar");
        const bytes = await avatar.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        avatarUrl = await uploadToS3(buffer, fileName, avatar.type);
      } catch (error) {
        console.error("Error uploading avatar:", error);
        // Don't fail registration if avatar upload fails, just continue without avatar
        console.warn("Avatar upload failed, continuing without avatar");
      }
    }

    // Create Stripe customer
    let stripeCustomerId: string | undefined;
    try {
      const fullName = [firstName, lastName].filter(Boolean).join(" ");
      const stripeCustomer = await createStripeCustomer(
        `temp_${Date.now()}`, // Temporary ID, will be updated after user creation
        email,
        fullName || undefined
      );
      stripeCustomerId = stripeCustomer.id;
    } catch (error) {
      console.error("Error creating Stripe customer:", error);
      // Don't fail registration if Stripe fails, just continue without Stripe customer
      console.warn("Stripe customer creation failed, continuing without Stripe");
    }

    // Create Stripe Connect account for PRO users
    let stripeAccountId: string | undefined;
    if (userType === "PRO") {
      try {
        const stripeAccount = await createStripeAccount(
          `temp_${Date.now()}`, // Temporary ID, will be updated after user creation
          email,
          'FR' // Default to France, can be made configurable later
        );
        stripeAccountId = stripeAccount.id;
      } catch (error) {
        console.error("Error creating Stripe Connect account:", error);
        // Don't fail registration if Stripe Connect fails, just continue without it
        console.warn("Stripe Connect account creation failed, continuing without Connect account");
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        avatar: avatarUrl,
        role: userType,
        verified: true, // Temporarily set to true for testing - users can log in immediately
        stripeCustomerId,
        stripeAccountId,
      },
    });

    // Update Stripe customer with actual user ID if customer was created
    if (stripeCustomerId) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY!);
        await stripe.customers.update(stripeCustomerId, {
          metadata: {
            userId: user.id,
          },
        });
      } catch (error) {
        console.error("Error updating Stripe customer metadata:", error);
      }
    }

    // Update Stripe Connect account with actual user ID if account was created
    if (stripeAccountId) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY!);
        await stripe.accounts.update(stripeAccountId, {
          metadata: {
            userId: user.id,
          },
        });
      } catch (error) {
        console.error("Error updating Stripe Connect account metadata:", error);
      }
    }

    // Send verification email
    try {
      const verificationToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token: verificationToken,
          expires: expiresAt,
          userId: user.id,
        },
      });

      const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}`;
      
      await sendEmail({
        to: email,
        subject: "Welcome to INKSPOT! Please verify your email",
        html: `
          <h1>Welcome to INKSPOT!</h1>
          <p>Thank you for creating an account. Please click the link below to verify your email address:</p>
          <a href="${verificationUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email
          </a>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        `,
      });
    } catch (error) {
      console.error("Error sending verification email:", error);
      // Don't fail registration if email fails
    }

    return NextResponse.json({ 
      message: "User created successfully! You can now sign in to your account.",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
        stripeCustomerId: user.stripeCustomerId,
        stripeAccountId: user.stripeAccountId,
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
