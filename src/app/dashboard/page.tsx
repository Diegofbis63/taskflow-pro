'use client'

import { useState } from 'react'
import { useAuth, useSignOut } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, CheckSquare, Users, Settings, LogOut, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const { data: authData, isLoading: authLoading } = useAuth()
  const signOutMutation = useSignOut()

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!authData?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">TaskFlow Pro</CardTitle>
            <CardDescription>
              Inicia sesión para acceder a tu dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full"
              onClick={() => router.push('/')}
            >
              Ir al inicio de sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSignOut = () => {
    signOutMutation.mutate()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    ¡Hola, {authData.user.name}! 👋
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Bienvenido a TaskFlow Pro
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/projects')}
              >
                Proyectos
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/tasks')}
              >
                Tareas
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/team')}
              >
                <Users className="h-4 w-4 mr-2" />
                Equipo
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/settings')}
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={signOutMutation.isPending}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">¡Bienvenido a TaskFlow Pro!</CardTitle>
              <CardDescription>
                Tu sistema de gestión de proyectos está funcionando correctamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-blue-900 mb-2">Gestión de Proyectos</h3>
                  <p className="text-blue-700 text-sm">
                    Crea y gestiona tus proyectos de forma eficiente
                  </p>
                </div>
                
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <CheckSquare className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-green-900 mb-2">Seguimiento de Tareas</h3>
                  <p className="text-green-700 text-sm">
                    Mantén un control detallado de todas tus tareas
                  </p>
                </div>
                
                <div className="text-center p-6 bg-purple-50 rounded-lg">
                  <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-purple-900 mb-2">Colaboración</h3>
                  <p className="text-purple-700 text-sm">
                    Trabaja en equipo con otros miembros
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* System Status */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Estado del sistema
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Todo está funcionando correctamente</CardTitle>
              <CardDescription>
                Los sistemas principales están operativos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Base de datos</span>
                  </div>
                  <span className="text-sm text-green-700">Conectada</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Autenticación</span>
                  </div>
                  <span className="text-sm text-green-700">Activa</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">API</span>
                  </div>
                  <span className="text-sm text-green-700">Funcionando</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}