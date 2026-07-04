import { ref } from 'vue'

export type Toast = {
  id: number
  kind: 'error' | 'success'
  message: string
}

export const toasts = ref<Toast[]>([])

let nextId = 0

export const dismissToast = (id: number) => {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

const push = (kind: Toast['kind'], message: string) => {
  const id = nextId++
  toasts.value = [...toasts.value, { id, kind, message }]
  window.setTimeout(() => dismissToast(id), 4500)
}

export const notifyError = (message: string) => push('error', message)
export const notifySuccess = (message: string) => push('success', message)
