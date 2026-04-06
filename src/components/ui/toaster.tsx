"use client"

import { useToast } from "@/hooks/use-toast"
import { Toast, ToastClose, ToastProvider, ToastViewport } from "@/components/ui/toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, message, variant }) => (
        <Toast key={id} variant={variant} onOpenChange={() => dismiss(id)}>
          <span className="text-sm">{message}</span>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
