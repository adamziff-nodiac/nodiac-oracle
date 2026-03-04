'use client'

import { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error'
}

let toastListeners: Array<(toast: ToastMessage) => void> = []

export function showToast(message: string, type: 'success' | 'error' = 'success') {
  const toast: ToastMessage = { id: Date.now().toString(), message, type }
  toastListeners.forEach(fn => fn(toast))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((toast: ToastMessage) => {
    setToasts(prev => [...prev, toast])
    if (toast.type === 'success') {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, 3000)
    }
  }, [])

  useEffect(() => {
    toastListeners.push(addToast)
    return () => {
      toastListeners = toastListeners.filter(fn => fn !== addToast)
    }
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg text-[13px] font-medium animate-slide-in',
            toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          )}
        >
          {toast.message}
          <button
            type="button"
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            className="ml-2 text-current opacity-50 hover:opacity-100 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
