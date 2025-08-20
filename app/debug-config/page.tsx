"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Settings, Server, Image, Zap } from 'lucide-react'

interface ConfigData {
  success: boolean
  nextConfig: any
  systemInfo: any
  session: any
  message: string
}

export default function DebugConfigPage() {
  const [config, setConfig] = useState<ConfigData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConfig = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/debug/config')
      const data = await response.json()
      setConfig(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="w-8 h-8 animate-spin mr-3" />
          <span>Chargement de la configuration...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900">
          <Settings className="w-8 h-8" />
          Debug Configuration Next.js
        </h1>
        <Button onClick={fetchConfig} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800 font-semibold">Erreur: {error}</p>
          </CardContent>
        </Card>
      )}

      {config && (
        <>
          {/* Configuration des images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Image className="w-5 h-5" />
                Configuration des Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900">Remote Patterns:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {config.nextConfig.images.remotePatterns.map((pattern: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{pattern.protocol}</Badge>
                          <Badge variant="secondary">{pattern.hostname}</Badge>
                        </div>
                        <p className="text-sm text-gray-700">
                          Pathname: {pattern.pathname}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">Unoptimized:</span>
                  <Badge variant={config.nextConfig.images.unoptimized ? "destructive" : "default"}>
                    {config.nextConfig.images.unoptimized ? "Oui" : "Non"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations système */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Server className="w-5 h-5" />
                Informations Système
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Node.js</p>
                  <p className="font-mono text-gray-900">{config.systemInfo.nodeVersion}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Platform</p>
                  <p className="font-mono text-gray-900">{config.systemInfo.platform}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Architecture</p>
                  <p className="font-mono text-gray-900">{config.systemInfo.arch}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Environment</p>
                  <Badge variant="outline">{config.systemInfo.env}</Badge>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">Dernière mise à jour</p>
                <p className="font-mono text-gray-900">{new Date(config.systemInfo.timestamp).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Configuration expérimentale */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Zap className="w-5 h-5" />
                Configuration Expérimentale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm text-gray-900">
                {JSON.stringify(config.nextConfig.experimental, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* État de la session */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">État de l'Authentification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-gray-900">Statut:</span>
                <Badge variant={config.session.authenticated ? "default" : "secondary"}>
                  {config.session.authenticated ? "Connecté" : "Non connecté"}
                </Badge>
              </div>
              {config.session.authenticated && (
                <p className="mt-2 text-sm text-gray-700">
                  Utilisateur: {config.session.user}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
