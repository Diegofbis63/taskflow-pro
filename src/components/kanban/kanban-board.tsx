'use client'

import { DndContext } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskStatus } from '@prisma/client'
import { KanbanColumn } from './kanban-column'
import { TaskCard } from './task-card'
import type { TaskWithRelations } from '@/types'

interface KanbanBoardProps {
  columns: Record<TaskStatus, TaskWithRelations[]>
  onMoveTask: (taskId: string, sourceStatus: TaskStatus, destinationStatus: TaskStatus, 
                  sourceIndex: number, destinationIndex: number) => Promise<{ success: boolean; error?: string }>
  loading?: boolean
}

export function KanbanBoard({ columns, onMoveTask, loading }: KanbanBoardProps) {
  const columnIds = Object.keys(columns) as TaskStatus[]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columnIds.map(status => (
          <div key={status} className="bg-gray-100 rounded-lg p-4 h-96 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {columnIds.map(status => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={columns[status]}
          onMoveTask={onMoveTask}
        />
      ))}
    </div>
  )
}