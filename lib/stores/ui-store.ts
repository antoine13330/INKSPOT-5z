import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface Toast {
  id: string
  title?: string
  description: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface Modal {
  id: string
  type: string
  props?: Record<string, any>
  isOpen: boolean
}

interface UIState {
  // Loading states
  globalLoading: boolean
  pageLoading: Record<string, boolean>
  
  // Toasts
  toasts: Toast[]
  
  // Modals
  modals: Modal[]
  
  // Navigation
  currentPage: string
  previousPage: string
  
  // Search
  globalSearchOpen: boolean
  globalSearchQuery: string
  
  // Other UI states
  sidebarOpen: boolean
  bottomNavVisible: boolean
  
  // Actions
  setGlobalLoading: (loading: boolean) => void
  setPageLoading: (page: string, loading: boolean) => void
  
  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
  
  // Modal actions
  openModal: (type: string, props?: Record<string, any>) => string
  closeModal: (id: string) => void
  closeAllModals: () => void
  
  // Navigation actions
  setCurrentPage: (page: string) => void
  
  // Search actions
  setGlobalSearchOpen: (open: boolean) => void
  setGlobalSearchQuery: (query: string) => void
  
  // Other actions
  setSidebarOpen: (open: boolean) => void
  setBottomNavVisible: (visible: boolean) => void
  
  // Utilities
  isLoading: (page?: string) => boolean
  showSuccessToast: (message: string) => void
  showErrorToast: (message: string) => void
  showWarningToast: (message: string) => void
  showInfoToast: (message: string) => void
}

let toastIdCounter = 0
let modalIdCounter = 0

export const useUIStore = create<UIState>()(
  immer((set, get) => ({
    // Initial state
    globalLoading: false,
    pageLoading: {},
    toasts: [],
    modals: [],
    currentPage: '/',
    previousPage: '/',
    globalSearchOpen: false,
    globalSearchQuery: '',
    sidebarOpen: false,
    bottomNavVisible: true,

    // Loading actions
    setGlobalLoading: (loading) => set((state) => {
      state.globalLoading = loading
    }),

    setPageLoading: (page, loading) => set((state) => {
      if (loading) {
        state.pageLoading[page] = true
      } else {
        delete state.pageLoading[page]
      }
    }),

    // Toast actions
    addToast: (toast) => set((state) => {
      const id = `toast-${++toastIdCounter}`
      const newToast: Toast = {
        id,
        duration: 5000,
        ...toast,
      }
      
      state.toasts.push(newToast)
      
      // Auto-remove toast after duration
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          get().removeToast(id)
        }, newToast.duration)
      }
    }),

    removeToast: (id) => set((state) => {
      state.toasts = state.toasts.filter(toast => toast.id !== id)
    }),

    clearToasts: () => set((state) => {
      state.toasts = []
    }),

    // Modal actions
    openModal: (type, props) => {
      const id = `modal-${++modalIdCounter}`
      set((state) => {
        state.modals.push({
          id,
          type,
          props,
          isOpen: true,
        })
      })
      return id
    },

    closeModal: (id) => set((state) => {
      const modal = state.modals.find(m => m.id === id)
      if (modal) {
        modal.isOpen = false
      }
      // Remove after animation
      setTimeout(() => {
        set((state) => {
          state.modals = state.modals.filter(m => m.id !== id)
        })
      }, 300)
    }),

    closeAllModals: () => set((state) => {
      state.modals.forEach(modal => {
        modal.isOpen = false
      })
      // Clear all after animation
      setTimeout(() => {
        set((state) => {
          state.modals = []
        })
      }, 300)
    }),

    // Navigation actions
    setCurrentPage: (page) => set((state) => {
      state.previousPage = state.currentPage
      state.currentPage = page
    }),

    // Search actions
    setGlobalSearchOpen: (open) => set((state) => {
      state.globalSearchOpen = open
      if (!open) {
        state.globalSearchQuery = ''
      }
    }),

    setGlobalSearchQuery: (query) => set((state) => {
      state.globalSearchQuery = query
    }),

    // Other actions
    setSidebarOpen: (open) => set((state) => {
      state.sidebarOpen = open
    }),

    setBottomNavVisible: (visible) => set((state) => {
      state.bottomNavVisible = visible
    }),

    // Utilities
    isLoading: (page) => {
      const state = get()
      if (page) {
        return state.pageLoading[page] || false
      }
      return state.globalLoading || Object.keys(state.pageLoading).length > 0
    },

    showSuccessToast: (message) => {
      get().addToast({
        description: message,
        type: 'success',
      })
    },

    showErrorToast: (message) => {
      get().addToast({
        description: message,
        type: 'error',
        duration: 7000, // Error messages stay longer
      })
    },

    showWarningToast: (message) => {
      get().addToast({
        description: message,
        type: 'warning',
        duration: 6000,
      })
    },

    showInfoToast: (message) => {
      get().addToast({
        description: message,
        type: 'info',
      })
    },
  }))
)