import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { AppointmentStatus, AppointmentType, PaymentStatus } from '@prisma/client'
import { z } from 'zod'

// ============================================================================
// SCHEMAS DE VALIDATION
// ============================================================================

export const AppointmentCreateSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(500).optional(),
  type: z.nativeEnum(AppointmentType),
  startDate: z.date(),
  endDate: z.date(),
  duration: z.number().min(15).max(480), // 15min à 8h
  price: z.number().min(0).max(10000),
  currency: z.string().default('EUR'),
  location: z.string().min(3).max(200).optional(),
  requirements: z.array(z.string()).max(10).optional(),
  notes: z.string().max(1000).optional(),
  depositRequired: z.boolean().default(false),
  depositAmount: z.number().min(0).optional(),
  clientId: z.string().cuid(),
  proId: z.string().cuid(),
  conversationId: z.string().cuid().optional(),
  postId: z.string().cuid().optional()
})

export const AppointmentUpdateSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(500).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  duration: z.number().min(15).max(480).optional(),
  price: z.number().min(0).max(10000).optional(),
  location: z.string().min(3).max(200).optional(),
  requirements: z.array(z.string()).max(10).optional(),
  notes: z.string().max(1000).optional(),
  status: z.nativeEnum(AppointmentStatus).optional()
})

export const PaymentCreateSchema = z.object({
  appointmentId: z.string().cuid(),
  amount: z.number().min(0.01),
  currency: z.string().default('EUR'),
  type: z.enum(['DEPOSIT', 'BALANCE', 'FULL_PAYMENT']),
  description: z.string().min(3).max(200),
  clientId: z.string().cuid(),
  proId: z.string().cuid()
})

// ============================================================================
// TYPES
// ============================================================================

export type AppointmentCreateInput = z.infer<typeof AppointmentCreateSchema>
export type AppointmentUpdateInput = z.infer<typeof AppointmentUpdateSchema>
export type PaymentCreateInput = z.infer<typeof PaymentCreateSchema>

export interface AppointmentWithDetails {
  id: string
  title: string
  description?: string
  type: AppointmentType
  startDate: Date
  endDate: Date
  duration: number
  price: number
  currency: string
  location?: string
  requirements: string[]
  notes?: string
  status: AppointmentStatus
  depositRequired: boolean
  depositAmount?: number
  clientId: string
  proId: string
  conversationId?: string
  postId?: string
  createdAt: Date
  updatedAt: Date
  client: {
    id: string
    username: string
    firstName?: string
    lastName?: string
    email: string
    avatar?: string
  }
  pro: {
    id: string
    username: string
    firstName?: string
    lastName?: string
    email: string
    avatar?: string
    businessName?: string
  }
  payments: Array<{
    id: string
    amount: number
    status: PaymentStatus
    type: string
    description: string
    createdAt: Date
    paidAt?: Date
  }>
  _computed: {
    totalPaid: number
    remainingAmount: number
    depositPaid: boolean
    fullPayment: boolean
    canBeCancelled: boolean
    canBeModified: boolean
    nextAction: string
  }
}

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

export class AppointmentService {
  // ========================================================================
  // CRÉATION D'APPOINTMENT
  // ========================================================================
  
