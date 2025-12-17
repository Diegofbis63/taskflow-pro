'use client'

import { useState, useEffect } from 'react'
import { getKanbanColumns, moveTask } from '@/actions/tasks'
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

  const handleMoveTask = async (
    taskId: string,
    sourceStatus: string,
    destinationStatus: string,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    // Optimistic update
    const sourceTasks = [...columns[sourceStatus as TaskStatus]]
    const destinationTasks = sourceStatus === destinationStatus 
      ? sourceTasks 
      : [...columns[destinationStatus as TaskStatus]]
    
    const [movedTask] = sourceTasks.splice(sourceIndex, 1)
    destinationTasks.splice(destinationIndex, 0, movedTask)

    setColumns(prev => ({
      ...prev,
      [sourceStatus]: sourceTasks,
      [destinationStatus]: destinationTasks
    }))

    try {
      const result = await moveTask(taskId, sourceStatus, destinationStatus, sourceIndex, destinationIndex)
      if (!result.success) {
        // Revert optimistic update on error
        await fetchColumns()
        return { success: false, error: result.error }
      }
      return { success: true }
    } catch (err) {
      // Revert optimistic update on error
      await fetchColumns()
      return { success: false, error: 'Failed to move task' }
    }
  }

  return {
    columns,
    loading,
    error,
    refetch: fetchColumns,
    moveTask: handleMoveTask,
  }
}