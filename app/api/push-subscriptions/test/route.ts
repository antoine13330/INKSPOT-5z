import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendNotificationToUser } from "@/lib/notifications"
export const dynamic = "force-dynamic"

// Test endpoint to send a test notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type = 'test', title, message } = body

    const testNotification = {
      title: title || 'Test Notification',
      body: message || 'Ceci est une notification de test !',
      icon: '/placeholder-logo.png',
      badge: '/placeholder-logo.png',
      tag: 'test-notification',
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data: {
        type: type,
        url: '/',
        priority: 'normal',
        testMessage: true
      }
    }

    const success = await sendNotificationToUser(session.user.id, testNotification)

    if (success) {
      return NextResponse.json({ 
        success: true,
        message: "Test notification sent successfully" 
      })
    } else {
      return NextResponse.json({ 
        success: false,
        message: "Failed to send test notification. Check your push subscriptions." 
      }, { status: 400 })
    }
  } catch (error) {
    console.error("Error sending test notification:", error)
    return NextResponse.json({ 
      error: "Failed to send test notification" 
    }, { status: 500 })
  }
}

