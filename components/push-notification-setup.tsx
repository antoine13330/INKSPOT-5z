"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Bell, BellOff, Settings } from "lucide-react"

interface PushNotificationSetupProps {
  showSettings?: boolean
  autoPrompt?: boolean
}

export function PushNotificationSetup({ 
  showSettings = true, 
  autoPrompt = false 
}: PushNotificationSetupProps) {
  const { data: session } = useSession()
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [subscriptions, setSubscriptions] = useState<any[]>([])

  useEffect(() => {
    // Vérifier le support des notifications
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true)
      setPermission(Notification.permission)
      
      if (session?.user?.id) {
        checkExistingSubscriptions()
        
        // Auto-prompt si demandé et permission pas encore accordée
        if (autoPrompt && Notification.permission === 'default') {
          setTimeout(() => {
            promptForPermission()
          }, 2000) // Attendre 2 secondes pour ne pas être intrusif
        }
      }
    }
  }, [session, autoPrompt])

  const checkExistingSubscriptions = async () => {
    try {
      const response = await fetch('/api/push-subscriptions')
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions || [])
        setIsSubscribed(data.subscriptions?.length > 0)
      }
    } catch (error) {
      console.error('Error checking subscriptions:', error)
    }
  }

  const promptForPermission = async () => {
    if (!isSupported) {
      toast.error("Les notifications push ne sont pas supportées sur ce navigateur")
      return
    }

    setIsLoading(true)
    
    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      
      if (permission === 'granted') {
        await subscribeToPush()
        toast.success("Notifications activées avec succès !")
      } else if (permission === 'denied') {
        toast.error("Permission refusée. Vous pouvez l'activer dans les paramètres du navigateur.")
      }
    } catch (error) {
      console.error('Error requesting permission:', error)
      toast.error("Erreur lors de la demande de permission")
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToPush = async () => {
    try {
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker not supported')
      }

      const registration = await navigator.serviceWorker.ready
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      })

      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: arrayBufferToBase64(subscription.getKey('auth'))
        },
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          timestamp: new Date().toISOString()
        }
      }

      const response = await fetch('/api/push-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscriptionData)
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription')
      }

      setIsSubscribed(true)
      await checkExistingSubscriptions()
      
    } catch (error) {
      console.error('Error subscribing to push:', error)
      throw error
    }
  }

  const unsubscribeFromPush = async () => {
    setIsLoading(true)
    
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        
        if (subscription) {
          await subscription.unsubscribe()
        }
      }

      // Supprimer de la base de données
      const response = await fetch('/api/push-subscriptions', {
        method: 'DELETE'
      })

      if (response.ok) {
        setIsSubscribed(false)
        setSubscriptions([])
        toast.success("Notifications désactivées")
      }
    } catch (error) {
      console.error('Error unsubscribing:', error)
      toast.error("Erreur lors de la désactivation")
    } finally {
      setIsLoading(false)
    }
  }

  const sendTestNotification = async () => {
    try {
      const response = await fetch('/api/push-subscriptions/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'test',
          title: 'Test INKSPOT',
          message: 'Si vous voyez ceci, les notifications fonctionnent parfaitement ! 🎉'
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success("Notification de test envoyée !")
      } else {
        toast.error(data.message || "Erreur lors de l'envoi du test")
      }
    } catch (error) {
      console.error('Error sending test notification:', error)
      toast.error("Erreur lors de l'envoi du test")
    }
  }

  const arrayBufferToBase64 = (buffer: ArrayBuffer | null): string => {
    if (!buffer) return ''
    const bytes = new Uint8Array(buffer)
    const binary = String.fromCharCode.apply(null, Array.from(bytes))
    return btoa(binary)
  }

  if (!session?.user) {
    return null
  }

  if (!isSupported) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notifications non supportées
          </CardTitle>
          <CardDescription>
            Votre navigateur ne supporte pas les notifications push.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications Push
        </CardTitle>
        <CardDescription>
          Recevez des notifications même quand vous n'êtes pas connecté
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              État des notifications
            </p>
            <p className="text-xs text-muted-foreground">
              {permission === 'granted' && isSubscribed ? 'Activées' :
               permission === 'denied' ? 'Refusées' : 'Désactivées'}
            </p>
          </div>
          <Switch
            checked={isSubscribed && permission === 'granted'}
            onCheckedChange={(checked) => {
              if (checked) {
                promptForPermission()
              } else {
                unsubscribeFromPush()
              }
            }}
            disabled={isLoading || permission === 'denied'}
          />
        </div>

        {permission === 'denied' && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
            Les notifications ont été refusées. Vous pouvez les réactiver dans les paramètres de votre navigateur.
          </div>
        )}

        {isSubscribed && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={sendTestNotification}
              className="w-full"
            >
              Envoyer une notification de test
            </Button>
            
            {subscriptions.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {subscriptions.length} appareil{subscriptions.length > 1 ? 's' : ''} connecté{subscriptions.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {showSettings && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              // Ici, on pourrait ouvrir un modal de paramètres plus détaillés
              toast.info("Paramètres avancés bientôt disponibles")
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            Paramètres avancés
          </Button>
        )}

        {!isSubscribed && permission !== 'denied' && (
          <p className="text-xs text-muted-foreground text-center">
            Cliquez sur l'interrupteur pour activer les notifications et être prévenu des nouveaux messages, propositions et images même quand vous n'êtes pas connecté.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

