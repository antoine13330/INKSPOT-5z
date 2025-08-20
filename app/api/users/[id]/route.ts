import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToS3, generateFileName } from "@/lib/s3";
export const dynamic = "force-dynamic"

// Type for user update data
interface UserUpdateData {
  username: string
  firstName: string | null
  lastName: string | null
  bio: string | null
  location: string | null
  website: string | null
  phone: string | null
  avatar?: string
  businessName?: string
  hourlyRate?: number
  specialties?: string[]
  profileTheme?: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    backgroundColor: string
    textColor: string
    fontFamily: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Rechercher par id OU par username
    const userRecord = await prisma.user.findFirst({
      where: {
        OR: [{ id }, { username: id }],
      },
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
        hourlyRate: true,
        profileTheme: true,
        createdAt: true,
        profileViews: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!userRecord) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Adapter la forme de réponse attendue par la page profil
    const user = {
      id: userRecord.id,
      email: userRecord.email,
      username: userRecord.username,
      firstName: userRecord.firstName ?? "",
      lastName: userRecord.lastName ?? "",
      avatar: userRecord.avatar ?? undefined,
      bio: userRecord.bio ?? undefined,
      location: userRecord.location ?? undefined,
      website: userRecord.website ?? undefined,
      phone: userRecord.phone ?? undefined,
      role: userRecord.role,
      verified: userRecord.verified,
      businessName: userRecord.businessName ?? undefined,
      specialties: userRecord.specialties,
      hourlyRate: userRecord.hourlyRate,
      profileTheme: userRecord.profileTheme,
      createdAt: userRecord.createdAt,
      profileViews: userRecord.profileViews,
      postsCount: userRecord._count.posts,
      followersCount: userRecord._count.followers,
      followingCount: userRecord._count.following,
    };

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (session.user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const contentType = request.headers.get("content-type");
    let updateData: Partial<UserUpdateData> = {};

    if (contentType?.includes("application/json")) {
      // Handle JSON data (from customize profile)
      const jsonData = await request.json();
      updateData = {
        username: jsonData.username,
        firstName: jsonData.firstName,
        lastName: jsonData.lastName,
        bio: jsonData.bio,
        location: jsonData.location,
        website: jsonData.website,
        phone: jsonData.phone,
        businessName: jsonData.businessName,
        hourlyRate: jsonData.hourlyRate,
        specialties: jsonData.specialties,
        profileTheme: jsonData.profileTheme,
      };
    } else {
      // Handle FormData (from basic profile edit)
      const formData = await request.formData();
      updateData = {
        username: formData.get("username") as string,
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        bio: formData.get("bio") as string,
        location: formData.get("location") as string,
        website: formData.get("website") as string,
        phone: formData.get("phone") as string,
      };

      const avatar = formData.get("avatar") as File | null;
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
          
          const avatarUrl = await uploadToS3(buffer, fileName, avatar.type);
          updateData.avatar = avatarUrl;
        } catch (error) {
          console.error("Error uploading avatar:", error);
          return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
        }
      }
    }

    // Validation
    if (!updateData.username?.trim()) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Check if username is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        username: updateData.username.trim(),
        id: { not: id },
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    // Prepare data for database update
    const dbUpdateData: any = {
      username: updateData.username.trim(),
      firstName: updateData.firstName?.trim() || null,
      lastName: updateData.lastName?.trim() || null,
      bio: updateData.bio?.trim() || null,
      location: updateData.location?.trim() || null,
      website: updateData.website?.trim() || null,
      phone: updateData.phone?.trim() || null,
    };

    // Add optional fields if they exist
    if (updateData.businessName !== undefined) {
      dbUpdateData.businessName = updateData.businessName?.trim() || null;
    }
    if (updateData.hourlyRate !== undefined) {
      dbUpdateData.hourlyRate = updateData.hourlyRate;
    }
    if (updateData.specialties !== undefined) {
      dbUpdateData.specialties = updateData.specialties;
    }
    if (updateData.profileTheme !== undefined) {
      dbUpdateData.profileTheme = updateData.profileTheme;
    }
    if (updateData.avatar) {
      dbUpdateData.avatar = updateData.avatar;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dbUpdateData,
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
        hourlyRate: true,
        profileTheme: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Profile updated successfully",
      user: updatedUser 
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to update user",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 