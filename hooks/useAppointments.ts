import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { AppointmentStatus, AppointmentType } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface AppointmentFilters {
  status?: AppointmentStatus[]
  type?: AppointmentType[]
  dateRange?: {
    start: Date
    end: Date
  }
  search?: string
}

export interface AppointmentSort {
  field: 'startDate' | 'price' | 'createdAt' | 'title'
  direction: 'asc' | 'desc'
}

export interface UseAppointmentsOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  filters?: AppointmentFilters
  sort?: AppointmentSort
  limit?: number
  enabled?: boolean
}

export interface AppointmentState {
  appointments: any[]
  loading: boolean
  error: string | null
  total: number
  hasMore: boolean
  filters: AppointmentFilters
  sort: AppointmentSort
}

export interface AppointmentActions {
  createAppointment: (data: any) => Promise<any>
  updateAppointment: (id: string, data: any) => Promise<any>
  changeStatus: (id: string, status: AppointmentStatus, reason?: string) => Promise<any>
  cancelAppointment: (id: string, reason?: string) => Promise<any>
  refresh: () => Promise<void>
  loadMore: () => Promise<void>
  updateFilters: (filters: Partial<AppointmentFilters>) => void
  updateSort: (sort: Partial<AppointmentSort>) => void
  resetFilters: () => void
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useAppointments(options: UseAppointmentsOptions = {}): [AppointmentState, AppointmentActions] {
  const { data: session } = useSession()
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 secondes
    filters: initialFilters = {},
    sort: initialSort = { field: 'startDate', direction: 'desc' },
    limit = 20,
    enabled = true
  } = options

  // ========================================================================
  // ÉTAT LOCAL
  // ========================================================================
  
  const [state, setState] = useState<AppointmentState>({
    appointments: [],
    loading: false,
    error: null,
    total: 0,
    hasMore: false,
    filters: initialFilters,
    sort: initialSort
  })

