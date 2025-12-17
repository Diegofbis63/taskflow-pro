'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

interface QueryProviderProps {
  children: React.ReactNode
}

// Crear el cliente fuera del componente para evitar recreación
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 2 minutos de stale time para balancear frescura y rendimiento
      staleTime: 1000 * 60 * 2,
      // 5 minutos de cache time
      gcTime: 1000 * 60 * 5,
      // Reintentar automáticamente en errores de red
      retry: (failureCount, error) => {
        // No reintentar en errores 4xx
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number
          if (status >= 400 && status < 500) return false
        }
        return failureCount < 3
      },
      // Refrescar en window focus solo si está stale
      refetchOnWindowFocus: (query) => {
        if (query.state.dataUpdatedAt) {
          const timeSinceLastUpdate = Date.now() - query.state.dataUpdatedAt
          return timeSinceLastUpdate > 1000 * 60 * 5 // 5 minutos
        }
        return false
      },
      // No refrescar en reconnect para evitar sobrecarga
      refetchOnReconnect: true,
    },
    mutations: {
      // Reintentar mutations una vez
      retry: 1,
    },
  },
})

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}