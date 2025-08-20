import webpush from "web-push"
import { prisma } from "./prisma"
import { addMinutes, addHours, addDays, isBefore, isAfter, differenceInMinutes } from "date-fns"

// Configure VAPID keys with proper mailto URL format
const vapidSubject = process.env.EMAIL_FROM 
  ? `mailto:${process.env.EMAIL_FROM}` 
  : "mailto:noreply@yourdomain.com"

// Génération automatique des clés VAPID si elles ne sont pas définies
let vapidPublicKey = process.env.VAPID_PUBLIC_KEY
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (!vapidPublicKey || !vapidPrivateKey) {
  // En mode développement ou CI/CD, générer des clés automatiquement
  if (process.env.NODE_ENV === 'development' || process.env.CI === 'true') {
    console.log('🔑 Génération automatique des clés VAPID pour le développement/CI...')
    const generatedKeys = webpush.generateVAPIDKeys()
    vapidPublicKey = generatedKeys.publicKey
    vapidPrivateKey = generatedKeys.privateKey
    
    // Exposer la clé publique pour le client
    if (typeof process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY === 'undefined') {
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = vapidPublicKey
    }
    
    console.log('✅ Clés VAPID générées automatiquement')
  } else {
    console.warn('⚠️  Clés VAPID manquantes. Les notifications push ne fonctionneront pas.')
    console.warn('📋 Ajoutez VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY à votre fichier .env')
    console.warn('🔑 Générez-les avec: node scripts/generate-vapid-keys.js')
  }
}

webpush.setVapidDetails(
  vapidSubject,
  vapidPublicKey || '', 
  vapidPrivateKey || ''
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
  image?: string
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  vibrate?: number[]
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  data?: {
    url?: string
    type?: string
    bookingId?: string
    paymentId?: string
    priority?: 'low' | 'normal' | 'high'
    category?: string
    [key: string]: any
  }
}

export interface SmartReminder {
  id: string
  userId: string
  type: 'booking' | 'payment' | 'follow_up' | 'marketing' | 'system'
  title: string
  message: string
  scheduledFor: Date
  priority: 'low' | 'normal' | 'high'
  category: string
  data?: any
  repeatPattern?: 'once' | 'daily' | 'weekly' | 'monthly'
  maxRetries?: number
  retryCount?: number
  conditions?: {
    userActive?: boolean
    timeOfDay?: { start: string; end: string }
    dayOfWeek?: number[]
    userPreferences?: any
  }
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

    // Get user preferences for notification delivery
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        lastActiveAt: true,
        // notificationPreferences: true // Temporarily commented out due to type mismatch
      }
    })

    // Check if user is active and should receive notifications
    // Temporarily commented out due to type mismatch
    // if (user?.notificationPreferences?.doNotDisturb) {
    //   const now = new Date()
    //   const lastActive = user.lastActiveAt
    //   
    //   // Don't send if user hasn't been active in 24 hours
    //   if (lastActive && isBefore(lastActive, addDays(now, -1))) {
    //     return false
    //   }
    // }

    // Send to all user's devices with smart delivery
    const promises = subscriptions.map(async (sub: any) => {
      // Check device-specific preferences
      const devicePreferences = await prisma.devicePreferences.findUnique({
        where: { subscriptionId: sub.id }
      })

      if (devicePreferences?.enabled === false) {
        return false
      }

      return sendPushNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payload,
      )
    })

    const results = await Promise.all(promises)
    return results.some(result => result === true)
  } catch (error) {
    console.error("Error sending notification to user:", error)
    return false
  }
}

export function subscribeToPush(subscription: PushSubscription) {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      })
    })
  }
}

