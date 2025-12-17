'use client'

import { useAuth } from '@/hooks/use-auth'
import { useProject } from '@/hooks/use-projects'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Users, Calendar, CheckSquare, Settings } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DashboardSkeleton, ProjectCardSkeleton } from '@/components/ui/skeletons'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { DeleteProjectButton } from '@/components/projects/delete-project-button'
import { TaskList } from '@/components/tasks/task-list'

export default function ProjectPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: authData, isLoading: authLoading } = useAuth()
  const { data: project, isLoading: projectLoading, error: projectError } = useProject(params.id)

  if (authLoading || projectLoading) {
    return <DashboardSkeleton />
  }

  if (!authData?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">TaskFlow Pro</CardTitle>
            <CardDescription>
              Inicia sesión para acceder a tus proyectos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">Ir al Inicio de Sesión</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (projectError || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Proyecto No Encontrado</CardTitle>
            <CardDescription>
              El proyecto que buscas no existe o no tienes acceso a él.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard">
              <Button className="w-full">Volver al Dashboard</Button>
            </Link>
            <Link href="/projects">
              <Button variant="outline" className="w-full">Ver Todos los Proyectos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tasksByStatus = {
    TODO: project.tasks?.filter(t => t.status === 'TODO') || [],
    IN_PROGRESS: project.tasks?.filter(t => t.status === 'IN_PROGRESS') || [],
    IN_REVIEW: project.tasks?.filter(t => t.status === 'IN_REVIEW') || [],
    DONE: project.tasks?.filter(t => t.status === 'DONE') || []
  }

  const totalTasks = project.tasks?.length || 0
  const completedTasks = tasksByStatus.DONE.length
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : '0'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
              <div className="flex items-center gap-3">
                <div 
                  className="w-6 h-6 rounded-full" 
                  style={{ backgroundColor: project.color }}
                />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {project.title}
                  </h1>
                  <p className="text-gray-600">
                    {project.description || 'Sin descripción'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DeleteProjectButton 
                projectId={project.id}
                userId={authData.user.id}
                projectName={project.title}
              />
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tareas</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                En este proyecto
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <CheckSquare className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks}</div>
              <p className="text-xs text-muted-foreground">
                {completionRate}% completadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Miembros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project._count?.members || 0}</div>
              <p className="text-xs text-muted-foreground">
                En el equipo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Creado</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(project.createdAt).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short'
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(project.createdAt).getFullYear()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Section */}
        <div>
          <TaskList 
            projectId={project.id}
            projectColor={project.color}
            projectMembers={project.members || []}
          />
        </div>
      </div>
    </div>
  )
}