import webpush from "web-push"
import { prisma } from "./prisma"

// Configure VAPID keys
webpush.setVapidDetails(
  process.env.EMAIL_FROM || "mailto:noreply@yourdomain.com", 
  process.env.VAPID_PUBLIC_KEY!, 
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload,
): Promise<boolean> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return true
  } catch (error) {
    console.error("Error sending push notification:", error)
    return false
  }
}

export async function sendNotificationToUser(userId: string, payload: NotificationPayload) {
  try {
    // Get user's push subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    })

    // Send to all user's devices
    const promises = subscriptions.map((sub) =>
      sendPushNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payload,
      ),
    )

    await Promise.all(promises)
  } catch (error) {
    console.error("Error sending notification to user:", error)
  }
}

export function subscribeToPush(subscription: PushSubscription) {
  if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    throw new Error("Invalid subscription object")
  }

  // Additional validation logic can be added here
  return subscription
}

export async function createNotificationReminder(
  userId: string,
  title: string,
  message: string,
  scheduledFor: Date,
  data?: any,
) {
  // Create notification in database
  const notification = await prisma.notification.create({
    data: {
      title,
      message,
      type: "REMINDER",
      userId,
      data: data || {},
    },
  })

  // Schedule push notification (you might want to use a job queue like Bull or Agenda)
  // For now, we'll just create the notification record
  return notification
}
