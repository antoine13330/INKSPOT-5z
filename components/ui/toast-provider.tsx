'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/lib/stores/ui-store'
import { Toaster } from '@/components/ui/toaster'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast } = useUIStore()

  return (
    <>
      {children}
      <Toaster />
      {/* Custom toasts from Zustand store */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-lg border max-w-sm animate-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : toast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : toast.type === 'warning'
                ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {toast.title && (
                  <h4 className="font-medium mb-1">{toast.title}</h4>
                )}
                <p className="text-sm">{toast.description}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}