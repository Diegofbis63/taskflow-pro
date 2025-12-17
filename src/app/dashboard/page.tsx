'use client'

import { useState, useEffect } from 'react'
import { useAuth, useSignIn, useSignUp, useSignOut } from '@/hooks/use-auth'
import { useDashboardStats, useWeeklyChart } from '@/hooks/use-dashboard'
import { useProjects } from '@/hooks/use-projects'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, BarChart3, Users, CheckSquare, Clock, TrendingUp, Settings, Eye, LogOut, Trash2, Calendar, Activity } from 'lucide-react'
import Link from 'next/link'
import { WeeklyTasksChart } from '@/components/charts/weekly-tasks-chart'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { DeleteProjectButton } from '@/components/projects/delete-project-button'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const router = useRouter()
  
  // Autenticación con React Query
  const { data: authData, isLoading: authLoading, error: authError } = useAuth()
  const signInMutation = useSignIn()
  const signUpMutation = useSignUp()
  const signOutMutation = useSignOut()
  
  // Datos del dashboard con React Query
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats(authData?.user?.id || '')
  const { data: chartData, isLoading: chartLoading } = useWeeklyChart(authData?.user?.id || '')
  const { data: projects, isLoading: projectsLoading, error: projectsError } = useProjects(authData?.user?.id || '')

  const isAuthenticated = !!authData?.user

  // Loading state combinado con manejo de errores
  const isLoading = authLoading || statsLoading || chartLoading || projectsLoading
  const hasError = authError || statsError || chartLoading || projectsError

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'n':
            event.preventDefault()
            setShowCreateDialog(true)
            break
          case 'p':
            event.preventDefault()
            router.push('/projects')
            break
          case 't':
            event.preventDefault()
            router.push('/tasks')
            break
          case 'd':
            event.preventDefault()
            router.push('/dashboard')
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router])

  const handleProjectCreated = () => {
    refetchProjects()
    setShowCreateDialog(false)
  }

  const handleProjectClick = (projectId: string) => {
    setSelectedProject(projectId)
    router.push(`/projects/${projectId}`)
  }

  // Loading skeleton con mejor UX
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Skeleton Header */}
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          
          {/* Skeleton Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Skeleton Chart */}
          <Card className="mb-8">
            <CardHeader>
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          
          {/* Skeleton Projects */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-9 w-24" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state con mejor UX
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-destructive">Error</CardTitle>
            <CardDescription>
              No se pudo cargar el dashboard. Por favor intenta nuevamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">
                Volver al inicio
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Estado no autenticado
  if (!isAuthenticated) {
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
            <Link href="/">
              <Button className="w-full">
                Ir al inicio de sesión
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header con mejor UX */}
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
                    Bienvenido de nuevo. Aquí está el resumen de tus proyectos.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <CreateProjectDialog 
                userId={authData.user.id} 
                onProjectCreated={handleProjectCreated}
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
              />
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/projects')}
                  className="hidden sm:flex"
                >
                  <Eye className="h-4 w-4" />
                  Ver todos
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/team')}
                  className="hidden sm:flex"
                >
                  <Users className="h-4 w-4" />
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
                  onClick={() => signOutMutation.mutate()}
                  disabled={signOutMutation.isPending}
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Cerrar sesión</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards con mejor diseño */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Resumen de actividad
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => router.push('/projects')}
              aria-label="Ver todos los proyectos"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Proyectos</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {stats?.projects.totalProjects || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  {stats?.projects.activeProjects || 0} activos
                </p>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(((stats?.projects.activeProjects || 0) / Math.max(stats?.projects.totalProjects || 1)) * 100, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => router.push('/tasks')}
              aria-label="Ver todas las tareas"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tareas</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {stats?.tasks.totalTasks || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  {stats?.tasks.inProgressTasks || 0} en progreso
                </p>
                <div className="mt-2 flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>{stats?.tasks.todoTasks || 0} por hacer</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>{stats?.tasks.inProgressTasks || 0} en progreso</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{stats?.tasks.completedTasks || 0} completadas</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => router.push('/projects')}
              aria-label="Ver proyectos completados"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completadas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {stats?.tasks.completedTasks || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  {stats?.tasks.completionRate?.toFixed(1) || 0}% tasa de completion
                </p>
                <div className="mt-2 h-2 bg-green-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${stats?.tasks.completionRate || 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => router.push('/team')}
              aria-label="Ver equipo"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Equipo</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {stats?.team.totalMembers || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  {stats?.team.activeMembers || 0} miembros activos
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Weekly Chart con mejor diseño */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                Actividad reciente
              </CardTitle>
              <CardDescription>
                Visualización del progreso diario de tu equipo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeeklyTasksChart data={chartData || []} isLoading={chartLoading} />
            </CardContent>
          </Card>
        </section>

        {/* Projects Section con mejor UX */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Proyectos recientes
            </h2>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo proyecto
            </Button>
          </div>

          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects?.projects && projects.projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.projects.map((project) => (
                <Card 
                  key={project.id} 
                  className="hover:shadow-lg transition-all duration-200 group relative overflow-hidden"
                >
                  {/* Status indicator */}
                  <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full m-2"></div>
                  
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-background"
                          style={{ backgroundColor: project.color || '#3B82F6' }}
                        />
                        <div>
                          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                            {project.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Actualizado {new Date(project.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {project._count?.tasks || 0} tareas
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent 
                    className="cursor-pointer"
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>
                    
                    {/* Progress indicators */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">
                          {project.tasks?.filter(t => t.status === 'TODO').length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Por hacer</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {project.tasks?.filter(t => t.status === 'IN_PROGRESS').length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">En progreso</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {project.tasks?.filter(t => t.status === 'DONE').length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Completadas</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {project.tasks ? Math.round((project.tasks.filter(t => t.status === 'DONE').length / project.tasks.length) * 100) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">Completado</p>
                      </div>
                    </div>
                    
                    {/* Team members */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex -space-x-2">
                        {project.members?.slice(0, 3).map((member) => (
                          <div
                            key={member.id}
                            className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-foreground"
                            title={member.user.name}
                          >
                            {member.user.name.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {project.members && project.members.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-foreground">
                            +{project.members.length - 3}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {project.tasks && project.tasks.length > 0 
                          ? `${Math.round((project.tasks.filter(t => t.status === 'DONE').length / project.tasks.length) * 100)}% completado`
                          : 'Sin tareas'
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No hay proyectos aún
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Crea tu primer proyecto para comenzar a organizar tu trabajo
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primer proyecto
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  )
}