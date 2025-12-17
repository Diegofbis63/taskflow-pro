'use client'

import { useAuth } from '@/hooks/use-auth'
import { useProjects } from '@/hooks/use-projects'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckSquare, Clock, Calendar, User, Filter } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DashboardSkeleton } from '@/components/ui/skeletons'

export default function TasksPage() {
  const router = useRouter()
  const { data: authData, isLoading: authLoading } = useAuth()
  const { data: projects, isLoading: projectsLoading } = useProjects(authData?.user?.id || '')

  if (authLoading || projectsLoading) {
    return <DashboardSkeleton />
  }

  if (!authData?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">TaskFlow Pro</CardTitle>
            <CardDescription>
              Inicia sesión para acceder a tus tareas
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

  // Get all tasks from all projects
  const allTasks = projects?.projects?.flatMap(project => 
    project.tasks?.map(task => ({ ...task, projectTitle: project.title, projectColor: project.color })) || []
  ) || []

  const tasksByStatus = {
    TODO: allTasks.filter(task => task.status === 'TODO'),
    IN_PROGRESS: allTasks.filter(task => task.status === 'IN_PROGRESS'),
    IN_REVIEW: allTasks.filter(task => task.status === 'IN_REVIEW'),
    DONE: allTasks.filter(task => task.status === 'DONE')
  }

  const totalTasks = allTasks.length
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
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Total Tareas
                </h1>
                <p className="text-gray-600">
                  Gestiona todas las tareas de tus proyectos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tareas</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                En todos los proyectos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Por Hacer</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasksByStatus.TODO.length}</div>
              <p className="text-xs text-muted-foreground">
                Tareas pendientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasksByStatus.IN_PROGRESS.length}</div>
              <p className="text-xs text-muted-foreground">
                Trabajando actualmente
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
                {completionRate}% tasa de completion
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tasks by Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* TODO Tasks */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              Por Hacer ({tasksByStatus.TODO.length})
            </h3>
            <div className="space-y-3">
              {tasksByStatus.TODO.length > 0 ? (
                tasksByStatus.TODO.map((task) => (
                  <Card key={task.id} className="hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {task.projectTitle}
                          </p>
                        </div>
                        <div 
                          className="w-3 h-3 rounded-full ml-3" 
                          style={{ backgroundColor: task.projectColor }}
                          title={task.projectTitle}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    No hay tareas pendientes
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* IN_PROGRESS Tasks */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
              En Progreso ({tasksByStatus.IN_PROGRESS.length})
            </h3>
            <div className="space-y-3">
              {tasksByStatus.IN_PROGRESS.length > 0 ? (
                tasksByStatus.IN_PROGRESS.map((task) => (
                  <Card key={task.id} className="hover:shadow-md transition-all border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {task.projectTitle}
                          </p>
                        </div>
                        <div 
                          className="w-3 h-3 rounded-full ml-3" 
                          style={{ backgroundColor: task.projectColor }}
                          title={task.projectTitle}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    No hay tareas en progreso
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* IN_REVIEW Tasks */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              En Revisión ({tasksByStatus.IN_REVIEW.length})
            </h3>
            <div className="space-y-3">
              {tasksByStatus.IN_REVIEW.length > 0 ? (
                tasksByStatus.IN_REVIEW.map((task) => (
                  <Card key={task.id} className="hover:shadow-md transition-all border-yellow-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {task.projectTitle}
                          </p>
                        </div>
                        <div 
                          className="w-3 h-3 rounded-full ml-3" 
                          style={{ backgroundColor: task.projectColor }}
                          title={task.projectTitle}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    No hay tareas en revisión
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* DONE Tasks */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              Completadas ({tasksByStatus.DONE.length})
            </h3>
            <div className="space-y-3">
              {tasksByStatus.DONE.length > 0 ? (
                tasksByStatus.DONE.map((task) => (
                  <Card key={task.id} className="hover:shadow-md transition-all border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 line-through">{task.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {task.projectTitle}
                          </p>
                        </div>
                        <div 
                          className="w-3 h-3 rounded-full ml-3" 
                          style={{ backgroundColor: task.projectColor }}
                          title={task.projectTitle}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    No hay tareas completadas
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}