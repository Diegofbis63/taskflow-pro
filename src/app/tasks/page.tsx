'use client'

import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TasksPage() {
  const router = useRouter()
  const { data: authData, isLoading: authLoading } = useAuth()

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

  if (!authData?.user) {
    router.push('/')
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Tareas</h1>
          </div>
          
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mis Tareas</CardTitle>
            <CardDescription>
              Gestiona todas tus tareas y seguimiento del progreso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No tienes tareas asignadas todavía
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Volver al dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}