"use client"

// Simplified toast implementation
import * as React from "react"

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 3000

type ToastType = {
  id: string
  message: string
  variant?: "default" | "destructive"
}

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const listeners: Array<(toasts: ToastType[]) => void> = []
let memoryToasts: ToastType[] = []

function notify() {
  listeners.forEach((listener) => listener(memoryToasts))
}

function addToast(message: string, variant: "default" | "destructive" = "default") {
  const id = genId()
  const toast: ToastType = { id, message, variant }
  
  memoryToasts = [toast, ...memoryToasts].slice(0, TOAST_LIMIT)
  notify()
  
  // Auto dismiss after delay
  setTimeout(() => {
    dismissToast(id)
  }, TOAST_REMOVE_DELAY)
  
  return id
}

function dismissToast(toastId?: string) {
  if (toastId) {
    memoryToasts = memoryToasts.filter((t) => t.id !== toastId)
  } else {
    memoryToasts = []
  }
  notify()
}

function useToast() {
  const [toasts, setToasts] = React.useState<ToastType[]>(memoryToasts)

  React.useEffect(() => {
    listeners.push(setToasts)
    return () => {
      const index = listeners.indexOf(setToasts)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  return {
    toasts,
    toast: addToast,
    dismiss: dismissToast,
  }
}

export { useToast, addToast as toast }
