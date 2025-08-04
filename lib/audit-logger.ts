import { prisma } from './prisma'

export interface AuditEvent {
  userId?: string
  action: string
  resource: string
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface SecurityEvent extends AuditEvent {
  type: 'AUTHENTICATION' | 'AUTHORIZATION' | 'DATA_ACCESS' | 'SYSTEM' | 'SECURITY'
  success: boolean
  errorMessage?: string
}

class AuditLogger {
  private static instance: AuditLogger

  private constructor() {}

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Log to database
      await prisma.auditLog.create({
        data: {
          userId: event.userId,
          action: event.action,
          resource: event.resource,
          details: event.details,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          timestamp: event.timestamp,
          severity: event.severity,
          type: event.type,
          success: event.success,
          errorMessage: event.errorMessage,
        },
      })

      // Log to console for development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AUDIT] ${event.type}: ${event.action} on ${event.resource}`, {
          userId: event.userId,
          success: event.success,
          severity: event.severity,
          timestamp: event.timestamp,
        })
      }

      // Log high severity events to external service (if configured)
      if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
        await this.logToExternalService(event)
      }
    } catch (error) {
      console.error('Failed to log audit event:', error)
    }
  }

  async logAuthenticationEvent(
    userId: string,
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_RESET' | 'ACCOUNT_LOCKED',
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      userId,
      action,
      resource: 'AUTH',
      details: details || {},
      ipAddress,
      userAgent,
      timestamp: new Date(),
      severity: success ? 'LOW' : 'HIGH',
      type: 'AUTHENTICATION',
      success,
    })
  }

  async logDataAccessEvent(
    userId: string,
    action: string,
    resource: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      userId,
      action,
      resource,
      details: details || {},
      ipAddress,
      userAgent,
      timestamp: new Date(),
      severity: 'MEDIUM',
      type: 'DATA_ACCESS',
      success,
    })
  }

  async logSystemEvent(
    action: string,
    resource: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      action,
      resource,
      details: details || {},
      timestamp: new Date(),
      severity,
      type: 'SYSTEM',
      success: true,
    })
  }

  private async logToExternalService(event: SecurityEvent): Promise<void> {
    // Implementation for external logging service (e.g., DataDog, LogRocket)
    // This would be configured based on environment
    if (process.env.EXTERNAL_LOGGING_URL) {
      try {
        await fetch(process.env.EXTERNAL_LOGGING_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.EXTERNAL_LOGGING_TOKEN}`,
          },
          body: JSON.stringify(event),
        })
      } catch (error) {
        console.error('Failed to log to external service:', error)
      }
    }
  }

  async getAuditLogs(
    filters: {
      userId?: string
      action?: string
      resource?: string
      severity?: string[]
      type?: string[]
      startDate?: Date
      endDate?: Date
    },
    page: number = 1,
    limit: number = 50
  ) {
    const where: any = {}

    if (filters.userId) where.userId = filters.userId
    if (filters.action) where.action = filters.action
    if (filters.resource) where.resource = filters.resource
    if (filters.severity?.length) where.severity = { in: filters.severity }
    if (filters.type?.length) where.type = { in: filters.type }
    if (filters.startDate || filters.endDate) {
      where.timestamp = {}
      if (filters.startDate) where.timestamp.gte = filters.startDate
      if (filters.endDate) where.timestamp.lte = filters.endDate
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }
}

export const auditLogger = AuditLogger.getInstance() 