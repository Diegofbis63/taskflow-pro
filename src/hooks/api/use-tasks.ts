'use client'

import { useState, useEffect } from 'react'
import { getKanbanColumns } from '@/actions/tasks'
import type { TaskWithRelations } from '@/types'
import { TaskStatus } from '@prisma/client'

export function useKanbanBoard(projectId: string) {
  const [columns, setColumns] = useState<Record<TaskStatus, TaskWithRelations[]>>({
    TODO: [],
    IN_PROGRESS: [],
    IN_REVIEW: [],
    DONE: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchColumns = async () => {
    try {
      setLoading(true)
      const result = await getKanbanColumns(projectId)
      if (result.success) {
        setColumns(result.data || {})
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch kanban board')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchColumns()
    }
  }, [projectId])

  return {
    columns,
    loading,
    error,
    refetch: fetchColumns,
  }
}