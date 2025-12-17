'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'

// Query keys para cache consistency
export const authKeys = {
  auth: ['auth'] as const,
  session: ['session'] as const,
}

// Funciones API
async function authApiCall() {
  const response = await fetch('/api/auth')
  if (!response.ok) throw new Error('Auth check failed')
  return response.json()
}

async function signInApiCall(email: string, password: string) {
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Important for cookies
    body: JSON.stringify({ action: 'signin', email, password })
  })
  if (!response.ok) throw new Error('Sign in failed')
  return response.json()
}

async function signUpApiCall(email: string, name: string, password: string) {
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ action: 'signup', email, name, password })
  })
  if (!response.ok) throw new Error('Sign up failed')
  return response.json()
}

async function signOutApiCall() {
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ action: 'signout' })
  })
  if (!response.ok) throw new Error('Sign out failed')
  return response.json()
}

// Hook para verificar autenticación
export function useAuth() {
  return useQuery({
    queryKey: authKeys.auth,
    queryFn: authApiCall,
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
    placeholderData: { user: null }, // Empezar con user null
  })
}

// Hook para login con optimistic updates
export function useSignIn() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      signInApiCall(email, password),
    onSuccess: (data) => {
      console.log('useSignIn onSuccess called with data:', data)
      if (data.success) {
        // Actualizar cache inmediatamente
        queryClient.setQueryData(authKeys.auth, { user: data.user })
        toast({
          title: "¡Bienvenido de nuevo!",
          description: "Has iniciado sesión correctamente.",
        })
        router.push('/dashboard')
      } else {
        toast({
          title: "Error de inicio de sesión",
          description: data.error || 'Error al iniciar sesión',
          variant: "destructive",
        })
      }
    },
    onError: (error) => {
      console.log('useSignIn onError called with error:', error)
      toast({
        title: "Error de conexión",
        description: "Intenta nuevamente.",
        variant: "destructive",
      })
      console.error('Sign in error:', error)
    },
  })
}

// Hook para registro con optimistic updates
export function useSignUp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, name, password }: { email: string; name: string; password: string }) =>
      signUpApiCall(email, name, password),
    onSuccess: (data) => {
      console.log('useSignUp onSuccess called with data:', data)
      if (data.success) {
        // Show success message but don't redirect to dashboard
        toast({
          title: "¡Cuenta creada exitosamente!",
          description: data.message || "Por favor inicia sesión para continuar.",
        })
      } else {
        toast({
          title: "Error al crear cuenta",
          description: data.error || 'Error al crear cuenta',
          variant: "destructive",
        })
      }
    },
    onError: (error) => {
      console.log('useSignUp onError called with error:', error)
      toast({
        title: "Error de conexión",
        description: "Intenta nuevamente.",
        variant: "destructive",
      })
      console.error('Sign up error:', error)
    },
  })
}

// Hook para cerrar sesión
export function useSignOut() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: signOutApiCall,
    onSuccess: () => {
      // Limpiar cache de autenticación
      queryClient.setQueryData(authKeys.auth, { user: null })
      queryClient.clear()
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
      })
      router.push('/')
    },
    onError: (error) => {
      toast({
        title: "Error al cerrar sesión",
        description: "Intenta nuevamente.",
        variant: "destructive",
      })
      console.error('Sign out error:', error)
    },
  })
}