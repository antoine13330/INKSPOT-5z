import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToS3, generateFileName } from "@/lib/s3";
export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        location: true,
        website: true,
        phone: true,
        role: true,
        verified: true,
        businessName: true,
        specialties: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (session.user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const username = formData.get("username") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const bio = formData.get("bio") as string;
    const location = formData.get("location") as string;
    const website = formData.get("website") as string;
    const phone = formData.get("phone") as string;
    const avatar = formData.get("avatar") as File | null;

    // Validation
    if (!username?.trim()) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Check if username is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username.trim(),
        id: { not: id },
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

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
        return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
      }
    }

    // Update user
    const updateData: unknown = {
      username: username.trim(),
      firstName: firstName?.trim() || null,
      lastName: lastName?.trim() || null,
      bio: bio?.trim() || null,
      location: location?.trim() || null,
      website: website?.trim() || null,
      phone: phone?.trim() || null,
    };

    if (avatarUrl) {
      updateData.avatar = avatarUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        location: true,
        website: true,
        phone: true,
        role: true,
        verified: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
} 