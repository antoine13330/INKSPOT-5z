import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/security/alerts/route'
import { securityMonitor } from '@/lib/security-monitor'
import { auditLogger } from '@/lib/audit-logger'

// Mock security monitor
jest.mock('@/lib/security-monitor', () => ({
  securityMonitor: {
    getAlerts: jest.fn(),
    getSecurityMetrics: jest.fn(),
    createAlert: jest.fn(),
  },
}))

// Mock audit logger
jest.mock('@/lib/audit-logger', () => ({
  auditLogger: {
    logDataAccessEvent: jest.fn(),
  },
}))

describe('Security Alerts API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/security/alerts', () => {
    it('should return alerts with filters', async () => {
      const mockAlerts = [
        {
          id: '1',
          type: 'THREAT',
          severity: 'HIGH',
          title: 'Test Alert',
          description: 'Test Description',
          timestamp: new Date(),
          source: 'test',
          metadata: {},
          resolved: false,
        },
      ]

      const mockMetrics = {
        totalAlerts: 1,
        criticalAlerts: 0,
        highAlerts: 1,
        mediumAlerts: 0,
        lowAlerts: 0,
        resolvedAlerts: 0,
        averageResponseTime: 100,
        threatLevel: 'HIGH' as const,
      }

      ;(securityMonitor.getAlerts as jest.Mock).mockResolvedValue(mockAlerts)
      ;(securityMonitor.getSecurityMetrics as jest.Mock).mockReturnValue(mockMetrics)
      ;(auditLogger.logDataAccessEvent as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/security/alerts?type=THREAT&severity=HIGH')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.alerts).toEqual(mockAlerts)
      expect(data.metrics).toEqual(mockMetrics)
      expect(data.total).toBe(1)
    })

    it('should handle query parameters correctly', async () => {
      const mockAlerts = []
      ;(securityMonitor.getAlerts as jest.Mock).mockResolvedValue(mockAlerts)
      ;(securityMonitor.getSecurityMetrics as jest.Mock).mockReturnValue({})
      ;(auditLogger.logDataAccessEvent as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/security/alerts?type=THREAT&resolved=false&startDate=2024-01-01&endDate=2024-01-31')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(securityMonitor.getAlerts).toHaveBeenCalledWith({
        type: 'THREAT',
        resolved: false,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      })
    })

    it('should log data access event', async () => {
      const mockAlerts = []
      ;(securityMonitor.getAlerts as jest.Mock).mockResolvedValue(mockAlerts)
      ;(securityMonitor.getSecurityMetrics as jest.Mock).mockReturnValue({})
      ;(auditLogger.logDataAccessEvent as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/security/alerts')
      await GET(request)

      expect(auditLogger.logDataAccessEvent).toHaveBeenCalledWith(
        'admin',
        'GET_SECURITY_ALERTS',
        'security/alerts',
        true,
        'unknown',
        'unknown',
        expect.objectContaining({
          filters: expect.any(Object),
          alertCount: 0,
        })
      )
    })

    it('should handle errors gracefully', async () => {
      ;(securityMonitor.getAlerts as jest.Mock).mockRejectedValue(new Error('Database error'))
      ;(auditLogger.logDataAccessEvent as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/security/alerts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch security alerts')
      expect(auditLogger.logDataAccessEvent).toHaveBeenCalledWith(
        'admin',
        'GET_SECURITY_ALERTS',
        'security/alerts',
        false,
        'unknown',
        'unknown',
        expect.objectContaining({
          error: 'Database error',
        })
      )
    })
  })

  describe('POST /api/security/alerts', () => {
    it('should create new security alert', async () => {
      const alertData = {
        type: 'THREAT',
        severity: 'HIGH',
        title: 'Test Alert',
        description: 'Test Description',
        source: 'test',
        metadata: { test: 'data' },
      }

      const mockAlertId = 'alert-123'
      ;(securityMonitor.createAlert as jest.Mock).mockResolvedValue(mockAlertId)
      ;(auditLogger.logDataAccessEvent as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/security/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.alertId).toBe(mockAlertId)
      expect(data.message).toBe('Security alert created successfully')
      expect(securityMonitor.createAlert).toHaveBeenCalledWith(
        'THREAT',
        'HIGH',
        'Test Alert',
        'Test Description',
        'test',
        { test: 'data' }
      )
    })

    it('should validate required fields', async () => {
      const invalidAlertData = {
        type: 'THREAT',
        // Missing required fields
      }

      const request = new NextRequest('http://localhost:3000/api/security/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidAlertData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields')
    })

    it('should log alert creation', async () => {
      const alertData = {
        type: 'THREAT',
        severity: 'HIGH',
        title: 'Test Alert',
        description: 'Test Description',
        source: 'test',
      }

      const mockAlertId = 'alert-123'
      ;(securityMonitor.createAlert as jest.Mock).mockResolvedValue(mockAlertId)
      ;(auditLogger.logDataAccessEvent as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/security/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      })

      await POST(request)

      expect(auditLogger.logDataAccessEvent).toHaveBeenCalledWith(
        'admin',
        'CREATE_SECURITY_ALERT',
        'security/alerts',
        true,
        'unknown',
        'unknown',
        expect.objectContaining({
          alertId: 'alert-123',
          type: 'THREAT',
          severity: 'HIGH',
          title: 'Test Alert',
        })
      )
    })

    it('should handle creation errors', async () => {
      const alertData = {
        type: 'THREAT',
        severity: 'HIGH',
        title: 'Test Alert',
        description: 'Test Description',
        source: 'test',
      }

      ;(securityMonitor.createAlert as jest.Mock).mockRejectedValue(new Error('Creation failed'))
      ;(auditLogger.logDataAccessEvent as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/security/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create security alert')
      expect(auditLogger.logDataAccessEvent).toHaveBeenCalledWith(
        'admin',
        'CREATE_SECURITY_ALERT',
        'security/alerts',
        false,
        'unknown',
        'unknown',
        expect.objectContaining({
          error: 'Creation failed',
        })
      )
    })
  })
}) 