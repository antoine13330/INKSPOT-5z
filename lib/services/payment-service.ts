import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { PaymentStatus, TransactionType } from '@prisma/client'
import { z } from 'zod'

// ============================================================================
// SCHEMAS DE VALIDATION
// ============================================================================

export const PaymentIntentSchema = z.object({
  amount: z.number().min(0.01).max(10000),
  currency: z.string().default('EUR'),
  appointmentId: z.string().cuid().optional(),
  clientId: z.string().cuid(),
  proId: z.string().cuid(),
  description: z.string().min(3).max(200),
  metadata: z.record(z.string()).optional()
})

export const PaymentConfirmSchema = z.object({
  paymentIntentId: z.string(),
  appointmentId: z.string().cuid().optional(),
  clientId: z.string().cuid(),
  proId: z.string().cuid()
})

export const RefundSchema = z.object({
  paymentId: z.string().cuid(),
  amount: z.number().min(0.01).optional(),
  reason: z.string().min(3).max(200).optional(),
  userId: z.string().cuid()
})

// ============================================================================
// TYPES
// ============================================================================

export type PaymentIntentInput = z.infer<typeof PaymentIntentSchema>
export type PaymentConfirmInput = z.infer<typeof PaymentConfirmSchema>
export type RefundInput = z.infer<typeof RefundSchema>

export interface PaymentWithDetails {
  id: string
  amount: number
  currency: string
  status: PaymentStatus
  stripePaymentIntentId?: string
  description: string
  paidAt?: Date
  refundedAt?: Date
  refundAmount?: number
  createdAt: Date
  updatedAt: Date
  appointmentId?: string
  senderId: string
  receiverId: string
  sender: {
    id: string
    username: string
    email: string
  }
  receiver: {
    id: string
    username: string
    email: string
  }
  appointment?: {
    id: string
    title: string
    price: number
    status: string
  }
  _computed: {
    isRefundable: boolean
    refundableAmount: number
    canBeProcessed: boolean
  }
}

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

export class PaymentService {
  // ========================================================================
  // CRÉATION D'INTENTION DE PAIEMENT
  // ========================================================================
  
  static async createPaymentIntent(input: PaymentIntentInput): Promise<{
    paymentIntent: any
    payment: any
  }> {
    try {
      const validatedData = PaymentIntentSchema.parse(input)
      
      // Vérifications métier
      await this.validatePaymentIntent(validatedData)
      
      // Créer l'intention de paiement Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(validatedData.amount * 100), // Stripe utilise les centimes
        currency: validatedData.currency.toLowerCase(),
        metadata: {
          appointmentId: validatedData.appointmentId || '',
          clientId: validatedData.clientId,
          proId: validatedData.proId,
          description: validatedData.description,
          ...validatedData.metadata
        },
        description: validatedData.description,
        automatic_payment_methods: {
          enabled: true,
        },
        capture_method: 'automatic'
      })

      // Créer l'enregistrement de paiement
      const payment = await prisma.payment.create({
        data: {
          amount: validatedData.amount,
          currency: validatedData.currency,
          status: 'PENDING',
          stripePaymentIntentId: paymentIntent.id,
          description: validatedData.description,
          senderId: validatedData.clientId,
          receiverId: validatedData.proId,
          appointmentId: validatedData.appointmentId
        }
      })