  const [offset, setOffset] = useState(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ========================================================================
  // FONCTIONS UTILITAIRES
  // ========================================================================
  
  const buildQueryString = useCallback((filters: AppointmentFilters, sort: AppointmentSort, offset: number) => {
    const params = new URLSearchParams()
    
    if (filters.status?.length) {
      params.append('status', filters.status.join(','))
    }
    
    if (filters.type?.length) {
      params.append('type', filters.type.join(','))
    }
    
    if (filters.dateRange?.start) {
      params.append('startDate', filters.dateRange.start.toISOString())
    }
    
    if (filters.dateRange?.end) {
      params.append('endDate', filters.dateRange.end.toISOString())
    }
    
    if (filters.search) {
      params.append('search', filters.search)
    }
    
    params.append('sort', `${sort.field}:${sort.direction}`)
    params.append('limit', limit.toString())
    params.append('offset', offset.toString())
    
    return params.toString()
  }, [limit])

  const handleError = useCallback((error: any, context: string) => {
    console.error(`Erreur ${context}:`, error)
    
    let message = 'Une erreur est survenue'
    if (error.message) {
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    }
    
    setState(prev => ({ ...prev, error: message }))
    toast.error(message)
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // ========================================================================
  // CHARGEMENT DES DONNÉES
  // ========================================================================
  
  const fetchAppointments = useCallback(async (isLoadMore = false) => {
    if (!session?.user?.id || !enabled) return

    try {
      // Annuler la requête précédente si elle existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()
      
      setState(prev => ({ 
        ...prev, 
        loading: true,
        error: null 
      }))

      const currentOffset = isLoadMore ? offset : 0
      const queryString = buildQueryString(state.filters, state.sort, currentOffset)
      
      const response = await fetch(`/api/appointments?${queryString}`, {
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setState(prev => ({
          ...prev,
          appointments: isLoadMore ? [...prev.appointments, ...data.appointments] : data.appointments,
          total: data.total,
          hasMore: data.appointments.length === limit,
          loading: false,
          error: null
        }))
        
        if (!isLoadMore) {
          setOffset(0)
        } else {
          setOffset(prev => prev + limit)
        }
      } else {
        throw new Error(data.error || 'Erreur lors du chargement')
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return
      
      handleError(error, 'lors du chargement des appointments')
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [session?.user?.id, enabled, state.filters, state.sort, offset, buildQueryString, limit, handleError])

  // ========================================================================
  // ACTIONS SUR LES APPOINTMENTS
  // ========================================================================
  
  const createAppointment = useCallback(async (data: any): Promise<any> => {
    if (!session?.user?.id) {
      throw new Error('Utilisateur non connecté')
    }

    try {
      clearError()
      
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création')
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success('Appointment créé avec succès')
        await refresh()
        return result.appointment
      } else {
        throw new Error(result.error || 'Erreur lors de la création')
      }
    } catch (error: any) {
      handleError(error, 'lors de la création de l\'appointment')
      throw error
    }
  }, [session?.user?.id, clearError, handleError, refresh])

  const updateAppointment = useCallback(async (id: string, data: any): Promise<any> => {
    if (!session?.user?.id) {
      throw new Error('Utilisateur non connecté')
    }

    try {
      clearError()
      
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour')
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success('Appointment mis à jour avec succès')
        await refresh()
        return result.appointment
      } else {
        throw new Error(result.error || 'Erreur lors de la mise à jour')
      }
    } catch (error: any) {
      handleError(error, 'lors de la mise à jour de l\'appointment')
      throw error
    }
  }, [session?.user?.id, clearError, handleError, refresh])

  const changeStatus = useCallback(async (id: string, status: AppointmentStatus, reason?: string): Promise<any> => {
    if (!session?.user?.id) {
      throw new Error('Utilisateur non connecté')
    }

    try {
      clearError()
      
      const response = await fetch(`/api/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors du changement de statut')
      }

      const result = await response.json()
      
      if (result.success) {
        const statusLabels: Record<AppointmentStatus, string> = {
          PROPOSED: 'proposé',
          ACCEPTED: 'accepté',
          CONFIRMED: 'confirmé',
          PAID: 'payé',
          IN_PROGRESS: 'en cours',
          COMPLETED: 'terminé',
          CANCELLED: 'annulé',
          NO_SHOW: 'absent',
          DRAFT: 'brouillon'
        }
        
        toast.success(`Appointment ${statusLabels[status]} avec succès`)
        await refresh()
        return result.appointment
      } else {
        throw new Error(result.error || 'Erreur lors du changement de statut')
      }
    } catch (error: any) {
      handleError(error, 'lors du changement de statut')
      throw error
    }
  }, [session?.user?.id, clearError, handleError, refresh])

  const cancelAppointment = useCallback(async (id: string, reason?: string): Promise<any> => {
    return changeStatus(id, 'CANCELLED', reason)
  }, [changeStatus])

  const refresh = useCallback(async () => {
    await fetchAppointments(false)
  }, [fetchAppointments])

  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore) return
    await fetchAppointments(true)
  }, [state.loading, state.hasMore, fetchAppointments])

  // ========================================================================
  // GESTION DES FILTRES ET TRI
  // ========================================================================
  
  const updateFilters = useCallback((newFilters: Partial<AppointmentFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }))
    setOffset(0)
  }, [])

  const updateSort = useCallback((newSort: Partial<AppointmentSort>) => {
    setState(prev => ({
      ...prev,
      sort: { ...prev.sort, ...newSort }
    }))
    setOffset(0)
  }, [])

  const resetFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: initialFilters,
      sort: initialSort
    }))
    setOffset(0)
  }, [initialFilters, initialSort])

  // ========================================================================
  // EFFETS
  // ========================================================================
  
  // Chargement initial
  useEffect(() => {
    if (enabled && session?.user?.id) {
      fetchAppointments(false)
    }
  }, [enabled, session?.user?.id, fetchAppointments])

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && enabled && session?.user?.id) {
      refreshTimeoutRef.current = setInterval(() => {
        fetchAppointments(false)
      }, refreshInterval)

      return () => {
        if (refreshTimeoutRef.current) {
          clearInterval(refreshTimeoutRef.current)
        }
      }
    }
  }, [autoRefresh, enabled, session?.user?.id, refreshInterval, fetchAppointments])

  // Nettoyage
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current)
      }
    }
  }, [])

  // ========================================================================
  // RETOUR
  // ========================================================================
  
  const actions: AppointmentActions = {
    createAppointment,
    updateAppointment,
    changeStatus,
    cancelAppointment,
    refresh,
    loadMore,
    updateFilters,
    updateSort,
    resetFilters
  }

  return [state, actions]
}

// ============================================================================
// HOOKS SPÉCIALISÉS
// ============================================================================

export function useAppointmentById(id: string, enabled = true) {
  const { data: session } = useSession()
  const [appointment, setAppointment] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAppointment = useCallback(async () => {
    if (!id || !session?.user?.id || !enabled) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/appointments/${id}`)
      
      if (!response.ok) {
        throw new Error('Appointment non trouvé')
      }

      const data = await response.json()
      
      if (data.success) {
        setAppointment(data.appointment)
      } else {
        throw new Error(data.error || 'Erreur lors du chargement')
      }
    } catch (error: any) {
      setError(error.message)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [id, session?.user?.id, enabled])

  useEffect(() => {
    fetchAppointment()
  }, [fetchAppointment])

  const refresh = useCallback(() => {
    fetchAppointment()
  }, [fetchAppointment])

  return { appointment, loading, error, refresh }
}

export function useAppointmentPayments(appointmentId: string, enabled = true) {
  const { data: session } = useSession()
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    if (!appointmentId || !session?.user?.id || !enabled) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/appointments/${appointmentId}/payments`)
      
      if (!response.ok) {
        throw new Error('Paiements non trouvés')
      }

      const data = await response.json()
      
      if (data.success) {
        setPayments(data.payments)
      } else {
        throw new Error(data.error || 'Erreur lors du chargement')
      }
    } catch (error: any) {
      setError(error.message)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [appointmentId, session?.user?.id, enabled])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const refresh = useCallback(() => {
    fetchPayments()
  }, [fetchPayments])

  return { payments, loading, error, refresh }
}
