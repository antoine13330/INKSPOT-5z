"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  DollarSign, 
  Star, 
  Clock, 
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Zap,
  Target,
  Award,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Settings,
  Bell,
  MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'
import { format, subDays, subWeeks, subMonths, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ErrorBoundary } from '@/components/ui/error-boundary'

interface DashboardMetrics {
  totalEarnings: number
  monthlyEarnings: number
  weeklyEarnings: number
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  averageRating: number
  totalReviews: number
  newClients: number
  repeatClients: number
  averageSessionDuration: number
  topServices: Array<{
    name: string
    count: number
    revenue: number
    growth: number
  }>
  recentActivity: Array<{
    type: 'appointment' | 'payment' | 'review' | 'client'
    title: string
    description: string
    timestamp: Date
    status: 'success' | 'warning' | 'error'
  }>
}

interface Prediction {
  type: 'revenue' | 'clients' | 'appointments' | 'rating'
  value: number
  trend: 'up' | 'down' | 'stable'
  confidence: number
  factors: string[]
}

interface Recommendation {
  type: 'optimization' | 'growth' | 'efficiency' | 'quality'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  actions: string[]
}

interface IntelligentProDashboardProps {
  proId: string
  className?: string
}

export function IntelligentProDashboard({
  proId,
  className = ""
}: IntelligentProDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month')

  useEffect(() => {
    loadDashboardData()
  }, [proId, timeRange])

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch metrics
      const metricsResponse = await fetch(`/api/pro/${proId}/dashboard/metrics?range=${timeRange}`)
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setMetrics(metricsData)
      }
      
      // Fetch predictions
      const predictionsResponse = await fetch(`/api/pro/${proId}/dashboard/predictions`)
      if (predictionsResponse.ok) {
        const predictionsData = await predictionsResponse.json()
        setPredictions(predictionsData.predictions)
      }
      
      // Fetch recommendations
      const recommendationsResponse = await fetch(`/api/pro/${proId}/dashboard/recommendations`)
      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json()
        setRecommendations(recommendationsData.recommendations)
      }
      
    } catch (error) {
      toast.error('Erreur lors du chargement des données')
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Mock data for demonstration
  useEffect(() => {
    if (!metrics) {
      setMetrics({
        totalEarnings: 12500,
        monthlyEarnings: 3200,
        weeklyEarnings: 850,
        totalAppointments: 156,
        completedAppointments: 142,
        cancelledAppointments: 14,
        averageRating: 4.8,
        totalReviews: 89,
        newClients: 23,
        repeatClients: 67,
        averageSessionDuration: 75,
        topServices: [
          { name: 'Tatouage Personnalisé', count: 45, revenue: 5400, growth: 12.5 },
          { name: 'Consultation Design', count: 38, revenue: 3040, growth: 8.2 },
          { name: 'Retouche', count: 29, revenue: 1740, growth: -2.1 }
        ],
        recentActivity: [
          {
            type: 'appointment',
            title: 'Nouveau RDV confirmé',
            description: 'Marie D. - Tatouage fleur de lotus',
            timestamp: new Date(),
            status: 'success'
          },
          {
            type: 'payment',
            title: 'Paiement reçu',
            description: '€180 - Séance de 2h',
            timestamp: subDays(new Date(), 1),
            status: 'success'
          },
          {
            type: 'review',
            title: 'Nouvelle évaluation 5★',
            description: 'Client très satisfait du résultat',
            timestamp: subDays(new Date(), 2),
            status: 'success'
          }
        ]
      })
    }
  }, [metrics])

  // Calculate growth percentages
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 100
    return ((current - previous) / previous) * 100
  }

  // Get trend icon and color
  const getTrendIndicator = (value: number) => {
    if (value > 0) {
      return { icon: TrendingUp, color: 'text-green-500', bgColor: 'bg-green-100' }
    } else if (value < 0) {
      return { icon: TrendingDown, color: 'text-red-500', bgColor: 'bg-red-100' }
    } else {
      return { icon: TrendingUp, color: 'text-gray-500', bgColor: 'bg-gray-100' }
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <CheckCircle className="w-4 h-4 text-gray-500" />
    }
  }

  // Get recommendation priority
  const getRecommendationPriority = (impact: string, effort: string) => {
    if (impact === 'high' && effort === 'low') return '🔥 Priorité Haute'
    if (impact === 'high' && effort === 'medium') return '⚡ Priorité Élevée'
    if (impact === 'medium' && effort === 'low') return '📈 Opportunité'
    return '💡 À considérer'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin mr-3" />
        <span>Chargement du tableau de bord...</span>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Données non disponibles</h3>
        <p className="text-muted-foreground mb-4">
          Impossible de charger les données du tableau de bord
        </p>
        <Button onClick={loadDashboardData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tableau de Bord Intelligent</h1>
            <p className="text-muted-foreground mt-2">
              Analyses avancées et recommandations personnalisées
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Select value={timeRange} onValueChange={(value: 'week' | 'month' | 'quarter') => setTimeRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Ce trimestre</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={loadDashboardData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="analytics">Analyses</TabsTrigger>
            <TabsTrigger value="predictions">Prédictions</TabsTrigger>
            <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Revenus Totaux</p>
                      <p className="text-2xl font-bold">{metrics.totalEarnings}€</p>
                    </div>
                    <div className={`p-2 rounded-full ${getTrendIndicator(12.5).bgColor}`}>
                      <DollarSign className={`w-4 h-4 ${getTrendIndicator(12.5).color}`} />
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+12.5% ce mois</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Rendez-vous</p>
                      <p className="text-2xl font-bold">{metrics.totalAppointments}</p>
                    </div>
                    <div className="p-2 rounded-full bg-blue-100">
                      <Calendar className="w-4 h-4 text-blue-500" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">{metrics.completedAppointments} terminés</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Note Moyenne</p>
                      <p className="text-2xl font-bold">{metrics.averageRating}/5</p>
                    </div>
                    <div className="p-2 rounded-full bg-yellow-100">
                      <Star className="w-4 h-4 text-yellow-500" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    <Users className="w-4 h-4 text-blue-500 mr-1" />
                    <span className="text-sm text-blue-600">{metrics.totalReviews} avis</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nouveaux Clients</p>
                      <p className="text-2xl font-bold">{metrics.newClients}</p>
                    </div>
                    <div className="p-2 rounded-full bg-green-100">
                      <Users className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+{metrics.newClients} ce mois</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Services & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Services */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Services les Plus Populaires</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.topServices.map((service, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{service.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {service.count} RDV
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {service.revenue}€ de revenus
                            </span>
                            <span className={`flex items-center ${
                              service.growth > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {service.growth > 0 ? '+' : ''}{service.growth}%
                              {service.growth > 0 ? (
                                <TrendingUp className="w-3 h-3 ml-1" />
                              ) : (
                                <TrendingDown className="w-3 h-3 ml-1" />
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Activité Récente</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        {getStatusIcon(activity.status)}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(activity.timestamp, 'dd/MM à HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Évolution des Revenus</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Ce mois</span>
                      <span className="text-lg font-bold text-green-600">
                        +{calculateGrowth(metrics.monthlyEarnings, 2800)}%
                      </span>
                    </div>
                    <Progress value={75} className="h-2" />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Objectif: 4000€</span>
                      <span>{metrics.monthlyEarnings}€ / 4000€</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Client Retention */}
              <Card>
                <CardHeader>
                  <CardTitle>Rétention Client</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Taux de retour</span>
                      <span className="text-lg font-bold text-blue-600">
                        {Math.round((metrics.repeatClients / (metrics.newClients + metrics.repeatClients)) * 100)}%
                      </span>
                    </div>
                    <Progress value={74} className="h-2" />
                    <div className="text-sm text-muted-foreground">
                      {metrics.repeatClients} clients fidèles sur {metrics.newClients + metrics.repeatClients} total
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {predictions.map((prediction, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="w-5 h-5" />
                      <span>Prédiction {prediction.type}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${
                          prediction.trend === 'up' ? 'text-green-600' : 
                          prediction.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {prediction.value}
                        </div>
                        <div className="flex items-center justify-center space-x-2 mt-2">
                          {prediction.trend === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : prediction.trend === 'down' ? (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          ) : (
                            <Activity className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="text-sm text-muted-foreground">
                            {prediction.trend === 'up' ? 'Augmentation' : 
                             prediction.trend === 'down' ? 'Diminution' : 'Stable'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Confiance</span>
                          <span>{prediction.confidence}%</span>
                        </div>
                        <Progress value={prediction.confidence} className="h-2" />
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Facteurs clés :</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {prediction.factors.map((factor, idx) => (
                            <li key={idx} className="flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <div className="space-y-4">
              {recommendations.map((recommendation, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge variant={
                            recommendation.impact === 'high' ? 'default' :
                            recommendation.impact === 'medium' ? 'secondary' : 'outline'
                          }>
                            {getRecommendationPriority(recommendation.impact, recommendation.effort)}
                          </Badge>
                          <Badge variant="outline">
                            {recommendation.type === 'optimization' ? '⚡ Optimisation' :
                             recommendation.type === 'growth' ? '📈 Croissance' :
                             recommendation.type === 'efficiency' ? '🎯 Efficacité' : '⭐ Qualité'}
                          </Badge>
                        </div>
                        
                        <h3 className="text-lg font-medium mb-2">{recommendation.title}</h3>
                        <p className="text-muted-foreground mb-4">{recommendation.description}</p>
                        
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Actions recommandées :</p>
                          <ul className="space-y-2">
                            {recommendation.actions.map((action, idx) => (
                              <li key={idx} className="flex items-center space-x-2 text-sm">
                                <div className="w-2 h-2 bg-primary rounded-full" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm">
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Voir plus
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  )
}
