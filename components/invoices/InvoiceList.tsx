"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  FileText, 
  Download, 
  Search, 
  Calendar,
  User,
  Euro,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  description: string
  dueDate: string
  paidAt: string | null
  status: string
  createdAt: string
  appointment?: {
    title: string
    client: {
      username: string
      firstName?: string
      lastName?: string
      email?: string
    }
  }
}

interface InvoiceListProps {
  className?: string
}

export function InvoiceList({ className }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/invoices?type=issued')
      if (!response.ok) throw new Error('Erreur lors du chargement')
      
      const data = await response.json()
      setInvoices(data.invoices || [])
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des factures')
    } finally {
      setLoading(false)
    }
  }

  const downloadInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/download`)
      if (!response.ok) throw new Error('Erreur lors du téléchargement')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `facture-${invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Facture téléchargée avec succès !')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du téléchargement')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PAID: { variant: "default" as const, label: "Payée", color: "bg-green-500" },
      PENDING: { variant: "secondary" as const, label: "En attente", color: "bg-yellow-500" },
      DRAFT: { variant: "outline" as const, label: "Brouillon", color: "bg-gray-500" },
      CANCELLED: { variant: "destructive" as const, label: "Annulée", color: "bg-red-500" }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "secondary" as const,
      label: status,
      color: "bg-gray-500"
    }

    return <Badge variant={config.variant} className={`${config.color} text-white`}>{config.label}</Badge>
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.appointment?.client?.firstName && 
       invoice.appointment.client.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (invoice.appointment?.client?.lastName && 
       invoice.appointment.client.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      invoice.appointment?.client?.username.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Factures ({filteredInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher une facture..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="PAID">Payées</option>
              <option value="PENDING">En attente</option>
              <option value="DRAFT">Brouillons</option>
              <option value="CANCELLED">Annulées</option>
            </select>
          </div>

          {/* Liste des factures */}
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune facture trouvée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">#{invoice.invoiceNumber}</h4>
                        {getStatusBadge(invoice.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Créée le {format(new Date(invoice.createdAt), 'dd/MM/yyyy', { locale: fr })}
                            </span>
                          </div>
                          
                          {invoice.dueDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Échéance: {format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: fr })}
                              </span>
                            </div>
                          )}
                          
                          {invoice.paidAt && (
                            <div className="flex items-center gap-2 text-green-600">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Payée le {format(new Date(invoice.paidAt), 'dd/MM/yyyy', { locale: fr })}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          {invoice.appointment && (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>
                                {invoice.appointment.client.firstName && invoice.appointment.client.lastName
                                  ? `${invoice.appointment.client.firstName} ${invoice.appointment.client.lastName}`
                                  : invoice.appointment.client.username
                                }
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Euro className="w-4 h-4" />
                            <span className="font-medium">{invoice.amount}€</span>
                          </div>
                          
                          {invoice.appointment && (
                            <div className="text-xs text-gray-500">
                              {invoice.appointment.title}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadInvoice(invoice.id)}
                        title="Télécharger la facture"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/api/invoices/${invoice.id}/preview`, '_blank')}
                        title="Aperçu de la facture"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