export async function createNotificationReminder(
  userId: string,
  title: string,
  message: string,
  scheduledFor: Date,
  data?: unknown,
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

// Enhanced booking reminders with smart timing
export async function createSmartBookingReminders(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: true,
        pro: true,
      },
    })

    if (!booking) return

    const startTime = new Date(booking.startTime)
    const now = new Date()

    // Get user preferences for reminder timing
    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId: booking.clientId }
    })

    // Smart reminder intervals based on user behavior and preferences
    const defaultIntervals = [
      { hours: 24, priority: 'normal' },
      { hours: 2, priority: 'high' },
      { minutes: 30, priority: 'high' }
    ]
    
    const reminderIntervals = (userPreferences?.reminderIntervals as any) || defaultIntervals

    // Create smart reminders
    for (const interval of reminderIntervals) {
      const reminderTime = interval.hours 
        ? addHours(startTime, -interval.hours)
        : addMinutes(startTime, -(interval.minutes || 0))

      if (reminderTime > now) {
        await createSmartReminder({
          id: `booking_${bookingId}_${interval.hours || interval.minutes}`,
          userId: booking.clientId,
          type: 'booking',
          title: "Appointment Reminder",
          message: `Your appointment "${booking.title}" is in ${interval.hours ? `${interval.hours} hours` : `${interval.minutes} minutes`}`,
          scheduledFor: reminderTime,
          priority: interval.priority as 'low' | 'normal' | 'high',
          category: 'appointment',
          data: {
            bookingId: booking.id,
            type: 'booking_reminder',
            interval: interval,
            actionUrl: `/bookings/${booking.id}`,
            quickActions: [
              { action: 'confirm', label: 'Confirm' },
              { action: 'reschedule', label: 'Reschedule' },
              { action: 'cancel', label: 'Cancel' }
            ]
          }
        })
      }
    }

    // Create professional reminder
    const proReminderTime = addHours(startTime, -1)
    if (proReminderTime > now) {
      await createSmartReminder({
        id: `pro_booking_${bookingId}`,
        userId: booking.proId,
        type: 'booking',
        title: "Upcoming Appointment",
        message: `You have an appointment "${booking.title}" with ${booking.client.username} in 1 hour`,
        scheduledFor: proReminderTime,
        priority: 'high',
        category: 'professional',
        data: {
          bookingId: booking.id,
          type: 'pro_booking_reminder',
          actionUrl: `/pro/bookings/${booking.id}`,
          quickActions: [
            { action: 'prepare', label: 'Prepare' },
            { action: 'contact_client', label: 'Contact Client' }
          ]
        }
      })
    }

    // Create follow-up reminder for after appointment
    const followUpTime = addHours(startTime, 2)
    await createSmartReminder({
      id: `followup_${bookingId}`,
      userId: booking.clientId,
      type: 'follow_up',
      title: "How was your appointment?",
      message: `We hope your appointment "${booking.title}" went well. Please leave a review!`,
      scheduledFor: followUpTime,
      priority: 'normal',
      category: 'feedback',
      data: {
        bookingId: booking.id,
        type: 'follow_up_reminder',
        actionUrl: `/bookings/${booking.id}/review`,
        quickActions: [
          { action: 'review', label: 'Leave Review' },
          { action: 'book_again', label: 'Book Again' }
        ]
      }
    })

  } catch (error) {
    console.error("Error creating smart booking reminders:", error)
  }
}

// Enhanced payment reminders with smart escalation
export async function createSmartPaymentReminders(paymentId: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: true,
        sender: true,
      },
    })

    if (!payment || payment.status === 'COMPLETED') return

    const dueDate = new Date(payment.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from creation
    const now = new Date()

    if (dueDate > now) {
      // Create escalating payment reminders
      const reminderSchedule = [
        { days: 3, priority: 'normal', message: 'Payment due soon' },
        { days: 1, priority: 'high', message: 'Payment due tomorrow' },
        { hours: 6, priority: 'high', message: 'Payment due in 6 hours' },
        { hours: 1, priority: 'high', message: 'Payment due in 1 hour' }
      ]

      for (const reminder of reminderSchedule) {
        const reminderTime = reminder.days 
          ? addDays(dueDate, -reminder.days)
          : addHours(dueDate, -(reminder.hours || 0))

        if (reminderTime > now) {
          await createSmartReminder({
            id: `payment_${paymentId}_${reminder.days || reminder.hours}`,
            userId: payment.senderId,
            type: 'payment',
            title: "Payment Reminder",
            message: `${reminder.message} for ${payment.amount} ${payment.currency}`,
            scheduledFor: reminderTime,
            priority: reminder.priority as 'normal' | 'high',
            category: 'payment',
            data: {
              paymentId: payment.id,
              type: 'payment_reminder',
              amount: payment.amount,
              currency: payment.currency,
              dueDate: dueDate,
              actionUrl: `/payments/${payment.id}`,
              quickActions: [
                { action: 'pay_now', label: 'Pay Now' },
                { action: 'contact_support', label: 'Need Help?' }
              ]
            }
          })
        }
      }
    }
  } catch (error) {
    console.error("Error creating smart payment reminders:", error)
  }
}

// Smart reminder system with intelligent scheduling
export async function createSmartReminder(reminder: SmartReminder) {
  try {
    // Check if user should receive this reminder based on conditions
    if (reminder.conditions) {
      const shouldSend = await checkReminderConditions(reminder.userId, reminder.conditions)
      if (!shouldSend) return null
    }

    // Create the reminder in database
    const smartReminder = await prisma.smartReminder.create({
      data: {
        id: reminder.id,
        userId: reminder.userId,
        type: reminder.type,
        title: reminder.title,
        message: reminder.message,
        scheduledFor: reminder.scheduledFor,
        priority: reminder.priority,
        category: reminder.category,
        data: reminder.data || {},
        repeatPattern: reminder.repeatPattern,
        maxRetries: reminder.maxRetries || 3,
        retryCount: 0,
        conditions: reminder.conditions || {}
      }
    })

    // Schedule the actual notification delivery
    await scheduleNotificationDelivery(smartReminder)

    return smartReminder
  } catch (error) {
    console.error("Error creating smart reminder:", error)
  }
}

