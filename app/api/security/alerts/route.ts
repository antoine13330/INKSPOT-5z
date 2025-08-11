import { NextRequest, NextResponse } from 'next/server'
import { securityMonitor } from '@/lib/security-monitor'
import { auditLogger } from '@/lib/audit-logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const severity = searchParams.get('severity')
    const resolved = searchParams.get('resolved')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const filters: unknown = {}
    if (type) filters.type = type
    if (severity) filters.severity = severity
    if (resolved !== null) filters.resolved = resolved === 'true'
    if (startDate) filters.startDate = new Date(startDate)
    if (endDate) filters.endDate = new Date(endDate)

    const alerts = securityMonitor.getAlerts(filters)
    const metrics = securityMonitor.getSecurityMetrics()

    // Log the request
    await auditLogger.logDataAccessEvent(
      'admin',
      'GET_SECURITY_ALERTS',
      'security/alerts',
      true,
      request.ip || 'unknown',
      request.headers.get('user-agent') || 'unknown',
      { filters, alertCount: alerts.length }
    )

    return NextResponse.json({
      alerts,
      metrics,
      total: alerts.length,
    })
  } catch (error) {
    console.error('Error fetching security alerts:', error)
    
    await auditLogger.logDataAccessEvent(
      'admin',
      'GET_SECURITY_ALERTS',
      'security/alerts',
      false,
      request.ip || 'unknown',
      request.headers.get('user-agent') || 'unknown',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    )

    return NextResponse.json(
      { error: 'Failed to fetch security alerts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, severity, title, description, source, metadata } = body

    // Validate required fields
    if (!type || !severity || !title || !description || !source) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const alertId = await securityMonitor.createAlert(
      type,
      severity,
      title,
      description,
      source,
      metadata
    )

    // Log the alert creation
    await auditLogger.logDataAccessEvent(
      'admin',
      'CREATE_SECURITY_ALERT',
      'security/alerts',
      true,
      request.ip || 'unknown',
      request.headers.get('user-agent') || 'unknown',
      { alertId, type, severity, title }
    )

    return NextResponse.json({
      alertId,
      message: 'Security alert created successfully',
    })
  } catch (error) {
    console.error('Error creating security alert:', error)
    
    await auditLogger.logDataAccessEvent(
      'admin',
      'CREATE_SECURITY_ALERT',
      'security/alerts',
      false,
      request.ip || 'unknown',
      request.headers.get('user-agent') || 'unknown',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    )

    return NextResponse.json(
      { error: 'Failed to create security alert' },
      { status: 500 }
    )
  }
} 