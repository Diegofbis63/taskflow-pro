'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskStatus } from '@prisma/client'
import { TaskCard } from './task-card'
import { cn } from '@/lib/utils'
import type { TaskWithRelations } from '@/types'

interface KanbanColumnProps {
  status: TaskStatus
  tasks: TaskWithRelations[]
  onMoveTask: (taskId: string, sourceStatus: TaskStatus, destinationStatus: TaskStatus, 
                  sourceIndex: number, destinationIndex: number) => Promise<{ success: boolean; error?: string }>
}

const statusConfig = {
  TODO: {
    title: 'To Do',
    color: 'border-gray-300',
    bgColor: 'bg-gray-50',
    countColor: 'bg-gray-200 text-gray-700'
  },
  IN_PROGRESS: {
    title: 'In Progress',
    color: 'border-blue-300',
    bgColor: 'bg-blue-50',
    countColor: 'bg-blue-200 text-blue-700'
  },
  IN_REVIEW: {
    title: 'In Review',
    color: 'border-yellow-300',
    bgColor: 'bg-yellow-50',
    countColor: 'bg-yellow-200 text-yellow-700'
  },
  DONE: {
    title: 'Done',
    color: 'border-green-300',
    bgColor: 'bg-green-50',
    countColor: 'bg-green-200 text-green-700'
  }
}

export function KanbanColumn({ status, tasks, onMoveTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  const config = statusConfig[status]

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{config.title}</h3>
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          config.countColor
        )}>
          {tasks.length}
        </span>
      </div>
      
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-lg border-2 border-dashed transition-colors',
          config.color,
          isOver ? config.bgColor : 'bg-transparent',
          'min-h-[400px] p-2'
        )}
      >
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onMoveTask={onMoveTask}
              />
            ))}
          </div>
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <p className="text-sm">No tasks in {config.title.toLowerCase()}</p>
          </div>
        )}
      </div>
    </div>
  )
}