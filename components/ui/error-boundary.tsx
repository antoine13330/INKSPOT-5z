"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

// ============================================================================
// INTERFACES
// ============================================================================

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetOnPropsChange?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log l'erreur (removed console.error for production)
    
    // Mettre à jour l'état
    this.setState({
      error,
      errorInfo,
      errorId: this.generateErrorId()
    })

    // Appeler le callback onError si fourni
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Envoyer l'erreur à un service de monitoring (optionnel)
    this.reportError(error, errorInfo)
  }

  componentDidUpdate(prevProps: Props) {
    // Reset l'erreur si les props changent et que resetOnPropsChange est true
    if (this.props.resetOnPropsChange && prevProps !== this.props) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null
      })
    }
  }

  // ========================================================================
  // MÉTHODES UTILITAIRES
  // ========================================================================
  
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // Ici vous pouvez envoyer l'erreur à un service comme Sentry, LogRocket, etc.
    try {
      // Exemple avec commentaires (removed console statements for production)
      // Error: ${error}
      // Component Stack: ${errorInfo.componentStack}
      // Timestamp: ${new Date().toISOString()}
      // User Agent: ${navigator.userAgent}
      // URL: ${window.location.href}
    } catch (reportError) {
      // Failed to report error (removed console.error for production)
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private handleGoBack = () => {
    window.history.back()
  }

  // ========================================================================
  // RENDU
  // ========================================================================
  
  render() {
    if (this.state.hasError) {
      // Afficher le fallback personnalisé si fourni
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Afficher l'interface d'erreur par défaut
      return <ErrorFallback 
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        errorId={this.state.errorId}
        onReset={this.handleReset}
        onGoHome={this.handleGoHome}
        onGoBack={this.handleGoBack}
      />
    }

    return this.props.children
  }
}

// ============================================================================
// COMPOSANT DE FALLBACK
// ============================================================================

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
  onReset: () => void
  onGoHome: () => void
  onGoBack: () => void
}

function ErrorFallback({ 
  error, 
  errorInfo, 
  errorId, 
  onReset, 
  onGoHome, 
  onGoBack 
}: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">
            Oups ! Quelque chose s'est mal passé
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Message d'erreur */}
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              Une erreur inattendue s'est produite. Notre équipe a été notifiée.
            </p>
            {errorId && (
              <p className="text-sm text-gray-500">
                ID d'erreur: <code className="bg-gray-100 px-2 py-1 rounded">{errorId}</code>
              </p>
            )}
          </div>

          {/* Détails techniques (développement uniquement) */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="bg-gray-50 p-4 rounded-lg">
              <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                Détails techniques (développement)
              </summary>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Message:</strong>
                  <pre className="bg-white p-2 rounded mt-1 overflow-auto text-red-600">
                    {error.message}
                  </pre>
                </div>
                {errorInfo && (
                  <div>
                    <strong>Stack:</strong>
                    <pre className="bg-white p-2 rounded mt-1 overflow-auto text-xs">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={onReset} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </Button>
            
            <Button onClick={onGoBack} variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
            
            <Button onClick={onGoHome} className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Accueil
            </Button>
          </div>

          {/* Informations de contact */}
          <div className="text-center text-sm text-gray-500 border-t pt-4">
            <p>
              Si le problème persiste, contactez notre support technique.
            </p>
            <p className="mt-1">
              <a 
                href="mailto:support@inkspot.com" 
                className="text-blue-600 hover:underline"
              >
                support@inkspot.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// HOOK POUR GÉRER LES ERREURS DANS LES COMPOSANTS FONCTIONNELS
// ============================================================================

export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  const ErrorDisplay = React.useCallback(() => {
    if (!error) return null

    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-red-800 mb-2">
                Une erreur s'est produite
              </h4>
              <p className="text-red-700 text-sm mb-3">
                {error.message}
              </p>
              <Button 
                onClick={clearError} 
                size="sm" 
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-100"
              >
                Fermer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }, [error, clearError])

  return {
    error,
    handleError,
    clearError,
    ErrorDisplay
  }
}

// ============================================================================
// COMPOSANT WRAPPER POUR LES PAGES
// ============================================================================

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// ============================================================================
// COMPOSANT POUR LES ERREURS DE RÉSEAU
// ============================================================================

interface NetworkErrorProps {
  error: Error
  onRetry: () => void
  onGoBack?: () => void
}

export function NetworkError({ error, onRetry, onGoBack }: NetworkErrorProps) {
  const isNetworkError = error.message.includes('fetch') || 
                        error.message.includes('network') ||
                        error.message.includes('Failed to fetch')

  if (!isNetworkError) return null

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-yellow-800 mb-2">
              Problème de connexion
            </h4>
            <p className="text-yellow-700 text-sm mb-3">
              Impossible de se connecter au serveur. Vérifiez votre connexion internet.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={onRetry} 
                size="sm" 
                variant="outline"
                className="text-yellow-600 border-yellow-600 hover:bg-yellow-100"
              >
                Réessayer
              </Button>
              {onGoBack && (
                <Button 
                  onClick={onGoBack} 
                  size="sm" 
                  variant="ghost"
                  className="text-yellow-600 hover:bg-yellow-100"
                >
                  Retour
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
