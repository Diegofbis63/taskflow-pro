'use client'

import { useAuth } from '@/hooks/use-auth'
import { useProjects } from '@/hooks/use-projects'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FolderOpen, Calendar, Users, Settings } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DashboardSkeleton, ProjectCardSkeleton } from '@/components/ui/skeletons'

export default function ProjectsPage() {
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
                  Total Proyectos
                </h1>
                <p className="text-gray-600">
                  Gestiona todos tus proyectos desde aquí
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Proyectos</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects?.totalProjects || 0}</div>
              <p className="text-xs text-muted-foreground">
                {projects?.activeProjects || 0} proyectos activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tareas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects?.projects?.reduce((total, project) => total + (project._count?.tasks || 0), 0) || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                En todos los proyectos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Miembros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects?.projects?.reduce((total, project) => total + (project._count?.members || 0), 0) || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                En todos los proyectos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Todos los Proyectos</h2>

          {projects?.projects && projects.projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.projects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: project.color }}
                      />
                      <Badge variant={project.tasks && project.tasks.length > 0 ? "default" : "secondary"}>
                        {project._count?.tasks || 0} tareas
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold text-lg mb-2">{project.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {project.members?.slice(0, 3).map((member) => (
                          <div
                            key={member.id}
                            className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center"
                            title={member.user.name}
                          >
                            <span className="text-xs font-medium">
                              {member.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        ))}
                        {project.members && project.members.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              +{project.members.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {project.tasks && project.tasks.length > 0 
                          ? `${project.tasks.filter(t => t.status === 'DONE').length}/${project.tasks.length} completadas`
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
                  <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay proyectos aún
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Crea tu primer proyecto para comenzar
                  </p>
                  <Button onClick={() => router.push('/dashboard')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Ir al Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}