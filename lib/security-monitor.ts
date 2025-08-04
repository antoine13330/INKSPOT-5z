import { auditLogger } from './audit-logger'
import { secretsManager } from './secrets-manager'

export interface SecurityAlert {
  id: string
  type: 'THREAT' | 'VULNERABILITY' | 'ANOMALY' | 'COMPLIANCE'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  timestamp: Date
  source: string
  metadata: Record<string, any>
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
}

export interface SecurityMetrics {
  totalAlerts: number
  criticalAlerts: number
  highAlerts: number
  mediumAlerts: number
  lowAlerts: number
  resolvedAlerts: number
  averageResponseTime: number
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

class SecurityMonitor {
  private static instance: SecurityMonitor
  private alerts: Map<string, SecurityAlert> = new Map()
  private alertHandlers: Map<string, (alert: SecurityAlert) => Promise<void>> = new Map()

  private constructor() {
    this.setupDefaultHandlers()
  }

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor()
    }
    return SecurityMonitor.instance
  }

  private setupDefaultHandlers() {
    // Register default alert handlers
    this.registerAlertHandler('THREAT', this.handleThreatAlert.bind(this))
    this.registerAlertHandler('VULNERABILITY', this.handleVulnerabilityAlert.bind(this))
    this.registerAlertHandler('ANOMALY', this.handleAnomalyAlert.bind(this))
    this.registerAlertHandler('COMPLIANCE', this.handleComplianceAlert.bind(this))
  }

  // Create a new security alert
  async createAlert(
    type: SecurityAlert['type'],
    severity: SecurityAlert['severity'],
    title: string,
    description: string,
    source: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      type,
      severity,
      title,
      description,
      timestamp: new Date(),
      source,
      metadata,
      resolved: false,
    }

    this.alerts.set(alert.id, alert)

    // Log the alert
    await auditLogger.logSecurityEvent({
      action: 'SECURITY_ALERT_CREATED',
      resource: source,
      details: {
        alertId: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        metadata: alert.metadata,
      },
      timestamp: alert.timestamp,
      severity: alert.severity,
      type: 'SECURITY',
      success: true,
    })

    // Trigger alert handler
    await this.triggerAlertHandler(alert)

    return alert.id
  }

  // Register a custom alert handler
  registerAlertHandler(type: string, handler: (alert: SecurityAlert) => Promise<void>): void {
    this.alertHandlers.set(type, handler)
  }

  // Trigger the appropriate handler for an alert
  private async triggerAlertHandler(alert: SecurityAlert): Promise<void> {
    const handler = this.alertHandlers.get(alert.type)
    if (handler) {
      try {
        await handler(alert)
      } catch (error) {
        console.error(`Error handling ${alert.type} alert:`, error)
      }
    }
  }

  // Handle threat alerts
  private async handleThreatAlert(alert: SecurityAlert): Promise<void> {
    // Send immediate notification for threats
    await this.sendNotification(alert, 'URGENT')
    
    // Log to external security service
    if (process.env.SECURITY_SERVICE_URL) {
      await this.sendToExternalService(alert)
    }
  }

  // Handle vulnerability alerts
  private async handleVulnerabilityAlert(alert: SecurityAlert): Promise<void> {
    // Schedule vulnerability assessment
    await this.scheduleVulnerabilityAssessment(alert)
    
    // Send notification
    await this.sendNotification(alert, 'HIGH')
  }

  // Handle anomaly alerts
  private async handleAnomalyAlert(alert: SecurityAlert): Promise<void> {
    // Analyze the anomaly
    await this.analyzeAnomaly(alert)
    
    // Send notification if severity is high
    if (alert.severity === 'HIGH' || alert.severity === 'CRITICAL') {
      await this.sendNotification(alert, 'MEDIUM')
    }
  }

  // Handle compliance alerts
  private async handleComplianceAlert(alert: SecurityAlert): Promise<void> {
    // Log compliance violation
    await auditLogger.logSecurityEvent({
      action: 'COMPLIANCE_VIOLATION',
      resource: alert.source,
      details: alert.metadata,
      timestamp: alert.timestamp,
      severity: alert.severity,
      type: 'SECURITY',
      success: false,
      errorMessage: alert.description,
    })
    
    // Send notification
    await this.sendNotification(alert, 'HIGH')
  }

  // Send notification
  private async sendNotification(alert: SecurityAlert, priority: string): Promise<void> {
    // Implementation would integrate with notification service
    // (email, Slack, SMS, etc.)
    console.log(`[${priority}] Security Alert: ${alert.title}`, {
      severity: alert.severity,
      source: alert.source,
      timestamp: alert.timestamp,
    })
  }

  // Send to external security service
  private async sendToExternalService(alert: SecurityAlert): Promise<void> {
    try {
      await fetch(process.env.SECURITY_SERVICE_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SECURITY_SERVICE_TOKEN}`,
        },
        body: JSON.stringify(alert),
      })
    } catch (error) {
      console.error('Failed to send alert to external service:', error)
    }
  }

  // Schedule vulnerability assessment
  private async scheduleVulnerabilityAssessment(alert: SecurityAlert): Promise<void> {
    // Implementation would schedule a vulnerability scan
    console.log(`Scheduling vulnerability assessment for alert: ${alert.id}`)
  }

  // Analyze anomaly
  private async analyzeAnomaly(alert: SecurityAlert): Promise<void> {
    // Implementation would analyze the anomaly pattern
    console.log(`Analyzing anomaly: ${alert.id}`)
  }

  // Resolve an alert
  async resolveAlert(alertId: string, resolvedBy: string): Promise<boolean> {
    const alert = this.alerts.get(alertId)
    if (!alert) {
      return false
    }

    alert.resolved = true
    alert.resolvedAt = new Date()
    alert.resolvedBy = resolvedBy

    // Log resolution
    await auditLogger.logSecurityEvent({
      action: 'SECURITY_ALERT_RESOLVED',
      resource: alert.source,
      details: {
        alertId: alert.id,
        resolvedBy: alert.resolvedBy,
        resolutionTime: alert.resolvedAt.getTime() - alert.timestamp.getTime(),
      },
      timestamp: new Date(),
      severity: 'LOW',
      type: 'SECURITY',
      success: true,
    })

    return true
  }

  // Get security metrics
  getSecurityMetrics(): SecurityMetrics {
    const alerts = Array.from(this.alerts.values())
    const resolvedAlerts = alerts.filter(alert => alert.resolved)
    const unresolvedAlerts = alerts.filter(alert => !alert.resolved)

    const criticalAlerts = unresolvedAlerts.filter(alert => alert.severity === 'CRITICAL').length
    const highAlerts = unresolvedAlerts.filter(alert => alert.severity === 'HIGH').length
    const mediumAlerts = unresolvedAlerts.filter(alert => alert.severity === 'MEDIUM').length
    const lowAlerts = unresolvedAlerts.filter(alert => alert.severity === 'LOW').length

    // Calculate threat level
    let threatLevel: SecurityMetrics['threatLevel'] = 'LOW'
    if (criticalAlerts > 0) threatLevel = 'CRITICAL'
    else if (highAlerts > 2) threatLevel = 'HIGH'
    else if (highAlerts > 0 || mediumAlerts > 5) threatLevel = 'MEDIUM'

    // Calculate average response time
    const responseTimes = resolvedAlerts
      .filter(alert => alert.resolvedAt)
      .map(alert => alert.resolvedAt!.getTime() - alert.timestamp.getTime())
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0

    return {
      totalAlerts: alerts.length,
      criticalAlerts,
      highAlerts,
      mediumAlerts,
      lowAlerts,
      resolvedAlerts: resolvedAlerts.length,
      averageResponseTime,
      threatLevel,
    }
  }

  // Get alerts with filters
  getAlerts(filters: {
    type?: SecurityAlert['type']
    severity?: SecurityAlert['severity']
    resolved?: boolean
    startDate?: Date
    endDate?: Date
  } = {}): SecurityAlert[] {
    let alerts = Array.from(this.alerts.values())

    if (filters.type) {
      alerts = alerts.filter(alert => alert.type === filters.type)
    }

    if (filters.severity) {
      alerts = alerts.filter(alert => alert.severity === filters.severity)
    }

    if (filters.resolved !== undefined) {
      alerts = alerts.filter(alert => alert.resolved === filters.resolved)
    }

    if (filters.startDate) {
      alerts = alerts.filter(alert => alert.timestamp >= filters.startDate!)
    }

    if (filters.endDate) {
      alerts = alerts.filter(alert => alert.timestamp <= filters.endDate!)
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Generate unique alert ID
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Monitor for security threats
  async monitorForThreats(): Promise<void> {
    // Check for suspicious activities
    await this.checkForSuspiciousActivities()
    
    // Check for vulnerabilities
    await this.checkForVulnerabilities()
    
    // Check for compliance violations
    await this.checkForComplianceViolations()
  }

  private async checkForSuspiciousActivities(): Promise<void> {
    // Implementation would check for suspicious patterns
    // This is a placeholder for the actual implementation
  }

  private async checkForVulnerabilities(): Promise<void> {
    // Implementation would check for known vulnerabilities
    // This is a placeholder for the actual implementation
  }

  private async checkForComplianceViolations(): Promise<void> {
    // Implementation would check for compliance violations
    // This is a placeholder for the actual implementation
  }
}

export const securityMonitor = SecurityMonitor.getInstance() 