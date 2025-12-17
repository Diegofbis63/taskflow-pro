'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useTasks, useUpdateTaskStatus, useDeleteTask } from '@/hooks/use-tasks'
import { CreateTaskDialog } from './create-task-dialog'
import { AssignTaskDialog } from './assign-task-dialog'
import { EditTaskDialog } from './edit-task-dialog'
import { Plus, Trash2, Calendar, AlertCircle, Edit, UserPlus } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface TaskListProps {
  projectId: string
  projectColor?: string
  projectMembers?: Array<{
    id: string
    user: {
      id: string
      name: string
      email: string
    }
  }>
}

const TASK_STATUS_CONFIG = {
  TODO: {
    label: 'Por Hacer',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    checkboxColor: 'border-gray-300',
  },
  IN_PROGRESS: {
    label: 'En Progreso',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    checkboxColor: 'border-blue-300',
  },
  IN_REVIEW: {
    label: 'En Revisión',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    checkboxColor: 'border-yellow-300',
  },
  DONE: {
    label: 'Completada',
    color: 'bg-green-100 text-green-800 border-green-200',
    checkboxColor: 'border-green-300',
  },
}

const PRIORITY_CONFIG = {
  LOW: { label: 'Baja', color: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: 'Media', color: 'bg-blue-100 text-blue-600' },
  HIGH: { label: 'Alta', color: 'bg-orange-100 text-orange-600' },
  URGENT: { label: 'Urgente', color: 'bg-red-100 text-red-600' },
}

export function TaskList({ projectId, projectColor, projectMembers }: TaskListProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<any>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const { data: tasksData, isLoading } = useTasks(projectId)
  const updateTaskStatusMutation = useUpdateTaskStatus()
  const deleteTaskMutation = useDeleteTask()

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await updateTaskStatusMutation.mutateAsync({ id: taskId, status: newStatus })
    } catch (error) {
      console.error('Status update error:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTaskMutation.mutateAsync({ id: taskId, projectId })
    } catch (error) {
      console.error('Task delete error:', error)
    }
  }

  const handleAssignTask = (taskId: string) => {
    setSelectedTaskId(taskId)
    setShowAssignDialog(true)
  }

  const handleEditTask = (task: any) => {
    setSelectedTaskForEdit(task)
    setShowEditDialog(true)
  }

  const handleTaskCreated = () => {
    setShowCreateDialog(false)
  }

  const handleTaskAssigned = () => {
    setShowAssignDialog(false)
    setSelectedTaskId('')
  }

  const handleTaskUpdated = () => {
    setShowEditDialog(false)
    setSelectedTaskForEdit(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!tasksData?.tasks || tasksData.tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay tareas en este proyecto
        </h3>
        <p className="text-gray-600 mb-4">
          Crea tu primera tarea para comenzar
        </p>
        <CreateTaskDialog 
          projectId={projectId}
          onTaskCreated={handleTaskCreated}
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </div>
    )
  }

  // Group tasks by status
  const tasksByStatus = {
    TODO: tasksData.tasks.filter(t => t.status === 'TODO'),
    IN_PROGRESS: tasksData.tasks.filter(t => t.status === 'IN_PROGRESS'),
    IN_REVIEW: tasksData.tasks.filter(t => t.status === 'IN_REVIEW'),
    DONE: tasksData.tasks.filter(t => t.status === 'DONE'),
  }

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Tareas ({tasksData.totalTasks})
          </h3>
          <div className="flex gap-2 text-sm text-gray-600">
            <span>{tasksData.todoTasks} por hacer</span>
            <span>•</span>
            <span>{tasksData.inProgressTasks} en progreso</span>
            <span>•</span>
            <span>{tasksData.completedTasks} completadas</span>
          </div>
        </div>
        <CreateTaskDialog 
          projectId={projectId}
          onTaskCreated={handleTaskCreated}
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </div>

      {/* Tasks grouped by status */}
      {Object.entries(tasksByStatus).map(([status, tasks]) => (
        <div key={status} className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <div 
              className={`w-3 h-3 rounded-full border-2 ${
                status === 'TODO' ? 'bg-gray-400 border-gray-400' :
                status === 'IN_PROGRESS' ? 'bg-blue-400 border-blue-400' :
                status === 'IN_REVIEW' ? 'bg-yellow-400 border-yellow-400' :
                'bg-green-400 border-green-400'
              }`}
            />
            <h4 className="font-medium text-gray-900">
              {TASK_STATUS_CONFIG[status as keyof typeof TASK_STATUS_CONFIG].label} ({tasks.length})
            </h4>
          </div>          
          {tasks.map((task) => (
            <Card 
              key={task.id} 
              className={`transition-all hover:shadow-md ${
                TASK_STATUS_CONFIG[task.status as keyof typeof TASK_STATUS_CONFIG].color
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <Checkbox
                    checked={task.status === 'DONE'}
                    onCheckedChange={() => {
                      const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE'
                      handleStatusChange(task.id, newStatus)
                    }}
                    disabled={updateTaskStatusMutation.isPending}
                    className={`mt-1 ${
                      TASK_STATUS_CONFIG[task.status as keyof typeof TASK_STATUS_CONFIG].checkboxColor
                    }`}
                  />
                  
                  {/* Task content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h5 className={`font-medium text-gray-900 ${
                        task.status === 'DONE' ? 'line-through' : ''
                      }`}>
                        {task.title}
                      </h5>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Edit button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTask(task)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        {/* Assign button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAssignTask(task.id)}
                          className="h-8 w-8 p-0"
                          disabled={!projectMembers || projectMembers.length === 0}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        
                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Description */}
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    {/* Task metadata */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        {/* Priority badge */}
                        {task.priority && task.priority !== 'MEDIUM' && (
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${
                              PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]?.color || ''
                            }`}
                          >
                            {PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]?.label}
                          </Badge>
                        )}
                        
                        {/* Assignee */}
                        {task.assignee && (
                          <div className="flex items-center gap-1">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
                              {task.assignee.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs text-gray-600">
                              {task.assignee.name}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Due date */}
                      {task.dueDate && (
                        <span className="text-xs text-gray-500">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(task.dueDate).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      {/* Dialogs */}
      <AssignTaskDialog
        taskId={selectedTaskId}
        projectId={projectId}
        currentAssignee={tasksData.tasks.find(t => t.id === selectedTaskId)?.assignee?.name}
        projectMembers={projectMembers || []}
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
      />

      <EditTaskDialog
        task={selectedTaskForEdit}
        projectId={projectId}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  )
}