// Check if reminder conditions are met
async function checkReminderConditions(userId: string, conditions: any): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        lastActiveAt: true,
        // notificationPreferences: true, // Temporarily commented out due to type mismatch
        timezone: true
      }
    })

    if (!user) return false

    // Check time of day conditions
    if (conditions.timeOfDay) {
      const now = new Date()
      const userTime = new Date(now.toLocaleString("en-US", { timeZone: user.timezone || 'UTC' }))
      const currentHour = userTime.getHours()
      const startHour = parseInt(conditions.timeOfDay.start.split(':')[0])
      const endHour = parseInt(conditions.timeOfDay.end.split(':')[0])
      
      if (currentHour < startHour || currentHour > endHour) {
        return false
      }
    }

    // Check day of week conditions
    if (conditions.dayOfWeek) {
      const now = new Date()
      const dayOfWeek = now.getDay()
      if (!conditions.dayOfWeek.includes(dayOfWeek)) {
        return false
      }
    }

    // Check user activity conditions
    if (conditions.userActive && user.lastActiveAt) {
      const hoursSinceActive = differenceInMinutes(new Date(), user.lastActiveAt) / 60
      if (hoursSinceActive > 24) {
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Error checking reminder conditions:", error)
    return true // Default to allowing the reminder
  }
}

// Schedule notification delivery
async function scheduleNotificationDelivery(reminder: any) {
  try {
    // This would integrate with a job queue system like Bull or Agenda
    // For now, we'll create a scheduled task record
    await prisma.scheduledTask.create({
      data: {
        type: 'NOTIFICATION_DELIVERY',
        scheduledFor: reminder.scheduledFor,
        data: {
          reminderId: reminder.id,
          userId: reminder.userId,
          type: reminder.type,
          title: reminder.title,
          message: reminder.message,
          priority: reminder.priority,
          category: reminder.category,
          data: reminder.data
        },
        status: 'PENDING'
      }
    })
  } catch (error) {
    console.error("Error scheduling notification delivery:", error)
  }
}

// System notifications for important events
export async function createSystemNotification(
  userId: string,
  title: string,
  message: string,
  data?: any,
  priority: 'low' | 'normal' | 'high' = 'normal'
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: "SYSTEM",
        userId,
        data: data || {},
        priority,
        category: 'system'
      },
    })

    // Send push notification if user has subscriptions
    await sendNotificationToUser(userId, {
      title,
      body: message,
      data: {
        ...data,
        notificationId: notification.id,
        type: 'system',
        priority
      },
      requireInteraction: priority === 'high',
      tag: 'system-notification'
    })

    return notification
  } catch (error) {
    console.error("Error creating system notification:", error)
  }
}

// Batch notification sending for better performance
export async function sendBatchNotifications(
  notifications: Array<{ userId: string; payload: NotificationPayload }>
) {
  try {
    // Group notifications by user for efficient delivery
    const userNotifications = new Map<string, NotificationPayload[]>()
    
    notifications.forEach(({ userId, payload }) => {
      if (!userNotifications.has(userId)) {
        userNotifications.set(userId, [])
      }
      userNotifications.get(userId)!.push(payload)
    })

    // Send notifications to each user
    const results = await Promise.allSettled(
      Array.from(userNotifications.entries()).map(async ([userId, payloads]) => {
        // Merge multiple notifications into one if possible
        if (payloads.length === 1) {
          return sendNotificationToUser(userId, payloads[0])
        } else {
          // Create a summary notification for multiple items
          const summaryPayload: NotificationPayload = {
            title: `You have ${payloads.length} new notifications`,
            body: payloads.map(p => p.title).join(', '),
            data: {
              type: 'batch_notification',
              count: payloads.length,
              notifications: payloads,
              priority: 'normal'
            }
          }
          return sendNotificationToUser(userId, summaryPayload)
        }
      })
    )

    return results
  } catch (error) {
    console.error("Error sending batch notifications:", error)
  }
}

// Notification analytics and insights
export async function getNotificationAnalytics(userId: string, timeRange: '7d' | '30d' | '90d' = '30d') {
  try {
    const startDate = new Date()
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      select: {
        type: true,
        read: true,
        createdAt: true,
        category: true,
        priority: true
      }
    })

    const analytics = {
      total: notifications.length,
      read: notifications.filter((n: any) => n.read).length,
      unread: notifications.filter((n: any) => !n.read).length,
      byType: notifications.reduce((acc: Record<string, number>, n: any) => {
        acc[n.type] = (acc[n.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byCategory: notifications.reduce((acc: Record<string, number>, n: any) => {
        acc[n.category || 'general'] = (acc[n.category || 'general'] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byPriority: notifications.reduce((acc: Record<string, number>, n: any) => {
        acc[n.priority || 'normal'] = (acc[n.priority || 'normal'] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      readRate: notifications.length > 0 ? 
        (notifications.filter((n: any) => n.read).length / notifications.length) * 100 : 0
    }

    return analytics
  } catch (error) {
    console.error("Error getting notification analytics:", error)
    return null
  }
}
