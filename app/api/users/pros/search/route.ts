import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query.trim()) {
      return NextResponse.json({ pros: [] });
    }

    const pros = await prisma.user.findMany({
      where: {
        AND: [
          { role: "PRO" },
          {
            OR: [
              { username: { contains: query, mode: "insensitive" } },
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { businessName: { contains: query, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        businessName: true,
        avatar: true,
        specialties: true,
      },
      take: limit,
      orderBy: [
        { businessName: "asc" },
        { username: "asc" },
      ],
    });

    return NextResponse.json({ pros });
  } catch (error) {
    console.error("Error searching pros:", error);
    return NextResponse.json({ error: "Failed to search pros" }, { status: 500 });
  }
} 