      return { paymentIntent, payment }
    } catch (error) {
      throw new Error(`Erreur lors de la création de l'intention de paiement: ${error.message}`)
    }
  }

  // ========================================================================
  // VALIDATION MÉTIER
  // ========================================================================
  
  private static async validatePaymentIntent(input: PaymentIntentInput): Promise<void> {
    // Vérifier que le client et le pro existent
    const [client, pro] = await Promise.all([
      prisma.user.findUnique({ where: { id: input.clientId } }),
      prisma.user.findUnique({ where: { id: input.proId } })
    ])

    if (!client) {
      throw new Error('Client non trouvé')
    }

    if (!pro) {
      throw new Error('Professionnel non trouvé')
    }

    if (pro.role !== 'PRO') {
      throw new Error('L\'utilisateur spécifié n\'est pas un professionnel')
    }

    // Si un appointment est spécifié, vérifier qu'il existe et est valide
    if (input.appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: input.appointmentId },
        include: { payments: true }
      })

      if (!appointment) {
        throw new Error('Appointment non trouvé')
      }

      if (appointment.clientId !== input.clientId) {
        throw new Error('Le client ne correspond pas à l\'appointment')
      }

      if (appointment.proId !== input.proId) {
        throw new Error('Le professionnel ne correspond pas à l\'appointment')
      }

      // Vérifier que le montant est cohérent avec l'appointment
      const totalPaid = appointment.payments
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + p.amount, 0)

      const remainingAmount = appointment.price - totalPaid
      
      if (Math.abs(input.amount - remainingAmount) > 0.01) {
        throw new Error(`Le montant doit être de ${remainingAmount}€ (reste à payer)`)
      }
    }

    // Vérifier que le montant est raisonnable
    if (input.amount > 10000) {
      throw new Error('Le montant maximum autorisé est de 10 000€')
    }

    if (input.amount < 0.01) {
      throw new Error('Le montant minimum autorisé est de 0.01€')
    }
  }

  // ========================================================================
  // CONFIRMATION DE PAIEMENT
  // ========================================================================
  
  static async confirmPayment(input: PaymentConfirmInput): Promise<PaymentWithDetails> {
    try {
      const validatedData = PaymentConfirmSchema.parse(input)
      
      // Récupérer le paiement
      const payment = await prisma.payment.findFirst({
        where: { 
          stripePaymentIntentId: validatedData.paymentIntentId,
          OR: [
            { senderId: validatedData.clientId },
            { receiverId: validatedData.proId }
          ]
        },
        include: {
          sender: {
            select: { id: true, username: true, email: true }
          },
          receiver: {
            select: { id: true, username: true, email: true }
          },
          appointment: {
            select: { id: true, title: true, price: true, status: true }
          }
        }
      })

      if (!payment) {
        throw new Error('Paiement non trouvé')
      }

      // Vérifier que le paiement peut être confirmé
      if (payment.status !== 'PENDING') {
        throw new Error('Ce paiement ne peut pas être confirmé')
      }

      // Vérifier l'intention de paiement Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(validatedData.paymentIntentId)
      
      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Le paiement n\'a pas été confirmé par Stripe')
      }

      // Mettre à jour le statut du paiement
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          paidAt: new Date()
        },
        include: {
          sender: {
            select: { id: true, username: true, email: true }
          },
          receiver: {
            select: { id: true, username: true, email: true }
          },
          appointment: {
            select: { id: true, title: true, price: true, status: true }
          }
        }
      })

      // Créer une transaction
      await this.createTransaction(updatedPayment, 'BOOKING_PAYMENT')

      // Mettre à jour le statut de l'appointment si applicable
      if (updatedPayment.appointmentId) {
        await this.updateAppointmentPaymentStatus(updatedPayment.appointmentId)
      }

      // Créer des notifications
      await this.createPaymentNotifications(updatedPayment)

      return this.enrichPaymentWithComputedFields(updatedPayment)
    } catch (error) {
      throw new Error(`Erreur lors de la confirmation du paiement: ${error.message}`)
    }
  }

  // ========================================================================
  // REMBOURSEMENT
  // ========================================================================
  
  static async refundPayment(input: RefundInput): Promise<PaymentWithDetails> {
    try {
      const validatedData = RefundSchema.parse(input)
      
      // Récupérer le paiement
      const payment = await prisma.payment.findUnique({
        where: { id: validatedData.paymentId },
        include: {
          sender: {
            select: { id: true, username: true, email: true }
          },
          receiver: {
            select: { id: true, username: true, email: true }
          },
          appointment: {
            select: { id: true, title: true, price: true, status: true }
          }
        }
      })

      if (!payment) {
        throw new Error('Paiement non trouvé')
      }

      // Vérifier que le paiement peut être remboursé
      if (!this.canBeRefunded(payment, validatedData.userId)) {
        throw new Error('Ce paiement ne peut pas être remboursé')
      }

      // Calculer le montant du remboursement
      const refundAmount = validatedData.amount || payment.amount
      
      if (refundAmount > payment.amount) {
        throw new Error('Le montant du remboursement ne peut pas dépasser le montant payé')
      }

      // Effectuer le remboursement via Stripe
      let refund
      if (payment.stripePaymentIntentId) {
        refund = await stripe.refunds.create({
          payment_intent: payment.stripePaymentIntentId,
          amount: Math.round(refundAmount * 100),
          reason: validatedData.reason ? 'requested_by_customer' : 'duplicate',
          metadata: {
            reason: validatedData.reason || 'Remboursement',
            requestedBy: validatedData.userId
          }
        })
      }

      // Mettre à jour le paiement
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
          refundAmount: refundAmount
        },
        include: {
          sender: {
            select: { id: true, username: true, email: true }
          },
          receiver: {
            select: { id: true, username: true, email: true }
          },
          appointment: {
            select: { id: true, title: true, price: true, status: true }
          }
        }
      })

      // Créer une transaction de remboursement
      await this.createTransaction(updatedPayment, 'REFUND', {
        refundAmount,
        reason: validatedData.reason
      })

      // Créer des notifications
      await this.createRefundNotifications(updatedPayment, refundAmount)

      return this.enrichPaymentWithComputedFields(updatedPayment)
    } catch (error) {
      throw new Error(`Erreur lors du remboursement: ${error.message}`)
    }
  }

  // ========================================================================
  // RÉCUPÉRATION DE PAIEMENTS
  // ========================================================================
  
  static async getPaymentById(id: string, userId: string): Promise<PaymentWithDetails> {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        sender: {
          select: { id: true, username: true, email: true }
        },
        receiver: {
          select: { id: true, username: true, email: true }
        },
        appointment: {
          select: { id: true, title: true, price: true, status: true }
        }
      }
    })

    if (!payment) {
      throw new Error('Paiement non trouvé')
    }

    // Vérifier les permissions
    if (payment.senderId !== userId && payment.receiverId !== userId) {
      throw new Error('Accès non autorisé')
    }

    return this.enrichPaymentWithComputedFields(payment)
  }

  static async getPaymentsByUser(
    userId: string,
    role: 'SENDER' | 'RECEIVER',
    status?: PaymentStatus[],
    limit = 50,
    offset = 0
  ): Promise<{ payments: PaymentWithDetails[], total: number }> {
    const where = role === 'SENDER' 
      ? { senderId: userId }
      : { receiverId: userId }

    if (status && status.length > 0) {
      where.status = { in: status }
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          sender: {
            select: { id: true, username: true, email: true }
          },
          receiver: {
            select: { id: true, username: true, email: true }
          },
          appointment: {
            select: { id: true, title: true, price: true, status: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.payment.count({ where })
    ])

    const enrichedPayments = payments.map(payment => 
      this.enrichPaymentWithComputedFields(payment)
    )

    return { payments: enrichedPayments, total }
  }

  // ========================================================================
  // MÉTHODES UTILITAIRES
  // ========================================================================
  
  private static canBeRefunded(payment: any, userId: string): boolean {
    // Seul le destinataire du paiement peut initier un remboursement
    if (payment.receiverId !== userId) {
      return false
    }

    // Le paiement doit être complété
    if (payment.status !== 'COMPLETED') {
      return false
    }

    // Vérifier que le paiement n'a pas déjà été remboursé
    if (payment.status === 'REFUNDED') {
      return false
    }

    // Vérifier la limite de temps (30 jours)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    if (payment.paidAt && payment.paidAt < thirtyDaysAgo) {
      return false
    }

    return true
  }

  private static async createTransaction(
    payment: any,
    type: TransactionType,
    metadata?: any
  ) {
    try {
      await prisma.transaction.create({
        data: {
          amount: payment.amount,
          currency: payment.currency,
          type,
          status: 'completed',
          description: payment.description,
          userId: payment.receiverId,
          paymentId: payment.id,
          metadata: metadata || {}
        }
      })
    } catch (error) {
      console.error('Erreur lors de la création de la transaction:', error)
    }
  }

  private static async updateAppointmentPaymentStatus(appointmentId: string) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { payments: true }
      })

      if (!appointment) return

      const totalPaid = appointment.payments
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + p.amount, 0)

      let newStatus = appointment.status

      if (totalPaid >= appointment.price) {
        newStatus = 'PAID'
      } else if (totalPaid > 0) {
        newStatus = 'CONFIRMED'
      }

      if (newStatus !== appointment.status) {
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { status: newStatus }
        })
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de l\'appointment:', error)
    }
  }

  private static async createPaymentNotifications(payment: any) {
    try {
      // Notification pour le client
      await prisma.notification.create({
        data: {
          title: 'Paiement confirmé',
          message: `Votre paiement de ${payment.amount}€ a été confirmé`,
          type: 'PAYMENT',
          userId: payment.senderId,
          data: {
            paymentId: payment.id,
            amount: payment.amount,
            type: 'payment_confirmed'
          }
        }
      })

      // Notification pour le professionnel
      await prisma.notification.create({
        data: {
          title: 'Paiement reçu',
          message: `Vous avez reçu un paiement de ${payment.amount}€`,
          type: 'PAYMENT',
          userId: payment.receiverId,
          data: {
            paymentId: payment.id,
            amount: payment.amount,
            type: 'payment_received'
          }
        }
      })
    } catch (error) {
      console.error('Erreur lors de la création des notifications:', error)
    }
  }

  private static async createRefundNotifications(payment: any, refundAmount: number) {
    try {
      // Notification pour le client
      await prisma.notification.create({
        data: {
          title: 'Remboursement effectué',
          message: `Un remboursement de ${refundAmount}€ a été effectué`,
          type: 'PAYMENT',
          userId: payment.senderId,
          data: {
            paymentId: payment.id,
            refundAmount,
            type: 'refund_processed'
          }
        }
      })

      // Notification pour le professionnel
      await prisma.notification.create({
        data: {
          title: 'Remboursement initié',
          message: `Vous avez initié un remboursement de ${refundAmount}€`,
          type: 'PAYMENT',
          userId: payment.receiverId,
          data: {
            paymentId: payment.id,
            refundAmount,
            type: 'refund_initiated'
          }
        }
      })
    } catch (error) {
      console.error('Erreur lors de la création des notifications de remboursement:', error)
    }
  }

  private static enrichPaymentWithComputedFields(payment: any): PaymentWithDetails {
    const isRefundable = this.canBeRefunded(payment, payment.receiverId)
    const refundableAmount = isRefundable ? payment.amount : 0
    const canBeProcessed = payment.status === 'PENDING'

    return {
      ...payment,
      _computed: {
        isRefundable,
        refundableAmount,
        canBeProcessed
      }
    }
  }
}
