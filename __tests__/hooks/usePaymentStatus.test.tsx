import { renderHook, act } from '@testing-library/react'
import { usePaymentStatus } from '@/hooks/usePaymentStatus'
import { useSession } from 'next-auth/react'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn()
}))

// Mock WebSocket
const mockWebSocket = {
  readyState: 1, // WebSocket.OPEN
  close: jest.fn(),
  send: jest.fn()
}

global.WebSocket = jest.fn(() => mockWebSocket) as any

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    info: jest.fn(),
    error: jest.fn()
  }
}))

describe('usePaymentStatus', () => {
  const mockSession = {
    user: { id: 'user123' },
    expires: '2024-12-31'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSession as jest.Mock).mockReturnValue({ data: mockSession })
    
    // Mock process.env
    process.env.NEXT_PUBLIC_WS_URL = 'ws://localhost:3001'
  })

  it('should connect to WebSocket when session is available', () => {
    renderHook(() => usePaymentStatus())
    
    expect(WebSocket).toHaveBeenCalledWith(
      'ws://localhost:3001/ws?userId=user123'
    )
  })

  it('should handle payment confirmed events', () => {
    const onPaymentConfirmed = jest.fn()
    
    renderHook(() => usePaymentStatus({
      onPaymentConfirmed
    }))

    // Simuler un message WebSocket
    const mockMessage = {
      data: JSON.stringify({
        type: 'PAYMENT_CONFIRMED',
        appointmentId: 'app123',
        status: 'PAID',
        timestamp: new Date().toISOString()
      })
    }

    // Déclencher l'événement onmessage
    act(() => {
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage(mockMessage as any)
      }
    })

    expect(onPaymentConfirmed).toHaveBeenCalledWith({
      type: 'PAYMENT_CONFIRMED',
      appointmentId: 'app123',
      status: 'PAID',
      timestamp: expect.any(String)
    })
  })

  it('should handle status updated events', () => {
    const onStatusUpdated = jest.fn()
    
    renderHook(() => usePaymentStatus({
      onStatusUpdated
    }))

    // Simuler un message WebSocket
    const mockMessage = {
      data: JSON.stringify({
        type: 'APPOINTMENT_STATUS_UPDATED',
        appointmentId: 'app123',
        status: 'CONFIRMED',
        timestamp: new Date().toISOString()
      })
    }

    // Déclencher l'événement onmessage
    act(() => {
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage(mockMessage as any)
      }
    })

    expect(onStatusUpdated).toHaveBeenCalledWith({
      type: 'APPOINTMENT_STATUS_UPDATED',
      appointmentId: 'app123',
      status: 'CONFIRMED',
      timestamp: expect.any(String)
    })
  })

  it('should not connect when no session', () => {
    ;(useSession as jest.Mock).mockReturnValue({ data: null })
    
    renderHook(() => usePaymentStatus())
    
    expect(WebSocket).not.toHaveBeenCalled()
  })

  it('should handle WebSocket connection errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    
    renderHook(() => usePaymentStatus())
    
    // Simuler une erreur WebSocket
    act(() => {
      if (mockWebSocket.onerror) {
        mockWebSocket.onerror(new Error('Connection failed'))
      }
    })

    expect(consoleSpy).toHaveBeenCalledWith('WebSocket error:', expect.any(Error))
    consoleSpy.mockRestore()
  })

  it('should emit refresh event when refreshData is called', () => {
    const { result } = renderHook(() => usePaymentStatus())
    
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent')
    
    act(() => {
      result.current.refreshData()
    })

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'payment-status-refresh'
      })
    )
    
    dispatchEventSpy.mockRestore()
  })
})

