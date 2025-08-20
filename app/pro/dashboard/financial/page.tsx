"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  FileText,
  AlertCircle,
  Wallet,
  PiggyBank,
  Clock,
  CheckCircle,
  Download
} from "lucide-react"
import { InvoiceList } from "@/components/invoices/InvoiceList"
import { toast } from "sonner"

interface Transaction {
  id: string
  amount: number
  currency: string
  type: string
  status: string
  description: string
  createdAt: string
  payment?: {
    booking?: {
      title: string
      client: {
        name: string
        email: string
      }
    }
  }
}

interface FinancialSummary {
  available: number
  totalEarnings: number
  totalPayouts: number
  pendingPayouts: number
  // Ajouter des détails sur les types de gains
  depositEarnings: number
  fullPaymentEarnings: number
  monthlyEarnings: number
  totalTransactions: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  description: string
  dueDate: string
  paidAt: string | null
  receiver: {
    name: string
    email: string
  }
}

export default function FinancialDashboard() {
  const { data: session } = useSession()
  const [balance, setBalance] = useState<FinancialSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [payoutLoading, setPayoutLoading] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      loadFinancialData()
    }
  }, [session])

  const loadFinancialData = async () => {
    try {
      // Load balance and transaction data
      const balanceResponse = await fetch(`/api/payments/payout?proId=${session?.user?.id}`)
      const balanceData = await balanceResponse.json()
      
      if (balanceData.balance) {
        setBalance(balanceData.balance)
        setTransactions(balanceData.recentPayouts || [])
      }

      // Load invoices
      const invoicesResponse = await fetch('/api/invoices?type=issued')
      const invoicesData = await invoicesResponse.json()
      
      if (invoicesData.success) {
        setInvoices(invoicesData.invoices)
      }
    } catch (error) {
      // Error loading financial data (removed console.error for production)
      toast.error("Failed to load financial data")
    } finally {
      setLoading(false)
    }
  }

  const requestPayout = async () => {
    if (!balance?.available || balance.available < 10) return

    setPayoutLoading(true)
    try {
      const response = await fetch('/api/payments/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proId: session?.user?.id,
          amount: balance.available,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Reload financial data
        await loadFinancialData()
        alert('Payout request submitted successfully!')
      } else {
        alert(data.message || 'Failed to request payout')
      }
    } catch (error) {
      // Error requesting payout (removed console.error for production)
      toast.error("Failed to request payout")
    } finally {
      setPayoutLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString))
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'PAYOUT':
        return <ArrowUpRight className="h-4 w-4 text-blue-600" />
      case 'REFUND':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />
      case 'BOOKING_PAYMENT':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'DEPOSIT':
        return <PiggyBank className="h-4 w-4 text-orange-600" />
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'PAYOUT':
        return 'Retrait'
      case 'REFUND':
        return 'Remboursement'
      case 'BOOKING_PAYMENT':
        return 'Paiement RDV'
      case 'DEPOSIT':
        return 'Acompte'
      default:
        return type
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { variant: "default" as const, label: "Terminé", color: "text-green-600" },
      pending: { variant: "secondary" as const, label: "En cours", color: "text-yellow-600" },
      failed: { variant: "destructive" as const, label: "Échoué", color: "text-red-600" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "secondary" as const,
      label: status,
      color: "text-gray-600"
    }

    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-48">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">💰 Dashboard Financier</h1>
          <p className="text-muted-foreground">Gérez vos gains et retraits</p>
        </div>
        <Button onClick={loadFinancialData} variant="outline" size="sm">
          <RefreshCw className="h-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde Disponible</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(balance?.available || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Prêt pour retrait
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gains Totaux</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(balance?.totalEarnings || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Tous gains confondus
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acomptes Reçus</CardTitle>
            <PiggyBank className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(balance?.depositEarnings || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Cautions perçues
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paiements Complets</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(balance?.fullPaymentEarnings || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              RDV entièrement payés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Détail des gains */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Gains du Mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(balance?.monthlyEarnings || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              Total Retiré
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(balance?.totalPayouts || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Retraits effectués
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Retraits en Cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(balance?.pendingPayouts || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              En traitement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Request Section */}
      {balance && balance.available >= 10 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">🎯 Prêt pour Retrait</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700">
                  Vous avez {formatCurrency(balance.available)} disponibles pour retrait
                </p>
                <p className="text-sm text-green-600">
                  Les retraits arrivent généralement en 1-2 jours ouvrés
                </p>
              </div>
              <Button 
                onClick={requestPayout} 
                disabled={payoutLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {payoutLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                )}
                Demander Retrait
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="invoices">Factures</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📊 Transactions Récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune transaction pour le moment</p>
                  </div>
                ) : (
                  transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{transaction.description}</p>
                            <Badge variant="outline" className="text-xs">
                              {getTransactionTypeLabel(transaction.type)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(transaction.createdAt)}
                          </p>
                          {transaction.payment?.booking && (
                            <p className="text-xs text-blue-600">
                              📅 {transaction.payment.booking.title}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium text-lg ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <InvoiceList />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>📈 Évolution des Gains</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Graphiques d'analyse à venir</p>
                  <p className="text-sm">Visualisation des gains mensuels et tendances</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>💳 Répartition des Paiements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Répartition acomptes vs paiements complets</p>
                  <p className="text-sm">Statistiques détaillées à venir</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Minimum payout notice */}
      {balance && balance.available > 0 && balance.available < 10 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">
                Le montant minimum de retrait est de 10€. Vous avez {formatCurrency(balance.available)} disponibles.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}