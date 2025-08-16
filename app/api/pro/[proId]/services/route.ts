import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ proId: string }> }
) {
  const { proId } = await params
  try {
    // Récupérer les services du PRO
    const services = await prisma.service.findMany({
      where: {
        proId: proId,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        type: true,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      services: services.map((service: any) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
        type: service.type,
      })),
    })

  } catch (error) {
    console.error("Error fetching PRO services:", error)
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
  }
}
