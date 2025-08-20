import { useState, useEffect, useCallback, useRef } from 'react'
import { ApiResponse, UseApiOptions } from '@/types'
import { handleError, retry } from '@/lib/utils'

interface UseApiState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

interface UseApiReturn<T, P = unknown> extends UseApiState<T> {
  execute: (params?: P) => Promise<void>
  refetch: () => Promise<void>
  reset: () => void
}

/**
 * Hook personnalisé pour gérer les appels API
 */
export function useApi<T = unknown, P = unknown>(
  apiFunction: (params?: P) => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): UseApiReturn<T, P> {
  const {
    immediate = false,
    retry: retryCount = 0,
    retryDelay = 1000,
    onSuccess,
    onError
  } = options

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null
  })

  // Always call the latest apiFunction to avoid stale closures
  const apiFunctionRef = useRef(apiFunction)
  useEffect(() => {
    apiFunctionRef.current = apiFunction
  }, [apiFunction])

  const execute = useCallback(async (params?: P) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const executeWithRetry = () => apiFunctionRef.current(params)
      const response = retryCount > 0 
        ? await retry(executeWithRetry, retryCount, retryDelay)
        : await executeWithRetry()

      if (response.success && response.data) {
        setState({
          data: response.data,
          isLoading: false,
          error: null
        })
        if (onSuccess) onSuccess(response.data)
      } else {
        const errorMessage = response.error || 'Une erreur s\'est produite'
        setState({
          data: null,
          isLoading: false,
          error: errorMessage
        })
        if (onError) onError(new Error(errorMessage))
      }
    } catch (error) {
      const errorMessage = handleError(error, 'API call')
      setState({
        data: null,
        isLoading: false,
        error: errorMessage
      })
      if (onError) onError(error)
    }
  }, [retryCount, retryDelay, onSuccess, onError])

  const refetch = useCallback(() => execute(), [])

  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      error: null
    })
  }, [])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [immediate])

  return {
    ...state,
    execute,
    refetch,
    reset
  }
}

/**
 * Hook pour les opérations de mutation (POST, PUT, DELETE)
 */
export function useMutation<T = any, P = any>(
  mutationFunction: (params: P) => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): UseApiReturn<T, P> & { mutate: (params: P) => Promise<void> } {
  // Create a wrapper function that makes the parameter optional for useApi
  const wrappedFunction = (params?: P) => {
    if (params === undefined) {
      throw new Error('Parameters are required for mutation functions')
    }
    return mutationFunction(params)
  }
  
  const apiHook = useApi<T, P>(wrappedFunction, { ...options, immediate: false })

  const mutate = useCallback(async (params: P) => {
    await apiHook.execute(params)
  }, [apiHook])

  return {
    ...apiHook,
    mutate
  }
}

/**
 * Hook pour les opérations de requête avec cache
 */
export function useQuery<T = unknown, P = unknown>(
  queryFunction: (params?: P) => Promise<ApiResponse<T>>,
  options: UseApiOptions & { cacheKey?: string } = {}
): UseApiReturn<T, P> {
  const { cacheKey, ...apiOptions } = options
  
  // TODO: Implémenter un système de cache simple
  // Pour l'instant, on utilise le hook de base
  return useApi(queryFunction, apiOptions)
} 