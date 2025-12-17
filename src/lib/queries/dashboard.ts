import { db } from '@/lib/db'

// Consulta SQL optimizada para estadísticas del dashboard
// Usa índices y evita scans completos de tablas
export const dashboardQueries = {
  // Estadísticas de proyectos - consulta optimizada con COUNT
  getProjectStats: async (userId: string) => {
    if (!db) {
      return {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
      }
    }

    try {
      const result = await db.$queryRaw`
        SELECT 
          COUNT(*) as total_projects,
          COUNT(CASE WHEN t.id IS NOT NULL THEN 1 END) as active_projects,
          COUNT(CASE WHEN t.status = 'DONE' THEN 1 END) as completed_projects
        FROM projects p
        LEFT JOIN tasks t ON p.id = t.project_id
        WHERE p.owner_id = ${userId} 
           OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = ${userId})
      ` as Array<{
        total_projects: bigint
        active_projects: bigint
        completed_projects: bigint
      }>

      const stats = result[0]
      return {
        totalProjects: Number(stats.total_projects),
        activeProjects: Number(stats.active_projects),
        completedProjects: Number(stats.completed_projects),
      }
    } catch (error) {
      console.error('Error getting project stats:', error)
      return {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
      }
    }
  },

  // Estadísticas de tareas - consulta optimizada
  getTaskStats: async (userId: string) => {
    if (!db) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        todoTasks: 0,
        completionRate: 0,
      }
    }

    try {
      const result = await db.$queryRaw`
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'DONE' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_tasks,
          COUNT(CASE WHEN status = 'TODO' THEN 1 END) as todo_tasks,
          ROUND(
            COUNT(CASE WHEN status = 'DONE' THEN 1 END) * 100.0 / 
            NULLIF(COUNT(*), 0), 
            1
          ) as completion_rate
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        WHERE p.owner_id = ${userId} 
           OR EXISTS (
             SELECT 1 FROM project_members pm 
             WHERE pm.project_id = p.id AND pm.user_id = ${userId}
           )
      ` as Array<{
        total_tasks: bigint
        completed_tasks: bigint
        in_progress_tasks: bigint
        todo_tasks: bigint
        completion_rate: number | null
      }>

      const stats = result[0]
      return {
        totalTasks: Number(stats.total_tasks),
        completedTasks: Number(stats.completed_tasks),
        inProgressTasks: Number(stats.in_progress_tasks),
        todoTasks: Number(stats.todo_tasks),
        completionRate: stats.completion_rate || 0,
      }
    } catch (error) {
      console.error('Error getting task stats:', error)
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        todoTasks: 0,
        completionRate: 0,
      }
    }
  },

  // Gráfico de tareas completadas por última semana - CONSULTA SQL OPTIMIZADA
  // Usa DATE_TRUNC y GROUP BY eficiente, solo 7 días de datos
  getTasksCompletedLastWeek: async (userId: string) => {
    if (!db) {
      return Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
        completed: 0,
      }))
    }

    try {
      const result = await db.$queryRaw`
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as completed
        FROM activities a
        JOIN projects p ON a.project_id = p.id
        WHERE a.entity_type = 'TASK'
          AND a.action = 'STATUS_CHANGED'
          AND a.metadata->>'newStatus' = 'DONE'
          AND a.created_at >= NOW() - INTERVAL '7 days'
          AND (p.owner_id = ${userId} 
               OR EXISTS (
                 SELECT 1 FROM project_members pm 
                 WHERE pm.project_id = p.id AND pm.user_id = ${userId}
               ))
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date ASC
      ` as Array<{
        date: Date
        completed: bigint
      }>

      // Convertir a formato de array con todos los días
      const completedByDay = new Map()
      result.forEach(row => {
        completedByDay.set(row.date.toISOString().split('T')[0], Number(row.completed))
      })

      // Generar array de los últimos 7 días
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
        const dateKey = date.toISOString().split('T')[0]
        
        return {
          date,
          completed: completedByDay.get(dateKey) || 0,
        }
      })
    } catch (error) {
      console.error('Error getting weekly tasks:', error)
      return Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
        completed: 0,
      }))
    }
  },

  // Estadísticas de miembros del equipo
  getTeamStats: async (userId: string) => {
    if (!db) {
      return {
        totalMembers: 0,
        activeMembers: 0,
      }
    }

    try {
      const result = await db.$queryRaw`
        SELECT 
          COUNT(DISTINCT pm.user_id) as total_members,
          COUNT(DISTINCT CASE WHEN t.id IS NOT NULL THEN pm.user_id END) as active_members
        FROM project_members pm
        LEFT JOIN tasks t ON pm.user_id = t.assignee_id AND t.updated_at > NOW() - INTERVAL '7 days'
        JOIN projects p ON pm.project_id = p.id
        WHERE p.owner_id = ${userId}
      ` as Array<{
        total_members: bigint
        active_members: bigint
      }>

      const stats = result[0]
      return {
        totalMembers: Number(stats.total_members),
        activeMembers: Number(stats.active_members),
      }
    } catch (error) {
      console.error('Error getting team stats:', error)
      return {
        totalMembers: 0,
        activeMembers: 0,
      }
    }
  },
}