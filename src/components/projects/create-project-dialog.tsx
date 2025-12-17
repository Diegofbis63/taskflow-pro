'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useCreateProject } from '@/hooks/use-projects'
import { Plus, X, Check, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { InitialTask } from '@/types'

interface CreateProjectDialogProps {
  userId: string
  onProjectCreated?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateProjectDialog({ userId, onProjectCreated, open, onOpenChange }: CreateProjectDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tasks, setTasks] = useState<InitialTask[]>([])
  const [newTask, setNewTask] = useState('')
  const [color, setColor] = useState('#3B82F6')

  // Use external open state if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen
  const createProjectMutation = useCreateProject()

  const addTask = () => {
    if (newTask.trim()) {
      const task: InitialTask = {
        title: newTask.trim(),
        completed: false
      }
      setTasks([...tasks, task])
      setNewTask('')
    }
  }

  const removeTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId))
  }

  const toggleTaskComplete = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast({
        title: "Error de validación",
        description: "El título es requerido",
        variant: "destructive",
      })
      return
    }

    try {
      await createProjectMutation.mutateAsync({
        data: {
          title: title.trim(),
          description: description.trim(),
          color: color
        },
        userId,
        initialTasks: tasks.length > 0 ? tasks : undefined
      })
      
      // Success - close dialog and reset form
      setIsOpen(false)
      setTitle('')
      setDescription('')
      setTasks([])
      setNewTask('')
      setColor('#3B82F6')
      
      // Show success message
      toast({
        title: "¡Proyecto creado!",
        description: "El proyecto se ha creado exitosamente.",
      })
      
      // Call parent callback
      onProjectCreated?.()
    } catch (error) {
      // Error is handled by the mutation hook
      console.error('Project creation error:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Crear Proyecto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre del proyecto"
              required
              disabled={createProjectMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del proyecto (opcional)"
              rows={3}
              disabled={createProjectMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color del proyecto</Label>
            <div className="flex gap-2">
              {[
                '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'
              ].map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    color === colorOption ? 'border-gray-900' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: colorOption }}
                  onClick={() => setColor(colorOption)}
                  disabled={createProjectMutation.isPending}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Tareas iniciales (opcional)</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Escribe una tarea y presiona Enter o +"
                  disabled={createProjectMutation.isPending}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTask()
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={addTask}
                  disabled={createProjectMutation.isPending || !newTask.trim()}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {tasks.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                  <div className="text-sm text-gray-600 mb-2">
                    Tareas iniciales ({tasks.length}):
                  </div>
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                      <button
                        type="button"
                        onClick={() => toggleTaskComplete(task.id)}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          task.completed 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        disabled={createProjectMutation.isPending}
                      >
                        {task.completed && <Check className="h-3 w-3" />}
                      </button>
                      <span className={`flex-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeTask(task.id)}
                        className="w-6 h-6 rounded text-red-500 hover:bg-red-50 flex items-center justify-center"
                        disabled={createProjectMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={createProjectMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createProjectMutation.isPending || !title.trim()}
            >
              {createProjectMutation.isPending ? 'Creando...' : 'Crear Proyecto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}