  static async createAppointment(input: AppointmentCreateInput): Promise<AppointmentWithDetails> {
    try {
      // Validation des données
      const validatedData = AppointmentCreateSchema.parse(input)
      
      // Vérifications métier
      await this.validateAppointmentCreation(validatedData)
      
      // Création de l'appointment
      const appointment = await prisma.appointment.create({
        data: {
          ...validatedData,
          status: 'PROPOSED',
          requirements: validatedData.requirements || [],
          depositAmount: validatedData.depositRequired 
            ? validatedData.depositAmount || Math.round(validatedData.price * 0.3)
            : undefined
        },
        include: {
          client: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true
            }
          },
          pro: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              businessName: true
            }
          },
          payments: true
        }
      })

      // Créer une notification pour le client
      await this.createNotification({
        userId: validatedData.clientId,
        title: 'Nouvelle proposition de rendez-vous',
        message: `Le professionnel vous a proposé un rendez-vous: "${validatedData.title}"`,
        type: 'APPOINTMENT',
        data: { appointmentId: appointment.id, type: 'proposal_received' }
      })

      // Créer une notification pour le pro
      await this.createNotification({
        userId: validatedData.proId,
        title: 'Proposition de rendez-vous envoyée',
        message: `Vous avez proposé un rendez-vous à ${appointment.client.username}: "${validatedData.title}"`,
        type: 'APPOINTMENT',
        data: { appointmentId: appointment.id, type: 'proposal_sent' }
      })

      return this.enrichAppointmentWithComputedFields(appointment)
    } catch (error) {
      throw new Error(`Erreur lors de la création de l'appointment: ${error.message}`)
    }
  }

  // ========================================================================
  // VALIDATION MÉTIER
  // ========================================================================
  
  private static async validateAppointmentCreation(input: AppointmentCreateInput): Promise<void> {
    // Vérifier que les dates sont dans le futur
    if (input.startDate <= new Date()) {
      throw new Error('La date de début doit être dans le futur')
    }

    if (input.endDate <= input.startDate) {
      throw new Error('La date de fin doit être après la date de début')
    }

    // Vérifier que la durée correspond aux dates
    const durationMs = input.endDate.getTime() - input.startDate.getTime()
    const durationMinutes = Math.round(durationMs / (1000 * 60))
    if (Math.abs(durationMinutes - input.duration) > 5) {
      throw new Error('La durée spécifiée ne correspond pas aux dates')
    }

    // Vérifier les conflits d'horaires
    const conflicts = await this.checkTimeConflicts(
      input.proId,
      input.startDate,
      input.endDate,
      input.clientId
    )
    
    if (conflicts.length > 0) {
      throw new Error(`Conflit d'horaires détecté: ${conflicts[0].title}`)
    }

    // Vérifier que le montant de la caution est raisonnable
    if (input.depositRequired && input.depositAmount) {
      if (input.depositAmount > input.price * 0.5) {
        throw new Error('La caution ne peut pas dépasser 50% du prix total')
      }
      if (input.depositAmount < input.price * 0.1) {
        throw new Error('La caution doit être d\'au moins 10% du prix total')
      }
    }
  }

  // ========================================================================
  // VÉRIFICATION DES CONFLITS
  // ========================================================================
  
  private static async checkTimeConflicts(
    proId: string,
    startDate: Date,
    endDate: Date,
    excludeClientId?: string
  ) {
    const conflicts = await prisma.appointment.findMany({
      where: {
        proId,
        status: {
          in: ['PROPOSED', 'ACCEPTED', 'CONFIRMED', 'PAID', 'IN_PROGRESS']
        },
        OR: [
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gt: startDate } }
            ]
          },
          {
            AND: [
              { startDate: { lt: endDate } },
              { endDate: { gte: endDate } }
            ]
          },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } }
            ]
          }
        ]
      },
      include: {
        client: {
          select: { username: true }
        }
      }
    })

    // Filtrer les conflits avec le même client (autoriser la modification)
    return conflicts.filter(conflict => 
      !excludeClientId || conflict.clientId !== excludeClientId
    )
  }

  // ========================================================================
  // RÉCUPÉRATION D'APPOINTMENTS
  // ========================================================================
  
  static async getAppointmentById(id: string, userId: string): Promise<AppointmentWithDetails> {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        pro: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            businessName: true
          }
        },
        payments: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!appointment) {
      throw new Error('Appointment non trouvé')
    }

    // Vérifier les permissions
    if (appointment.clientId !== userId && appointment.proId !== userId) {
      throw new Error('Accès non autorisé')
    }

    return this.enrichAppointmentWithComputedFields(appointment)
  }

  static async getAppointmentsByUser(
    userId: string,
    role: 'CLIENT' | 'PRO',
    status?: AppointmentStatus[],
    limit = 50,
    offset = 0
  ): Promise<{ appointments: AppointmentWithDetails[], total: number }> {
    const where = role === 'CLIENT' 
      ? { clientId: userId }
      : { proId: userId }

    if (status && status.length > 0) {
      where.status = { in: status }
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true
            }
          },
          pro: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              businessName: true
            }
          },
          payments: {
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { startDate: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.appointment.count({ where })
    ])

    const enrichedAppointments = appointments.map(appointment => 
      this.enrichAppointmentWithComputedFields(appointment)
    )

    return { appointments: enrichedAppointments, total }
  }

  // ========================================================================
  // MISE À JOUR D'APPOINTMENT
  // ========================================================================
  
  static async updateAppointment(
    id: string,
    input: AppointmentUpdateInput,
    userId: string
  ): Promise<AppointmentWithDetails> {
    try {
      const validatedData = AppointmentUpdateSchema.parse(input)
      
      // Vérifier les permissions
      const appointment = await this.getAppointmentById(id, userId)
      if (!this.canModifyAppointment(appointment, userId)) {
        throw new Error('Cet appointment ne peut pas être modifié')
      }

      // Vérifier les conflits si les dates changent
      if (validatedData.startDate || validatedData.endDate) {
        const startDate = validatedData.startDate || appointment.startDate
        const endDate = validatedData.endDate || appointment.endDate
        
        const conflicts = await this.checkTimeConflicts(
          appointment.proId,
          startDate,
          endDate,
          appointment.clientId
        )
        
        if (conflicts.length > 0) {
          throw new Error('Les nouvelles dates créent un conflit d\'horaires')
        }
      }

      // Mettre à jour l'appointment
      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: validatedData,
        include: {
          client: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true
            }
          },
          pro: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              businessName: true
            }
          },
          payments: {
            orderBy: { createdAt: 'asc' }
          }
        }
      })

      // Créer un historique des modifications
      await this.createStatusHistory(updatedAppointment.id, userId, 'MODIFIED', {
        changes: validatedData,
        reason: 'Modification par l\'utilisateur'
      })

      return this.enrichAppointmentWithComputedFields(updatedAppointment)
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`)
    }
  }

  // ========================================================================
  // CHANGEMENT DE STATUT
  // ========================================================================
  
  static async changeAppointmentStatus(
    id: string,
    newStatus: AppointmentStatus,
    userId: string,
    reason?: string,
    metadata?: any
  ): Promise<AppointmentWithDetails> {
    try {
      const appointment = await this.getAppointmentById(id, userId)
      
      // Vérifier que le changement de statut est autorisé
      if (!this.canChangeStatus(appointment, newStatus, userId)) {
        throw new Error('Ce changement de statut n\'est pas autorisé')
      }

      // Effectuer le changement de statut
      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: { status: newStatus },
        include: {
          client: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true
            }
          },
          pro: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              businessName: true
            }
          },
          payments: {
            orderBy: { createdAt: 'asc' }
          }
        }
      })

      // Créer un historique
      await this.createStatusHistory(id, userId, newStatus, {
        reason,
        metadata
      })

      // Créer des notifications appropriées
      await this.createStatusChangeNotifications(updatedAppointment, newStatus, userId)

      return this.enrichAppointmentWithComputedFields(updatedAppointment)
    } catch (error) {
      throw new Error(`Erreur lors du changement de statut: ${error.message}`)
    }
  }

  // ========================================================================
  // GESTION DES PAIEMENTS
  // ========================================================================
  
  static async createPayment(input: PaymentCreateInput): Promise<any> {
    try {
      const validatedData = PaymentCreateSchema.parse(input)
      
      // Vérifier que l'appointment existe et peut recevoir ce paiement
      const appointment = await this.getAppointmentById(validatedData.appointmentId, validatedData.clientId)
      
      if (!this.canReceivePayment(appointment, validatedData)) {
        throw new Error('Ce paiement ne peut pas être effectué')
      }

      // Créer l'intention de paiement Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(validatedData.amount * 100), // Stripe utilise les centimes
        currency: validatedData.currency.toLowerCase(),
        metadata: {
          appointmentId: validatedData.appointmentId,
          clientId: validatedData.clientId,
          proId: validatedData.proId,
          paymentType: validatedData.type,
          description: validatedData.description
        },
        description: validatedData.description
      })

      // Créer l'enregistrement de paiement
      const payment = await prisma.payment.create({
        data: {
          appointmentId: validatedData.appointmentId,
          amount: validatedData.amount,
          currency: validatedData.currency,
          status: 'PENDING',
          stripePaymentIntentId: paymentIntent.id,
          description: validatedData.description,
          senderId: validatedData.clientId,
          receiverId: validatedData.proId
        }
      })

      return {
        payment,
        paymentIntent: {
          clientSecret: paymentIntent.client_secret,
          id: paymentIntent.id
        }
      }
    } catch (error) {
      throw new Error(`Erreur lors de la création du paiement: ${error.message}`)
    }
  }

  // ========================================================================
  // MÉTHODES UTILITAIRES
  // ========================================================================
  
  private static enrichAppointmentWithComputedFields(appointment: any): AppointmentWithDetails {
    const totalPaid = appointment.payments
      .filter((p: any) => p.status === 'COMPLETED')
      .reduce((sum: number, p: any) => sum + p.amount, 0)

    const remainingAmount = appointment.price - totalPaid
    const depositPaid = appointment.payments.some((p: any) => 
      p.status === 'COMPLETED' && 
      p.description.toLowerCase().includes('acompte')
    )
    const fullPayment = totalPaid >= appointment.price

    return {
      ...appointment,
      _computed: {
        totalPaid,
        remainingAmount,
        depositPaid,
        fullPayment,
        canBeCancelled: this.canBeCancelled(appointment),
        canBeModified: this.canBeModified(appointment),
        nextAction: this.getNextAction(appointment, totalPaid, remainingAmount)
      }
    }
  }

  private static canBeCancelled(appointment: any): boolean {
    return ['PROPOSED', 'ACCEPTED', 'CONFIRMED'].includes(appointment.status)
  }

  private static canBeModified(appointment: any): boolean {
    return ['PROPOSED', 'ACCEPTED'].includes(appointment.status)
  }

  private static canModifyAppointment(appointment: any, userId: string): boolean {
    if (!this.canBeModified(appointment)) return false
    
    // Seul le créateur peut modifier
    return appointment.proId === userId
  }

  private static canChangeStatus(appointment: any, newStatus: AppointmentStatus, userId: string): boolean {
    const currentStatus = appointment.status
    const isPro = appointment.proId === userId
    const isClient = appointment.clientId === userId

    // Règles de transition de statut
    const allowedTransitions: Record<string, { allowed: string[], roles: string[] }> = {
      'PROPOSED': {
        allowed: ['ACCEPTED', 'CANCELLED'],
        roles: ['CLIENT']
      },
      'ACCEPTED': {
        allowed: ['CONFIRMED', 'CANCELLED'],
        roles: ['PRO']
      },
      'CONFIRMED': {
        allowed: ['PAID', 'CANCELLED'],
        roles: ['CLIENT', 'PRO']
      },
      'PAID': {
        allowed: ['IN_PROGRESS', 'CANCELLED'],
        roles: ['PRO']
      },
      'IN_PROGRESS': {
        allowed: ['COMPLETED', 'CANCELLED'],
        roles: ['PRO']
      }
    }

    const transition = allowedTransitions[currentStatus]
    if (!transition) return false

    if (!transition.allowed.includes(newStatus)) return false

    const userRole = isPro ? 'PRO' : 'CLIENT'
    if (!transition.roles.includes(userRole)) return false

    return true
  }

  private static canReceivePayment(appointment: any, payment: PaymentCreateInput): boolean {
    // Vérifier que l'appointment est dans un état qui permet le paiement
    if (!['ACCEPTED', 'CONFIRMED', 'PAID'].includes(appointment.status)) {
      return false
    }

    // Vérifier que le montant est cohérent
    if (payment.type === 'DEPOSIT') {
      const expectedDeposit = appointment.depositAmount || Math.round(appointment.price * 0.3)
      if (Math.abs(payment.amount - expectedDeposit) > 0.01) {
        return false
      }
    }

    if (payment.type === 'BALANCE') {
      const totalPaid = appointment.payments
        .filter((p: any) => p.status === 'COMPLETED')
        .reduce((sum: number, p: any) => sum + p.amount, 0)
      
      const expectedBalance = appointment.price - totalPaid
      if (Math.abs(payment.amount - expectedBalance) > 0.01) {
        return false
      }
    }

    return true
  }

  private static getNextAction(appointment: any, totalPaid: number, remainingAmount: number): string {
    switch (appointment.status) {
      case 'PROPOSED':
        return 'En attente de réponse du client'
      case 'ACCEPTED':
        if (totalPaid === 0) {
          return `Payer la caution (${appointment.depositAmount || Math.round(appointment.price * 0.3)}€)`
        }
        return 'En attente de confirmation du professionnel'
      case 'CONFIRMED':
        if (remainingAmount > 0) {
          return `Payer le solde (${remainingAmount}€)`
        }
        return 'Prêt pour le rendez-vous'
      case 'PAID':
        return 'En attente du début du rendez-vous'
      case 'IN_PROGRESS':
        return 'Rendez-vous en cours'
      case 'COMPLETED':
        return 'Rendez-vous terminé'
      case 'CANCELLED':
        return 'Rendez-vous annulé'
      default:
        return 'Statut inconnu'
    }
  }

  private static async createNotification(data: {
    userId: string
    title: string
    message: string
    type: string
    data?: any
  }) {
    try {
      await prisma.notification.create({
        data: {
          title: data.title,
          message: data.message,
          type: data.type as any,
          userId: data.userId,
          data: data.data || {}
        }
      })
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error)
    }
  }

  private static async createStatusHistory(
    appointmentId: string,
    userId: string,
    newStatus: AppointmentStatus,
    metadata?: any
  ) {
    try {
      await prisma.appointmentStatusHistory.create({
        data: {
          appointmentId,
          oldStatus: 'PROPOSED', // À améliorer pour récupérer l'ancien statut
          newStatus,
          changedBy: userId,
          reason: metadata?.reason || 'Changement de statut',
          metadata: metadata || {}
        }
      })
    } catch (error) {
      console.error('Erreur lors de la création de l\'historique:', error)
    }
  }

  private static async createStatusChangeNotifications(
    appointment: any,
    newStatus: AppointmentStatus,
    userId: string
  ) {
    const isPro = appointment.proId === userId
    const otherUserId = isPro ? appointment.clientId : appointment.proId

    let title = ''
    let message = ''

    switch (newStatus) {
      case 'ACCEPTED':
        title = 'Proposition acceptée'
        message = `Votre proposition "${appointment.title}" a été acceptée`
        break
      case 'CONFIRMED':
        title = 'Rendez-vous confirmé'
        message = `Le rendez-vous "${appointment.title}" est confirmé`
        break
      case 'PAID':
        title = 'Paiement reçu'
        message = `Le paiement pour "${appointment.title}" a été reçu`
        break
      case 'IN_PROGRESS':
        title = 'Rendez-vous commencé'
        message = `Le rendez-vous "${appointment.title}" a commencé`
        break
      case 'COMPLETED':
        title = 'Rendez-vous terminé'
        message = `Le rendez-vous "${appointment.title}" est terminé`
        break
      case 'CANCELLED':
        title = 'Rendez-vous annulé'
        message = `Le rendez-vous "${appointment.title}" a été annulé`
        break
    }

    if (title && message) {
      await this.createNotification({
        userId: otherUserId,
        title,
        message,
        type: 'APPOINTMENT',
        data: { appointmentId: appointment.id, status: newStatus }
      })
    }
  }
}
