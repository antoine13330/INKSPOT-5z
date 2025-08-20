import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
export const dynamic = "force-dynamic"

// Update notification preferences for a device
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      subscriptionId, 
      enabled, 
      notificationTypes,
      quietHours,
      vibrate,
      sound 
    } = body

    if (!subscriptionId) {
      return NextResponse.json({ 
        error: "Subscription ID required" 
      }, { status: 400 })
    }

    // Vérifier que l'abonnement appartient à l'utilisateur
    const subscription = await prisma.pushSubscription.findFirst({
      where: {
        id: subscriptionId,
        userId: session.user.id
      }
    })

    if (!subscription) {
      return NextResponse.json({ 
        error: "Subscription not found" 
      }, { status: 404 })
    }

    // Mettre à jour les préférences
    const preferences = await prisma.devicePreferences.upsert({
      where: {
        subscriptionId: subscriptionId
      },
      update: {
        enabled: enabled !== undefined ? enabled : undefined,
        notificationSettings: notificationTypes ? { types: notificationTypes } : undefined,
        updatedAt: new Date()
      },
      create: {
        subscriptionId: subscriptionId,
        userId: session.user.id,
        enabled: enabled !== undefined ? enabled : true,
        notificationSettings: { types: notificationTypes || ['message', 'proposal', 'image', 'collaboration', 'booking'] }
      }
    })

    return NextResponse.json({ 
      success: true,
      preferences: {
        id: preferences.id,
        enabled: preferences.enabled,
        notificationTypes: (preferences.notificationSettings as { types?: string[] })?.types || [],
        updatedAt: preferences.updatedAt
      }
    })
  } catch (error) {
    console.error("Error updating notification preferences:", error)
    return NextResponse.json({ 
      error: "Failed to update notification preferences" 
    }, { status: 500 })
  }
}

// Get notification preferences for user's devices
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: session.user.id },
      include: {
        devicePreferences: true
      }
    })

    const preferences = subscriptions.map(sub => ({
      subscriptionId: sub.id,
      endpoint: sub.endpoint,
      preferences: sub.devicePreferences ? {
        enabled: sub.devicePreferences.enabled,
        notificationTypes: (sub.devicePreferences.notificationSettings as { types?: string[] })?.types || [],
        updatedAt: sub.devicePreferences.updatedAt
      } : null
    }))

    return NextResponse.json({ 
      success: true,
      devices: preferences
    })
  } catch (error) {
    console.error("Error fetching notification preferences:", error)
    return NextResponse.json({ 
      error: "Failed to fetch notification preferences" 
    }, { status: 500 })
  }
}

