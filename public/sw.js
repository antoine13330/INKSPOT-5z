// Service Worker for PWA functionality and push notifications
// ACCESSIBILITY: Enhanced for hearing-impaired users

const CACHE_NAME = "social-media-pro-v1"
const urlsToCache = [
  "/",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
]

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    }),
  )
})

// Fetch event
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request)
    }),
  )
})

// Push event
self.addEventListener("push", (event) => {
  const options = {
    body: "Default notification body",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    vibrate: [100, 50, 100],
    // ACCESSIBILITY: Visual alternatives for vibration
    silent: false, // Ensure screen readers can access
    requireInteraction: true, // Keep notification visible longer for deaf users
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      // ACCESSIBILITY: Add visual indicator data
      isImportant: false,
      hasVisualIndicator: true,
    },
    actions: [
      {
        action: "explore",
        title: "View",
        icon: "/icon-192x192.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icon-192x192.png",
      },
    ],
    // ACCESSIBILITY: Add visual emphasis for important notifications
    tag: "default", // Will be overridden if data contains specific tag
  }

  if (event.data) {
    const data = event.data.json()
    options.body = data.body || options.body
    options.title = data.title || "Social Media Pro"
    options.icon = data.icon || options.icon
    options.data = { ...options.data, ...data.data }
    
    // ACCESSIBILITY: Handle different notification priorities with visual cues
    if (data.priority === "high") {
      options.requireInteraction = true
      options.tag = "high-priority"
      options.data.isImportant = true
    }
    
    // ACCESSIBILITY: Add visual indicator emoji for sound-related notifications
    if (data.type === "message") {
      options.title = "💬 " + (options.title || "New Message")
    } else if (data.type === "booking") {
      options.title = "📅 " + (options.title || "Booking Update")
    } else if (data.type === "payment") {
      options.title = "💳 " + (options.title || "Payment Update")
    }
  }

  event.waitUntil(self.registration.showNotification(options.title || "Social Media Pro", options))
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "explore") {
    // Open the app
    event.waitUntil(clients.openWindow("/"))
  } else if (event.action === "close") {
    // Just close the notification
    return
  } else {
    // Default action - open the app
    event.waitUntil(clients.openWindow("/"))
  }
})

// Background sync
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync())
  }
})

function doBackgroundSync() {
  // Implement background sync logic
  // For example, sync offline messages, posts, etc.
  return fetch("/api/sync")
    .then((response) => response.json())
    .then((data) => {
      console.log("Background sync completed:", data)
    })
    .catch((error) => {
      console.error("Background sync failed:", error)
    })
}
