'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskRepository } from '@/lib/repositories'
import { CreateTaskData, UpdateTaskData } from '@/types'
import { toast } from '@/hooks/use-toast'

// Query keys para cache consistency
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (projectId: string) => [...taskKeys.lists(), projectId] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
}

// Hook para obtener tareas de un proyecto
export function useTasks(projectId: string) {
  return useQuery({
    queryKey: taskKeys.list(projectId),
    queryFn: () => taskRepository.findByProjectId(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2, // 2 minutos
    select: (data) => ({
      tasks: data,
      totalTasks: data.length,
      completedTasks: data.filter(t => t.status === 'DONE').length,
      inProgressTasks: data.filter(t => t.status === 'IN_PROGRESS').length,
      todoTasks: data.filter(t => t.status === 'TODO').length,
    }),
  })
}

// Hook para obtener una tarea específica
export function useTask(taskId: string) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => taskRepository.findById(taskId),
    enabled: !!taskId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// Hook para crear tarea con optimistic updates
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data, projectId }: { data: CreateTaskData; projectId: string }) =>
      taskRepository.create({ ...data, projectId }),
    onMutate: async ({ data, projectId }) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: taskKeys.list(projectId) })

      // Guardar snapshot anterior
      const previousTasks = queryClient.getQueryData(taskKeys.list(projectId))

      // Optimistic update
      const optimisticTask = {
        id: `temp-${Date.now()}`,
        ...data,
        projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: {
          id: 'current-user',
          email: '',
          name: 'Current User',
          role: 'MEMBER' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        assignee: null,
        comments: [],
      }

      queryClient.setQueryData(taskKeys.list(projectId), (old: any) => 
        old ? [...old, optimisticTask] : [optimisticTask]
      )

      return { previousTasks }
    },
    onError: (error, variables, context) => {
      // Revertir en caso de error
      if (context?.previousTasks) {
        queryClient.setQueryData(
          taskKeys.list(variables.projectId),
          context.previousTasks
        )
      }
      toast({
        title: "Error al crear tarea",
        description: "No se pudo crear la tarea. Intenta nuevamente.",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      // Invalidar para refrescar datos reales
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-chart'] })
    },
  })
}

// Hook para actualizar tarea con optimistic updates
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskData }) =>
      taskRepository.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancelar queries de la tarea específica
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) })

      // Guardar snapshot
      const previousTask = queryClient.getQueryData(taskKeys.detail(id))

      // Optimistic update
      queryClient.setQueryData(taskKeys.detail(id), (old: any) => 
        old ? { ...old, ...data, updatedAt: new Date() } : null
      )

      return { previousTask }
    },
    onError: (error, variables, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(
          taskKeys.detail(variables.id),
          context.previousTask
        )
      }
      toast({
        title: "Error al actualizar tarea",
        description: "No se pudo actualizar la tarea. Intenta nuevamente.",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      toast({
        title: "¡Tarea actualizada!",
        description: "La tarea se ha actualizado exitosamente.",
      })
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-chart'] })
    },
  })
}

// Hook para eliminar tarea con optimistic updates
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      taskRepository.delete(id),
    onMutate: async ({ id, projectId }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.list(projectId) })
      
      const previousTasks = queryClient.getQueryData(taskKeys.list(projectId))

      // Remover optimistamente
      queryClient.setQueryData(taskKeys.list(projectId), (old: any) =>
        old ? old.filter((task: any) => task.id !== id) : []
      )

      return { previousTasks }
    },
    onError: (error, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          taskKeys.list(variables.projectId),
          context.previousTasks
        )
      }
      toast({
        title: "Error al eliminar tarea",
        description: "No se pudo eliminar la tarea. Intenta nuevamente.",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      toast({
        title: "¡Tarea eliminada!",
        description: "La tarea se ha eliminado exitosamente.",
      })
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-chart'] })
    },
  })
}

// Hook para cambiar estado de tarea
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      taskRepository.update(id, { status }),
    onMutate: async ({ id, status }) => {
      // Optimistic update - update task status in all relevant queries
      queryClient.setQueriesData(
        { queryKey: taskKeys.lists() },
        (old: any) => {
          if (!old) return old
          return {
            ...old,
            tasks: old.tasks?.map((task: any) => 
              task.id === id ? { ...task, status, updatedAt: new Date() } : task
            )
          }
        }
      )

      queryClient.setQueriesData(
        { queryKey: taskKeys.details() },
        (old: any) => 
          old?.id === id ? { ...old, status, updatedAt: new Date() } : old
      )
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar estado",
        description: "No se pudo actualizar el estado de la tarea.",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-chart'] })
    },
  })
}