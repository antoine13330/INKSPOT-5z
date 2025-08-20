import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
export const dynamic = "force-dynamic"

// Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint, keys, deviceInfo } = body

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ 
        error: "Missing required subscription data" 
      }, { status: 400 })
    }

    // Vérifier si l'abonnement existe déjà
    const existingSubscription = await prisma.pushSubscription.findFirst({
      where: {
        userId: session.user.id,
        endpoint: endpoint
      }
    })

    let subscription
    if (existingSubscription) {
      // Mettre à jour l'abonnement existant
      subscription = await prisma.pushSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          p256dh: keys.p256dh,
          auth: keys.auth,
          deviceInfo: deviceInfo || {},
          lastUsed: new Date()
        }
      })
    } else {
      // Créer un nouvel abonnement
      subscription = await prisma.pushSubscription.create({
        data: {
          userId: session.user.id,
          endpoint: endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          deviceInfo: deviceInfo || {},
          lastUsed: new Date()
        }
      })
    }

    // Créer ou mettre à jour les préférences de l'appareil
    await prisma.devicePreferences.upsert({
      where: {
        subscriptionId: subscription.id
      },
      update: {
        enabled: true,
        lastUpdated: new Date()
      },
      create: {
        subscriptionId: subscription.id,
        enabled: true,
        notificationTypes: ['message', 'proposal', 'image', 'collaboration', 'booking']
      }
    })

    return NextResponse.json({ 
      success: true,
      subscriptionId: subscription.id,
      message: "Push subscription created successfully" 
    })
  } catch (error) {
    console.error("Error creating push subscription:", error)
    return NextResponse.json({ 
      error: "Failed to create push subscription" 
    }, { status: 500 })
  }
}

// Get user's push subscriptions
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
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ 
      success: true,
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        endpoint: sub.endpoint,
        deviceInfo: sub.deviceInfo,
        createdAt: sub.createdAt,
        lastUsed: sub.lastUsed,
        preferences: sub.devicePreferences
      }))
    })
  } catch (error) {
    console.error("Error fetching push subscriptions:", error)
    return NextResponse.json({ 
      error: "Failed to fetch push subscriptions" 
    }, { status: 500 })
  }
}

// Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')
    const subscriptionId = searchParams.get('subscriptionId')

    if (!endpoint && !subscriptionId) {
      return NextResponse.json({ 
        error: "Endpoint or subscription ID required" 
      }, { status: 400 })
    }

    let whereClause: any = { userId: session.user.id }
    
    if (subscriptionId) {
      whereClause.id = subscriptionId
    } else if (endpoint) {
      whereClause.endpoint = endpoint
    }

    const deletedSubscriptions = await prisma.pushSubscription.deleteMany({
      where: whereClause
    })

    return NextResponse.json({ 
      success: true,
      deletedCount: deletedSubscriptions.count,
      message: "Push subscription(s) removed successfully" 
    })
  } catch (error) {
    console.error("Error removing push subscription:", error)
    return NextResponse.json({ 
      error: "Failed to remove push subscription" 
    }, { status: 500 })
  }
}

