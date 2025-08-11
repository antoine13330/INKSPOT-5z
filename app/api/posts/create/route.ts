import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToS3, generateFileName } from "@/lib/s3";
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is an artist (PRO role)
    if (session.user.role !== "PRO") {
      return NextResponse.json({ error: "Only artists can create posts" }, { status: 403 });
    }

    const formData = await request.formData();
    const content = formData.get("content") as string;
    const hashtagsJson = formData.get("hashtags") as string;
    const price = formData.get("price") as string;
    const isCollaboration = formData.get("isCollaboration") as string;
    const images = formData.getAll("images") as File[];

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    if (!images || images.length === 0) {
      return NextResponse.json({ error: "At least one image is required" }, { status: 400 });
    }
    if (images.length > 5) {
      return NextResponse.json({ error: "Maximum 5 images allowed" }, { status: 400 });
    }

    let hashtags: string[] = [];
    try {
      hashtags = JSON.parse(hashtagsJson || "[]");
    } catch (error) {
      console.error("Error parsing hashtags:", error);
      hashtags = [];
    }

    // Upload images to S3
    const imageUrls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      if (!image.type.startsWith("image/")) {
        return NextResponse.json({ error: "Invalid file type. Only images are allowed." }, { status: 400 });
      }
      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Image size too large. Maximum 5MB per image." }, { status: 400 });
      }

      const fileName = generateFileName(image.name, session.user.id);
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      try {
        const s3Url = await uploadToS3(buffer, fileName, image.type);
        imageUrls.push(s3Url);
      } catch (error) {
        console.error("Error uploading to S3:", error);
        return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
      }
    }

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        hashtags: hashtags,
        images: imageUrls,
        price: price ? parseFloat(price) : null,
        isCollaboration: isCollaboration === "true",
        authorId: session.user.id,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true, username: true, businessName: true, avatar: true,
          },
        },
      },
    });

    return NextResponse.json({ message: "Post created successfully", post });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
} 