// Service Worker for PWA functionality and push notifications

const CACHE_NAME = 'inkspot-v1'
const STATIC_CACHE = 'inkspot-static-v1'
const DYNAMIC_CACHE = 'inkspot-dynamic-v1'

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/images/logo.png',
  '/images/placeholder.jpg',
]

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/api/users',
  '/api/posts',
  '/api/bookings',
  '/api/conversations',
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_FILES)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle static files
  if (isStaticFile(url.pathname)) {
    event.respondWith(handleStaticRequest(request))
    return
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request))
    return
  }

  // Handle other requests
  event.respondWith(handleOtherRequest(request))
})

// Handle API requests with cache-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request)
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({ error: 'Offline mode - data not available' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

// Handle static files with cache-first strategy
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    return new Response('Offline - file not available', { status: 503 })
  }
}

// Handle navigation requests with network-first strategy
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const response = await fetch(request)
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page
    return caches.match('/offline')
  }
}

// Handle other requests with stale-while-revalidate strategy
async function handleOtherRequest(request) {
  const cachedResponse = await caches.match(request)
  
  try {
    const response = await fetch(request)
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // Return cached response if available
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response
    return new Response('Offline - resource not available', { status: 503 })
  }
}

// Check if file is static
function isStaticFile(pathname) {
  return STATIC_FILES.includes(pathname) ||
         pathname.startsWith('/images/') ||
         pathname.startsWith('/css/') ||
         pathname.startsWith('/js/') ||
         pathname.startsWith('/fonts/')
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(performBackgroundSync())
  }
})

// Background sync implementation
async function performBackgroundSync() {
  try {
    // Get stored offline actions
    const offlineActions = await getOfflineActions()
    
    for (const action of offlineActions) {
      try {
        await performOfflineAction(action)
        await removeOfflineAction(action.id)
      } catch (error) {
        console.error('Background sync failed for action:', action, error)
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Store offline action
async function storeOfflineAction(action) {
  const db = await openIndexedDB()
  const transaction = db.transaction(['offlineActions'], 'readwrite')
  const store = transaction.objectStore('offlineActions')
  
  action.id = Date.now().toString()
  action.timestamp = new Date().toISOString()
  
  await store.add(action)
}

// Get stored offline actions
async function getOfflineActions() {
  const db = await openIndexedDB()
  const transaction = db.transaction(['offlineActions'], 'readonly')
  const store = transaction.objectStore('offlineActions')
  
  return await store.getAll()
}

// Remove offline action
async function removeOfflineAction(id) {
  const db = await openIndexedDB()
  const transaction = db.transaction(['offlineActions'], 'readwrite')
  const store = transaction.objectStore('offlineActions')
  
  await store.delete(id)
}

// Perform offline action
async function performOfflineAction(action) {
  const response = await fetch(action.url, {
    method: action.method,
    headers: action.headers,
    body: action.body,
  })
  
  if (!response.ok) {
    throw new Error(`Action failed: ${response.status}`)
  }
  
  return response
}

// Open IndexedDB
async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('InkSpotOffline', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      // Create offline actions store
      if (!db.objectStoreNames.contains('offlineActions')) {
        const store = db.createObjectStore('offlineActions', { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from InkSpot',
    icon: '/images/logo.png',
    badge: '/images/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/images/checkmark.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/images/xmark.png',
      },
    ],
  }

  event.waitUntil(
    self.registration.showNotification('InkSpot', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'STORE_OFFLINE_ACTION') {
    event.waitUntil(storeOfflineAction(event.data.action))
  }
})
