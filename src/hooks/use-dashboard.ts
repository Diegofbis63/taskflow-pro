'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardQueries } from '@/lib/queries/dashboard'

// Query keys para cache consistency
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (userId: string) => [...dashboardKeys.all, 'stats', userId] as const,
  chart: (userId: string) => [...dashboardKeys.all, 'chart', userId] as const,
}

// Hook para estadísticas generales del dashboard
export function useDashboardStats(userId: string) {
  return useQuery({
    queryKey: dashboardKeys.stats(userId),
    queryFn: async () => {
      const [projectStats, taskStats, teamStats] = await Promise.all([
        dashboardQueries.getProjectStats(userId),
        dashboardQueries.getTaskStats(userId),
        dashboardQueries.getTeamStats(userId),
      ])

      return {
        projects: projectStats,
        tasks: taskStats,
        team: teamStats,
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 1, // 1 minuto para stats
    refetchInterval: 1000 * 30, // Refrescar cada 30 segundos
  })
}

// Hook para datos del gráfico semanal
export function useWeeklyChart(userId: string) {
  return useQuery({
    queryKey: dashboardKeys.chart(userId),
    queryFn: () => dashboardQueries.getTasksCompletedLastWeek(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutos para datos históricos
    refetchInterval: 1000 * 60 * 5, // Refrescar cada 5 minutos
  })
}