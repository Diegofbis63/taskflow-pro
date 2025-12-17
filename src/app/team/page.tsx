'use client'

import { useAuth } from '@/hooks/use-auth'
import { useProjects } from '@/hooks/use-projects'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckSquare, Users, UserPlus, Mail, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DashboardSkeleton } from '@/components/ui/skeletons'

export default function TeamPage() {
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
              Inicia sesión para acceder a tu equipo
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

  // Get all unique members from all projects
  const allMembers = projects?.projects?.flatMap(project => project.members || []) || []
  const uniqueMembers = Array.from(
    new Map(allMembers.map(member => [member.user.id, member])).values()
  )

  // Count members by role
  const membersByRole = {
    OWNER: uniqueMembers.filter(member => member.role === 'OWNER').length,
    ADMIN: uniqueMembers.filter(member => member.role === 'ADMIN').length,
    MEMBER: uniqueMembers.filter(member => member.role === 'MEMBER').length,
  }

  // Get active members (members in projects with tasks)
  const activeMembers = uniqueMembers.filter(member => 
    projects?.projects?.some(project => 
      project.members.some(m => m.user.id === member.user.id) && 
      project.tasks && project.tasks.length > 0
    )
  ).length

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
                  Equipo
                </h1>
                <p className="text-gray-600">
                  Gestiona los miembros de tu equipo
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
              <CardTitle className="text-sm font-medium">Total Miembros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueMembers.length}</div>
              <p className="text-xs text-muted-foreground">
                En todos los proyectos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Miembros Activos</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeMembers}</div>
              <p className="text-xs text-muted-foreground">
                Participando en proyectos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{membersByRole.OWNER + membersByRole.ADMIN}</div>
              <p className="text-xs text-muted-foreground">
                {membersByRole.OWNER} dueños + {membersByRole.ADMIN} admins
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Miembros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{membersByRole.MEMBER}</div>
              <p className="text-xs text-muted-foreground">
                Miembros regulares
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Members Grid */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Todos los Miembros</h2>

          {uniqueMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {uniqueMembers.map((member) => (
                <Card key={member.id} className="hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{member.user.name}</h3>
                        <p className="text-sm text-gray-600">{member.user.email}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Rol</span>
                        <Badge variant={
                          member.role === 'OWNER' ? 'default' :
                          member.role === 'ADMIN' ? 'secondary' : 'outline'
                        }>
                          {member.role === 'OWNER' ? 'Dueño' :
                           member.role === 'ADMIN' ? 'Administrador' : 'Miembro'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Miembro desde</span>
                        <span className="text-sm text-gray-900">
                          {new Date(member.joinedAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      {/* Projects this member belongs to */}
                      <div>
                        <span className="text-sm text-gray-600">Proyectos</span>
                        <div className="mt-1">
                          {projects?.projects
                            .filter(project => project.members.some(m => m.user.id === member.user.id))
                            .map(project => (
                              <Badge 
                                key={project.id} 
                                variant="outline" 
                                className="mr-1 mb-1 text-xs"
                              >
                                {project.title}
                              </Badge>
                            ))}
                        </div>
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
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay miembros en el equipo
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Agrega miembros a tus proyectos para comenzar
                  </p>
                  <Button onClick={() => router.push('/dashboard')}>
                    <UserPlus className="h-4 w-4 mr-2" />
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