// Service Worker for PWA functionality and push notifications

const CACHE_NAME = 'inkspot-v1.0.0'
const STATIC_CACHE = 'static-v1'
const DYNAMIC_CACHE = 'dynamic-v1'
const API_CACHE = 'api-v1'

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/_next/static/css/app.css',
  '/_next/static/js/app.js'
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== API_CACHE) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - cache with network-first strategy
    event.respondWith(handleApiRequest(request))
  } else if (url.pathname.startsWith('/_next/static/')) {
    // Static assets - cache-first strategy
    event.respondWith(handleStaticRequest(request))
  } else if (url.pathname.startsWith('/')) {
    // Page requests - network-first strategy
    event.respondWith(handlePageRequest(request))
  }
})

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({ error: 'Offline - API unavailable' }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    return new Response('Offline - Static file unavailable', { status: 503 })
  }
}

// Handle page requests with network-first strategy
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page
    return caches.match('/offline.html')
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  try {
    // Get pending actions from IndexedDB
    const pendingActions = await getPendingActions()
    
    for (const action of pendingActions) {
      try {
        await processPendingAction(action)
        await removePendingAction(action.id)
      } catch (error) {
        console.error('Failed to process pending action:', error)
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  try {
    let notificationData = {}
    
    if (event.data) {
      try {
        notificationData = event.data.json()
      } catch (error) {
        // Fallback to text if JSON parsing fails
        notificationData = {
          title: 'INKSPOT',
          body: event.data.text() || 'New notification',
          data: { type: 'general' }
        }
      }
    }

    const {
      title = 'INKSPOT',
      body = 'New notification',
      icon = '/placeholder-logo.png',
      badge = '/placeholder-logo.png',
      image,
      tag,
      requireInteraction = false,
      silent = false,
      vibrate = [200, 100, 200],
      actions = [],
      data = {}
    } = notificationData

    // Créer les actions spécifiques selon le type de notification
    let notificationActions = actions
    if (!notificationActions || notificationActions.length === 0) {
      notificationActions = getDefaultActionsForType(data.type)
    }

    const options = {
      body,
      icon,
      badge,
      image,
      tag: tag || `inkspot-${data.type || 'general'}-${Date.now()}`,
      requireInteraction,
      silent,
      vibrate,
      data: {
        ...data,
        dateOfArrival: Date.now(),
        clickUrl: data.url || '/'
      },
      actions: notificationActions
    }
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    )
  } catch (error) {
    console.error('Error handling push notification:', error)
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('INKSPOT', {
        body: 'You have a new notification',
        icon: '/placeholder-logo.png',
        badge: '/placeholder-logo.png',
        data: { clickUrl: '/' }
      })
    )
  }
})

// Fonction pour obtenir les actions par défaut selon le type
function getDefaultActionsForType(type) {
  switch (type) {
    case 'message':
      return [
        {
          action: 'reply',
          title: 'Répondre',
          icon: '/placeholder-logo.png'
        },
        {
          action: 'view',
          title: 'Voir',
          icon: '/placeholder-logo.png'
        }
      ]
    
    case 'proposal':
    case 'booking':
      return [
        {
          action: 'accept',
          title: 'Accepter',
          icon: '/placeholder-logo.png'
        },
        {
          action: 'view',
          title: 'Voir détails',
          icon: '/placeholder-logo.png'
        }
      ]
    
    case 'image':
      return [
        {
          action: 'view',
          title: 'Voir l\'image',
          icon: '/placeholder-logo.png'
        },
        {
          action: 'like',
          title: 'J\'aime',
          icon: '/placeholder-logo.png'
        }
      ]
    
    case 'collaboration':
      return [
        {
          action: 'accept',
          title: 'Accepter',
          icon: '/placeholder-logo.png'
        },
        {
          action: 'view',
          title: 'Voir détails',
          icon: '/placeholder-logo.png'
        }
      ]
    
    default:
      return [
        {
          action: 'view',
          title: 'Voir',
          icon: '/placeholder-logo.png'
        },
        {
          action: 'dismiss',
          title: 'Ignorer',
          icon: '/placeholder-logo.png'
        }
      ]
  }
}

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const notificationData = event.notification.data || {}
  const action = event.action
  const type = notificationData.type || 'general'
  
  let targetUrl = notificationData.clickUrl || '/'
  
  // Gérer les différentes actions
  if (action) {
    switch (action) {
      case 'reply':
        // Ouvrir la conversation pour répondre
        if (notificationData.conversationId) {
          targetUrl = `/conversations/${notificationData.conversationId}`
        }
        break
        
      case 'view':
        // Utiliser l'URL spécifique selon le type
        if (notificationData.url) {
          targetUrl = notificationData.url
        }
        break
        
      case 'accept':
        // Rediriger vers la page d'acceptation selon le type
        if (type === 'proposal' || type === 'booking') {
          targetUrl = notificationData.url || `/bookings/${notificationData.proposalId}`
        } else if (type === 'collaboration') {
          targetUrl = notificationData.url || `/collaborations/${notificationData.collaborationId}`
        }
        break
        
      case 'like':
        // Pour les images, aller au post et déclencher un like
        if (notificationData.postId) {
          targetUrl = `/posts/${notificationData.postId}`
          // Ici on pourrait ajouter un paramètre pour auto-liker
          targetUrl += '?autoLike=true'
        }
        break
        
      case 'dismiss':
        // Ne rien faire, juste fermer
        return
        
      default:
        // Action par défaut : utiliser l'URL fournie
        break
    }
  }
  
  // Ouvrir la fenêtre ou focuser sur l'onglet existant
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Vérifier si une fenêtre avec cette URL est déjà ouverte
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus()
          }
        }
        
        // Sinon, ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      })
      .catch(error => {
        console.error('Error handling notification click:', error)
        // Fallback : essayer d'ouvrir la page d'accueil
        return clients.openWindow('/')
      })
  )
})

// Helper functions for background sync
async function getPendingActions() {
  // This would typically use IndexedDB
  // For now, return empty array
  return []
}

async function processPendingAction(action) {
  // Process different types of pending actions
  switch (action.type) {
    case 'booking':
      return await processBooking(action.data)
    case 'payment':
      return await processPayment(action.data)
    case 'message':
      return await processMessage(action.data)
    default:
      throw new Error(`Unknown action type: ${action.type}`)
  }
}

async function processBooking(bookingData) {
  // Process offline booking
  const response = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData)
  })
  
  if (!response.ok) {
    throw new Error('Failed to process booking')
  }
  
  return response.json()
}

async function processPayment(paymentData) {
  // Process offline payment
  const response = await fetch('/api/payments/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData)
  })
  
  if (!response.ok) {
    throw new Error('Failed to process payment')
  }
  
  return response.json()
}

async function processMessage(messageData) {
  // Process offline message
  const response = await fetch('/api/conversations/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messageData)
  })
  
  if (!response.ok) {
    throw new Error('Failed to process message')
  }
  
  return response.json()
}

async function removePendingAction(actionId) {
  // Remove processed action from IndexedDB
  // For now, just log
  console.log('Removed pending action:', actionId)
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(event.data.urls)
      })
    )
  }
})
