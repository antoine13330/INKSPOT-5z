"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  RefreshCw, 
  Settings, 
  Zap, 
  Bug,
  Shield,
  Activity,
  BarChart3,
  FileText,
  Play,
  Pause,
  Stop,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  HelpCircle,
  Edit
} from 'lucide-react'
import { toast } from 'sonner'
import { format, subHours, subDays, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ErrorBoundary } from '@/components/ui/error-boundary'

interface ErrorEvent {
  id: string
  type: 'error' | 'warning' | 'info' | 'critical'
  message: string
  stack?: string
  component?: string
  userId?: string
  sessionId?: string
  timestamp: Date
  resolved: boolean
  autoResolved: boolean
  resolutionTime?: number
  occurrences: number
  lastOccurrence: Date
  environment: 'development' | 'staging' | 'production'
  browser?: string
  os?: string
  device?: string
  metadata?: Record<string, any>
}

interface ErrorStats {
  totalErrors: number
  resolvedErrors: number
  criticalErrors: number
  averageResolutionTime: number
  errorRate: number
  topErrorTypes: Array<{
    type: string
    count: number
    percentage: number
  }>
  errorsByHour: Array<{
    hour: string
    count: number
  }>
  errorsByComponent: Array<{
    component: string
    count: number
    percentage: number
  }>
}

interface AutoResolutionRule {
  id: string
  name: string
  pattern: string
  action: 'retry' | 'fallback' | 'ignore' | 'notify'
  enabled: boolean
  priority: 'low' | 'medium' | 'high'
  conditions: Array<{
    field: string
    operator: 'equals' | 'contains' | 'regex' | 'greater' | 'less'
    value: string | number
  }>
  actions: Array<{
    type: 'retry' | 'fallback' | 'ignore' | 'notify' | 'custom'
    config: Record<string, any>
  }>
}

interface AdvancedErrorMonitoringProps {
  className?: string
}

