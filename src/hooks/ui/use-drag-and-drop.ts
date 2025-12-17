'use client'

import { useState, useCallback } from 'react'
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, 
         PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { DragItem } from '@/types'

interface UseDragAndDropProps {
  columns: Record<string, any[]>
  onMove: (taskId: string, sourceStatus: string, destinationStatus: string, 
           sourceIndex: number, destinationIndex: number) => Promise<{ success: boolean; error?: string }>
}

export function useDragAndDrop({ columns, onMove }: UseDragAndDropProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeTask, setActiveTask] = useState<any>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    
    // Find the active task
    for (const [status, tasks] of Object.entries(columns)) {
      const task = tasks.find(t => t.id === active.id)
      if (task) {
        setActiveTask(task)
        break
      }
    }
  }, [columns])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find source and destination columns
    let sourceStatus: string | null = null
    let destinationStatus: string | null = null

    for (const [status, tasks] of Object.entries(columns)) {
      if (tasks.some(t => t.id === activeId)) {
        sourceStatus = status
      }
      if (tasks.some(t => t.id === overId)) {
        destinationStatus = status
      }
    }

    // Prevent dropping on same position
    if (sourceStatus === destinationStatus && activeId === overId) {
      return
    }
  }, [columns])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find source and destination columns and indices
    let sourceStatus: string | null = null
    let destinationStatus: string | null = null
    let sourceIndex = -1
    let destinationIndex = -1

    for (const [status, tasks] of Object.entries(columns)) {
      const activeTaskIndex = tasks.findIndex(t => t.id === activeId)
      if (activeTaskIndex !== -1) {
        sourceStatus = status
        sourceIndex = activeTaskIndex
      }

      const overTaskIndex = tasks.findIndex(t => t.id === overId)
      if (overTaskIndex !== -1) {
        destinationStatus = status
        destinationIndex = overTaskIndex
      }
    }

    if (!sourceStatus || !destinationStatus) return

    // Handle moving to empty column
    if (destinationIndex === -1) {
      destinationIndex = 0
    }

    // Call the move handler
    await onMove(activeId, sourceStatus, destinationStatus, sourceIndex, destinationIndex)
  }, [columns, onMove])

  const DragAndDropProvider = useCallback(({ children }: { children: React.ReactNode }) => (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay>
        {activeId && activeTask ? (
          <div className="opacity-90">
            {/* Render your task overlay component here */}
            <TaskCard task={activeTask} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  ), [sensors, handleDragStart, handleDragOver, handleDragEnd, activeId, activeTask])

  return {
    DragAndDropProvider,
    activeId,
    activeTask,
  }
}

// Helper component for drag overlay (you'll need to create this)
function TaskCard({ task, isOverlay }: { task: any; isOverlay?: boolean }) {
  return (
    <div className={`bg-white p-4 rounded-lg shadow-md border-2 border-blue-500 ${isOverlay ? 'rotate-2' : ''}`}>
      <h3 className="font-medium text-gray-900">{task.title}</h3>
      {task.description && (
        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
      )}
    </div>
  )
}