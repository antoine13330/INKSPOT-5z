"use client"
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Send, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Invoice, InvoiceItem } from '@/types'

interface InvoiceGeneratorProps {
  appointment: any
  onInvoiceGenerated: (invoice: Invoice) => void
  onClose: () => void
}

export function InvoiceGenerator({ appointment, onInvoiceGenerated, onClose }: InvoiceGeneratorProps) {
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: '',
    dueDate: '',
    paymentTerms: '30',
    notes: '',
    items: [
      {
        description: appointment?.title || 'Service',
        quantity: 1,
        unitPrice: appointment?.price || 0,
        totalPrice: appointment?.price || 0,
        vatRate: 20,
        vatAmount: (appointment?.price || 0) * 0.2
      }
    ]
  })

  const [loading, setLoading] = useState(false)

  const addItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: '',
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
          vatRate: 20,
          vatAmount: 0
        }
      ]
    }))
  }

  const removeItem = (index: number) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setInvoiceData(prev => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }
      
      // Recalculer le prix total et la TVA
      if (field === 'quantity' || field === 'unitPrice' || field === 'vatRate') {
        const item = newItems[index]
        const totalPrice = item.quantity * item.unitPrice
        const vatAmount = totalPrice * (item.vatRate / 100)
        newItems[index] = {
          ...item,
          totalPrice,
          vatAmount
        }
      }
      
      return { ...prev, items: newItems }
    })
  }

  const calculateTotals = () => {
    const subtotal = invoiceData.items.reduce((sum, item) => sum + item.totalPrice, 0)
    const vatTotal = invoiceData.items.reduce((sum, item) => sum + (item.totalPrice * (item.vatRate / 100)), 0)
    const total = subtotal + vatTotal
    
    return { subtotal, vatTotal, total }
  }

  const generateInvoice = async () => {
    if (!invoiceData.invoiceNumber || !invoiceData.dueDate) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          invoiceData: {
            ...invoiceData,
            amount: calculateTotals().total,
            vatAmount: calculateTotals().vatTotal,
            items: invoiceData.items.map(item => ({
              ...item,
              vatAmount: item.totalPrice * (item.vatRate / 100)
            }))
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Facture générée avec succès')
        onInvoiceGenerated(data.invoice)
        onClose()
      } else {
        toast.error('Erreur lors de la génération de la facture')
      }
    } catch (error) {
      console.error('Error generating invoice:', error)
      toast.error('Erreur lors de la génération de la facture')
    } finally {
      setLoading(false)
    }
  }

  const { subtotal, vatTotal, total } = calculateTotals()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Générer une facture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Numéro de facture *</label>
              <Input
                value={invoiceData.invoiceNumber}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                placeholder="FAC-2024-001"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date d'échéance *</label>
              <Input
                type="date"
                value={invoiceData.dueDate}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Conditions de paiement</label>
              <Select
                value={invoiceData.paymentTerms}
                onValueChange={(value) => setInvoiceData(prev => ({ ...prev, paymentTerms: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Immédiat</SelectItem>
                  <SelectItem value="7">7 jours</SelectItem>
                  <SelectItem value="15">15 jours</SelectItem>
                  <SelectItem value="30">30 jours</SelectItem>
                  <SelectItem value="45">45 jours</SelectItem>
                  <SelectItem value="60">60 jours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              value={invoiceData.notes}
              onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes additionnelles pour la facture..."
              rows={3}
            />
          </div>

          {/* Articles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Articles</h4>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un article
              </Button>
            </div>

            <div className="space-y-3">
              {invoiceData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg">
                  <div className="col-span-4">
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Description du service"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      min="1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-2">
                    <Select
                      value={item.vatRate.toString()}
                      onValueChange={(value) => updateItem(index, 'vatRate', parseFloat(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5.5">5.5%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 text-right">
                    <Badge variant="secondary">
                      {item.totalPrice.toFixed(2)} €
                    </Badge>
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={invoiceData.items.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totaux */}
          <div className="border-t pt-4">
            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span>Sous-total:</span>
                <span>{subtotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span>TVA:</span>
                <span>{vatTotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">{total.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={generateInvoice} disabled={loading}>
              {loading ? (
                <>
                  <FileText className="w-4 h-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Générer la facture
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