export function AdvancedErrorMonitoring({
  className = ""
}: AdvancedErrorMonitoringProps) {
  const [errors, setErrors] = useState<ErrorEvent[]>([])
  const [stats, setStats] = useState<ErrorStats | null>(null)
  const [autoResolutionRules, setAutoResolutionRules] = useState<AutoResolutionRule[]>([])
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedError, setSelectedError] = useState<ErrorEvent | null>(null)
  const [showResolved, setShowResolved] = useState(false)
  const [autoResolveEnabled, setAutoResolveEnabled] = useState(true)

  useEffect(() => {
    loadErrorData()
    loadAutoResolutionRules()
    
    if (isMonitoring) {
      const interval = setInterval(loadErrorData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [isMonitoring])

  // Load error data
  const loadErrorData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch errors
      const errorsResponse = await fetch('/api/monitoring/errors')
      if (errorsResponse.ok) {
        const errorsData = await errorsResponse.json()
        setErrors(errorsData.errors || [])
      }
      
      // Fetch stats
      const statsResponse = await fetch('/api/monitoring/error-stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
      
    } catch (error) {
      console.error('Error loading error data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load auto-resolution rules
  const loadAutoResolutionRules = async () => {
    try {
      const response = await fetch('/api/monitoring/auto-resolution-rules')
      if (response.ok) {
        const data = await response.json()
        setAutoResolutionRules(data.rules || [])
      }
    } catch (error) {
      console.error('Error loading auto-resolution rules:', error)
    }
  }

  // Mock data for demonstration
  useEffect(() => {
    if (!stats) {
      setStats({
        totalErrors: 156,
        resolvedErrors: 142,
        criticalErrors: 8,
        averageResolutionTime: 2.5,
        errorRate: 0.8,
        topErrorTypes: [
          { type: 'Network Error', count: 45, percentage: 28.8 },
          { type: 'Validation Error', count: 32, percentage: 20.5 },
          { type: 'Authentication Error', count: 28, percentage: 17.9 },
          { type: 'Database Error', count: 23, percentage: 14.7 },
          { type: 'Component Error', count: 18, percentage: 11.5 }
        ],
        errorsByHour: Array.from({ length: 24 }, (_, i) => ({
          hour: `${i.toString().padStart(2, '0')}:00`,
          count: Math.floor(Math.random() * 10) + 1
        })),
        errorsByComponent: [
          { component: 'AppointmentService', count: 35, percentage: 22.4 },
          { component: 'PaymentService', count: 28, percentage: 17.9 },
          { component: 'ConversationInterface', count: 25, percentage: 16.0 },
          { component: 'UserAuth', count: 22, percentage: 14.1 },
          { component: 'FileUpload', count: 18, percentage: 11.5 }
        ]
      })
    }
  }, [stats])

  // Mock errors data
  useEffect(() => {
    if (errors.length === 0) {
      const mockErrors: ErrorEvent[] = [
        {
          id: '1',
          type: 'critical',
          message: 'Database connection timeout',
          component: 'DatabaseService',
          timestamp: new Date(),
          resolved: false,
          autoResolved: false,
          occurrences: 5,
          lastOccurrence: new Date(),
          environment: 'production',
          browser: 'Chrome 120.0',
          os: 'Windows 11',
          device: 'Desktop'
        },
        {
          id: '2',
          type: 'error',
          message: 'Payment validation failed',
          component: 'PaymentService',
          timestamp: subHours(new Date(), 2),
          resolved: true,
          autoResolved: true,
          resolutionTime: 15,
          occurrences: 3,
          lastOccurrence: subHours(new Date(), 2),
          environment: 'production',
          browser: 'Safari 17.0',
          os: 'macOS 14.0',
          device: 'Mobile'
        },
        {
          id: '3',
          type: 'warning',
          message: 'Slow API response time',
          component: 'AppointmentService',
          timestamp: subHours(new Date(), 4),
          resolved: false,
          autoResolved: false,
          occurrences: 12,
          lastOccurrence: new Date(),
          environment: 'production',
          browser: 'Firefox 121.0',
          os: 'Ubuntu 22.04',
          device: 'Desktop'
        }
      ]
      setErrors(mockErrors)
    }
  }, [errors])

  // Toggle monitoring
  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring)
    toast.success(isMonitoring ? 'Monitoring arrêté' : 'Monitoring démarré')
  }

  // Toggle auto-resolution
  const toggleAutoResolution = () => {
    setAutoResolveEnabled(!autoResolveEnabled)
    toast.success(autoResolveEnabled ? 'Auto-résolution désactivée' : 'Auto-résolution activée')
  }

  // Resolve error
  const resolveError = async (errorId: string) => {
    try {
      const response = await fetch(`/api/monitoring/errors/${errorId}/resolve`, {
        method: 'POST'
      })
      
      if (response.ok) {
        setErrors(prev => prev.map(err => 
          err.id === errorId ? { ...err, resolved: true, resolutionTime: Date.now() - err.timestamp.getTime() } : err
        ))
        toast.success('Erreur résolue')
      }
    } catch (error) {
      toast.error('Erreur lors de la résolution')
    }
  }

  // Delete error
  const deleteError = async (errorId: string) => {
    try {
      const response = await fetch(`/api/monitoring/errors/${errorId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setErrors(prev => prev.filter(err => err.id !== errorId))
        toast.success('Erreur supprimée')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  // Export errors
  const exportErrors = () => {
    const csvContent = [
      ['ID', 'Type', 'Message', 'Component', 'Timestamp', 'Resolved', 'Environment'],
      ...errors.map(err => [
        err.id,
        err.type,
        err.message,
        err.component || '',
        format(err.timestamp, 'yyyy-MM-dd HH:mm:ss'),
        err.resolved ? 'Yes' : 'No',
        err.environment
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `errors-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success('Erreurs exportées')
  }

  // Get error type color
  const getErrorTypeColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'error':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get error type icon
  const getErrorTypeIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircle className="w-4 h-4" />
      case 'error':
        return <AlertTriangle className="w-4 h-4" />
      case 'warning':
        return <AlertCircle className="w-4 h-4" />
      case 'info':
        return <Info className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  // Filter errors
  const filteredErrors = errors.filter(error => 
    showResolved ? true : !error.resolved
  )

  if (isLoading && errors.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin mr-3" />
        <span>Chargement des données d'erreur...</span>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Monitoring Avancé des Erreurs</h1>
            <p className="text-muted-foreground mt-2">
              Surveillance en temps réel et résolution automatique
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant={isMonitoring ? "default" : "outline"}
              onClick={toggleMonitoring}
              size="sm"
            >
              {isMonitoring ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Arrêter
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Démarrer
                </>
              )}
            </Button>
            
            <Button
              variant={autoResolveEnabled ? "default" : "outline"}
              onClick={toggleAutoResolution}
              size="sm"
            >
              <Zap className="w-4 h-4 mr-2" />
              Auto-résolution
            </Button>
            
            <Button variant="outline" onClick={exportErrors} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="errors">Erreurs</TabsTrigger>
            <TabsTrigger value="analytics">Analyses</TabsTrigger>
            <TabsTrigger value="rules">Règles Auto</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Erreurs</p>
                      <p className="text-2xl font-bold">{stats?.totalErrors}</p>
                    </div>
                    <div className="p-2 rounded-full bg-red-100">
                      <Bug className="w-4 h-4 text-red-500" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">{stats?.resolvedErrors} résolues</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Erreurs Critiques</p>
                      <p className="text-2xl font-bold text-red-600">{stats?.criticalErrors}</p>
                    </div>
                    <div className="p-2 rounded-full bg-red-100">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    <Clock className="w-4 h-4 text-blue-500 mr-1" />
                    <span className="text-sm text-blue-600">Nécessitent attention</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Taux d'Erreur</p>
                      <p className="text-2xl font-bold">{stats?.errorRate}%</p>
                    </div>
                    <div className="p-2 rounded-full bg-blue-100">
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">En baisse</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Temps Résolution</p>
                      <p className="text-2xl font-bold">{stats?.averageResolutionTime}h</p>
                    </div>
                    <div className="p-2 rounded-full bg-green-100">
                      <Clock className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">Amélioration</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Error Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Types d'Erreurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.topErrorTypes.map((errorType, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{errorType.type}</span>
                            <span className="text-sm text-muted-foreground">
                              {errorType.count}
                            </span>
                          </div>
                          <Progress value={errorType.percentage} className="h-2" />
                          <div className="text-xs text-muted-foreground mt-1">
                            {errorType.percentage}% du total
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Erreurs par Composant</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.errorsByComponent.map((component, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{component.component}</span>
                            <span className="text-sm text-muted-foreground">
                              {component.count}
                            </span>
                          </div>
                          <Progress value={component.percentage} className="h-2" />
                          <div className="text-xs text-muted-foreground mt-1">
                            {component.percentage}% du total
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Errors Tab */}
          <TabsContent value="errors" className="space-y-6">
            {/* Filters */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showResolved"
                    checked={showResolved}
                    onChange={(e) => setShowResolved(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="showResolved" className="text-sm">
                    Afficher les erreurs résolues
                  </label>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {filteredErrors.length} erreur{filteredErrors.length > 1 ? 's' : ''} affichée{filteredErrors.length > 1 ? 's' : ''}
              </div>
            </div>

            {/* Errors List */}
            <div className="space-y-4">
              {filteredErrors.map((error) => (
                <Card key={error.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <Badge className={getErrorTypeColor(error.type)}>
                            {getErrorTypeIcon(error.type)}
                            <span className="ml-1">{error.type.toUpperCase()}</span>
                          </Badge>
                          
                          {error.resolved && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Résolue
                            </Badge>
                          )}
                          
                          {error.autoResolved && (
                            <Badge variant="outline" className="border-blue-200 text-blue-800">
                              <Zap className="w-3 h-3 mr-1" />
                              Auto-résolue
                            </Badge>
                          )}
                          
                          <Badge variant="outline">
                            {error.environment}
                          </Badge>
                        </div>
                        
                        <h3 className="text-lg font-medium mb-2">{error.message}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
                          <div>
                            <span className="font-medium">Composant:</span> {error.component || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Occurrences:</span> {error.occurrences}
                          </div>
                          <div>
                            <span className="font-medium">Dernière occurrence:</span> {format(error.lastOccurrence, 'dd/MM à HH:mm', { locale: fr })}
                          </div>
                          <div>
                            <span className="font-medium">Navigateur:</span> {error.browser || 'N/A'}
                          </div>
                        </div>
                        
                        {error.resolved && error.resolutionTime && (
                          <div className="text-sm text-green-600 mb-4">
                            ✅ Résolue en {Math.round(error.resolutionTime / 1000 / 60)} minutes
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {!error.resolved && (
                          <Button
                            onClick={() => resolveError(error.id)}
                            size="sm"
                            variant="outline"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Résoudre
                          </Button>
                        )}
                        
                        <Button
                          onClick={() => setSelectedError(error)}
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Détails
                        </Button>
                        
                        <Button
                          onClick={() => deleteError(error.id)}
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Error Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Évolution des Erreurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.errorsByHour.map((hourData, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{hourData.hour}</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={(hourData.count / 10) * 100} className="w-20 h-2" />
                          <span className="text-sm text-muted-foreground w-8 text-right">
                            {hourData.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Resolution Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance de Résolution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {Math.round((stats?.resolvedErrors || 0) / (stats?.totalErrors || 1) * 100)}%
                      </div>
                      <p className="text-sm text-muted-foreground">Taux de résolution</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Erreurs résolues</span>
                        <span>{stats?.resolvedErrors}</span>
                      </div>
                      <Progress value={(stats?.resolvedErrors || 0) / (stats?.totalErrors || 1) * 100} className="h-2" />
                    </div>
                    
                    <div className="text-center text-sm text-muted-foreground">
                      Temps moyen de résolution: {stats?.averageResolutionTime} heures
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className="space-y-6">
            <div className="space-y-4">
              {autoResolutionRules.map((rule) => (
                <Card key={rule.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <Badge variant={rule.enabled ? "default" : "secondary"}>
                            {rule.enabled ? "Activée" : "Désactivée"}
                          </Badge>
                          
                          <Badge variant="outline">
                            Priorité: {rule.priority}
                          </Badge>
                          
                          <Badge variant="outline">
                            {rule.action}
                          </Badge>
                        </div>
                        
                        <h3 className="text-lg font-medium mb-2">{rule.name}</h3>
                        <p className="text-muted-foreground mb-4">Pattern: {rule.pattern}</p>
                        
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium mb-2">Conditions :</p>
                            <ul className="space-y-1">
                              {rule.conditions.map((condition, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground">
                                  {condition.field} {condition.operator} {condition.value}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium mb-2">Actions :</p>
                            <ul className="space-y-1">
                              {rule.actions.map((action, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground">
                                  {action.type} - {JSON.stringify(action.config)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className={rule.enabled ? "text-yellow-600" : "text-green-600"}
                        >
                          {rule.enabled ? (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Activer
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Error Details Modal */}
        {selectedError && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Détails de l'Erreur</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedError(null)}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Message d'erreur</h3>
                    <p className="text-sm bg-muted p-3 rounded">{selectedError.message}</p>
                  </div>
                  
                  {selectedError.stack && (
                    <div>
                      <h3 className="font-medium mb-2">Stack Trace</h3>
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                        {selectedError.stack}
                      </pre>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium mb-2">Informations Système</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Environnement:</span> {selectedError.environment}</div>
                        <div><span className="font-medium">Navigateur:</span> {selectedError.browser || 'N/A'}</div>
                        <div><span className="font-medium">OS:</span> {selectedError.os || 'N/A'}</div>
                        <div><span className="font-medium">Appareil:</span> {selectedError.device || 'N/A'}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Métadonnées</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">ID Session:</span> {selectedError.sessionId || 'N/A'}</div>
                        <div><span className="font-medium">ID Utilisateur:</span> {selectedError.userId || 'N/A'}</div>
                        <div><span className="font-medium">Timestamp:</span> {format(selectedError.timestamp, 'dd/MM/yyyy HH:mm:ss', { locale: fr })}</div>
                        <div><span className="font-medium">Occurrences:</span> {selectedError.occurrences}</div>
                      </div>
                    </div>
                  </div>
                  
                  {selectedError.metadata && (
                    <div>
                      <h3 className="font-medium mb-2">Métadonnées Personnalisées</h3>
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                        {JSON.stringify(selectedError.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
