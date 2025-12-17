'use client'

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { CreateProjectData, UpdateProjectData } from '@/types'
import { toast } from '@/hooks/use-toast'

// Query keys para cache consistency
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (userId: string) => [...projectKeys.lists(), userId] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
}

// Funciones API con autenticación
async function fetchProjects(userId: string) {
  const response = await fetch('/api/projects', {
    credentials: 'include' // Important for cookies
  })
  if (!response.ok) throw new Error('Failed to fetch projects')
  return response.json()
}

async function fetchProject(projectId: string) {
  const response = await fetch(`/api/projects/${projectId}`, {
    credentials: 'include'
  })
  if (!response.ok) throw new Error('Failed to fetch project')
  return response.json()
}

async function createProjectApiCall(data: CreateProjectData & { userId: string }) {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error('Failed to create project')
  return response.json()
}

async function updateProjectApiCall({ id, data }: { id: string; data: UpdateProjectData }) {
  const response = await fetch('/api/projects', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ id, ...data })
  })
  if (!response.ok) throw new Error('Failed to update project')
  return response.json()
}

async function deleteProjectApiCall({ id, userId }: { id: string; userId: string }) {
  const response = await fetch(`/api/projects?id=${id}`, {
    method: 'DELETE',
    credentials: 'include'
  })
  if (!response.ok) throw new Error('Failed to delete project')
  return response.json()
}

// Hook para obtener proyectos del usuario
export function useProjects(userId: string) {
  return useQuery({
    queryKey: projectKeys.list(userId),
    queryFn: () => fetchProjects(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutos
    select: (data) => ({
      projects: data.projects || [],
      totalProjects: data.projects?.length || 0,
      activeProjects: data.projects?.filter(p => p.tasks && p.tasks.length > 0).length || 0,
      totalTasks: data.projects?.reduce((total, project) => total + (project._count?.tasks || 0), 0) || 0,
      completedTasks: data.projects?.reduce((total, project) => {
        return total + (project.tasks?.filter(t => t.status === 'DONE').length || 0)
      }, 0) || 0,
      inProgressTasks: data.projects?.reduce((total, project) => {
        return total + (project.tasks?.filter(t => t.status === 'IN_PROGRESS').length || 0)
      }, 0) || 0,
      todoTasks: data.projects?.reduce((total, project) => {
        return total + (project.tasks?.filter(t => t.status === 'TODO').length || 0)
      }, 0) || 0,
      totalMembers: data.projects?.reduce((total, project) => total + (project._count?.members || 0), 0) || 0,
      activeMembers: data.projects?.reduce((total, project) => {
        return total + (project.members?.filter(m => 
          project.tasks && project.tasks.length > 0
        ).length || 0)
      }, 0) || 0,
    }),
  })
}

// Hook para obtener un proyecto específico
export function useProject(projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    select: (data) => data.project
  })
}

// Hook para crear proyecto con optimistic updates
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data, userId }: { data: CreateProjectData; userId: string }) =>
      createProjectApiCall({ ...data, userId }),
    onMutate: async ({ data, userId }) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() })

      // Guardar snapshot anterior
      const previousProjects = queryClient.getQueryData(projectKeys.list(userId))

      // Optimistic update
      const optimisticProject = {
        id: `temp-${Date.now()}`,
        ...data,
        ownerId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: {
          id: userId,
          email: '',
          name: '',
          role: 'MEMBER' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        members: [],
        tasks: [],
        _count: { members: 0, tasks: 0 },
      }

      queryClient.setQueryData(projectKeys.list(userId), (old: any) => {
        const currentData = old || { projects: [] }
        return { projects: [optimisticProject, ...currentData.projects] }
      })

      return { previousProjects }
    },
    onError: (error, variables, context) => {
      // Revertir en caso de error
      if (context?.previousProjects) {
        queryClient.setQueryData(
          projectKeys.list(variables.userId),
          context.previousProjects
        )
      }
      toast({
        title: "Error al crear proyecto",
        description: "No se pudo crear el proyecto. Intenta nuevamente.",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      toast({
        title: "¡Proyecto creado!",
        description: "El proyecto se ha creado exitosamente.",
      })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-chart'] })
    },
  })
}

// Hook para actualizar proyecto con optimistic updates
export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectData }) =>
      updateProjectApiCall({ id, data }),
    onMutate: async ({ id, data }) => {
      // Cancelar queries del proyecto específico
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) })

      // Guardar snapshot
      const previousProject = queryClient.getQueryData(projectKeys.detail(id))

      // Optimistic update
      queryClient.setQueryData(projectKeys.detail(id), (old: any) => 
        old ? { ...old, ...data, updatedAt: new Date() } : null
      )

      return { previousProject }
    },
    onError: (error, variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(
          projectKeys.detail(variables.id),
          context.previousProject
        )
      }
      toast({
        title: "Error al actualizar proyecto",
        description: "No se pudo actualizar el proyecto. Intenta nuevamente.",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      toast({
        title: "¡Proyecto actualizado!",
        description: "El proyecto se ha actualizado exitosamente.",
      })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.details() })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-chart'] })
    },
  })
}

// Hook para eliminar proyecto con optimistic updates
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      deleteProjectApiCall({ id, userId }),
    onMutate: async ({ id, userId }) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.list(userId) })
      
      const previousProjects = queryClient.getQueryData(projectKeys.list(userId))

      // Remover optimistamente
      queryClient.setQueryData(projectKeys.list(userId), (old: any) => {
        const currentData = old || { projects: [] }
        return { 
          projects: currentData.projects.filter((project: any) => project.id !== id) 
        }
      })

      return { previousProjects }
    },
    onError: (error, variables, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(
          projectKeys.list(variables.userId),
          context.previousProjects
        )
      }
      toast({
        title: "Error al eliminar proyecto",
        description: "No se pudo eliminar el proyecto. Intenta nuevamente.",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      toast({
        title: "¡Proyecto eliminado!",
        description: "El proyecto se ha eliminado exitosamente.",
      })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.details() })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-chart'] })
    },
  })
}