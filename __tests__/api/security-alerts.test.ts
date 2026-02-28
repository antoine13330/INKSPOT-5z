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
      const mockAlerts: any[] = []
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
      const mockAlerts: any[] = []
      ;(securityMonitor.getAlerts as jest.Mock).mockResolvedValue(mockAlerts)
      ;(securityMonitor.getSecurityMetrics as jest.Mock).mockReturnValue({})
      ;(auditLogger.logDataAccessEvent as jest.Mock).mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000/api/security/alerts', {
      headers: {
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'unknown',
      },
    })
    await GET(request)

      expect(auditLogger.logDataAccessEvent).toHaveBeenCalledWith(
        'admin',
        'GET_SECURITY_ALERTS',
        'security/alerts',
        true,
        '127.0.0.1',
        'unknown',
        { filters: {}, alertCount: 0 }
      )
    })

    it('should handle errors gracefully', async () => {
      ;(securityMonitor.getAlerts as jest.Mock).mockRejectedValue(new Error('Database error'))
      ;(securityMonitor.getSecurityMetrics as jest.Mock).mockReturnValue({})
      ;(auditLogger.logDataAccessEvent as jest.Mock).mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000/api/security/alerts', {
      headers: {
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'unknown',
      },
    })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch security alerts')
      expect(auditLogger.logDataAccessEvent).toHaveBeenCalledWith(
        'admin',
        'GET_SECURITY_ALERTS',
        'security/alerts',
        false,
        '127.0.0.1',
        'unknown',
        { error: 'Database error' }
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
      
      // Configure mocks properly
      const createAlertMock = jest.fn().mockResolvedValue(mockAlertId)
      const logDataAccessEventMock = jest.fn().mockResolvedValue(undefined)
      
      // Replace the mocked functions
      ;(securityMonitor.createAlert as jest.Mock).mockImplementation(createAlertMock)
      ;(auditLogger.logDataAccessEvent as jest.Mock).mockImplementation(logDataAccessEventMock)

      const request = new NextRequest('http://localhost:3000/api/security/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      })

      const response = await POST(request)
      const data = await response.json()

      // Debug: afficher ce qui s'est passé
      console.log('Response status:', response.status)
      console.log('Response data:', data)
      console.log('CreateAlert called:', createAlertMock.mock.calls)
      console.log('LogDataAccessEvent called:', logDataAccessEventMock.mock.calls)

      expect(response.status).toBe(200)
      expect(data.alertId).toBe(mockAlertId)
      expect(data.message).toBe('Security alert created successfully')
      expect(createAlertMock).toHaveBeenCalledWith(
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
      
      // Configure mocks properly
      const createAlertMock = jest.fn().mockResolvedValue(mockAlertId)
      const logDataAccessEventMock = jest.fn().mockResolvedValue(undefined)
      
      ;(securityMonitor.createAlert as jest.Mock).mockImplementation(createAlertMock)
      ;(auditLogger.logDataAccessEvent as jest.Mock).mockImplementation(logDataAccessEventMock)

      const request = new NextRequest('http://localhost:3000/api/security/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      })

      await POST(request)

      expect(logDataAccessEventMock).toHaveBeenCalledWith(
        'admin',
        'CREATE_SECURITY_ALERT',
        'security/alerts',
        true,
        '127.0.0.1',
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

      // Configure mocks properly for error case
      const createAlertMock = jest.fn().mockRejectedValue(new Error('Creation failed'))
      const logDataAccessEventMock = jest.fn().mockResolvedValue(undefined)
      
      ;(securityMonitor.createAlert as jest.Mock).mockImplementation(createAlertMock)
      ;(auditLogger.logDataAccessEvent as jest.Mock).mockImplementation(logDataAccessEventMock)

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
      expect(logDataAccessEventMock).toHaveBeenCalledWith(
        'admin',
        'CREATE_SECURITY_ALERT',
        'security/alerts',
        false,
        '127.0.0.1',
        'unknown',
        expect.objectContaining({
          error: 'Creation failed',
        })
      )
    })
  })
}) 