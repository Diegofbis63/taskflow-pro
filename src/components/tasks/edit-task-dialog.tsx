'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUpdateTask } from '@/hooks/use-tasks'
import { Edit, Calendar, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface EditTaskDialogProps {
  task: {
    id: string
    title: string
    description?: string
    priority: string
    status: string
    dueDate?: string
  }
  projectId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onTaskUpdated?: () => void
}

const TASK_PRIORITIES = [
  { value: 'LOW', label: 'Baja' },
  { value: 'MEDIUM', label: 'Media' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
]

const TASK_STATUSES = [
  { value: 'TODO', label: 'Por Hacer', color: 'bg-gray-100 text-gray-800' },
  { value: 'IN_PROGRESS', label: 'En Progreso', color: 'bg-blue-100 text-blue-800' },
  { value: 'IN_REVIEW', label: 'En Revisión', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'DONE', label: 'Completada', color: 'bg-green-100 text-green-800' },
]

export function EditTaskDialog({ 
  task, 
  projectId, 
  open, 
  onOpenChange, 
  onTaskUpdated 
}: EditTaskDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [status, setStatus] = useState('TODO')
  const [dueDate, setDueDate] = useState('')

  // Use external open state if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  // Initialize form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority(task.priority || 'MEDIUM')
      setStatus(task.status || 'TODO')
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '')
    }
  }, [task])

  const updateTaskMutation = useUpdateTask()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast({
        title: "Error de validación",
        description: "El título de la tarea es requerido",
        variant: "destructive",
      })
      return
    }

    try {
      await updateTaskMutation.mutateAsync({
        id: task.id,
        data: {
          title: title.trim(),
          description: description.trim(),
          priority: priority as any,
          status: status as any,
          dueDate: dueDate ? new Date(dueDate) : null,
        }
      })
      
      // Success - close dialog
      setIsOpen(false)
      
      // Show success message
      toast({
        title: "¡Tarea actualizada!",
        description: "La tarea se ha actualizado exitosamente.",
      })
      
      // Call parent callback
      onTaskUpdated?.()
    } catch (error) {
      console.error('Task update error:', error)
    }
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    
    // Auto-update via optimistic update
    updateTaskMutation.mutate({
      id: task.id,
      data: { status: newStatus as any }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Tarea</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la tarea"
              required
              disabled={updateTaskMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción de la tarea (opcional)"
              rows={3}
              disabled={updateTaskMutation.isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select value={priority} onValueChange={setPriority} disabled={updateTaskMutation.isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona prioridad" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Fecha de vencimiento</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={updateTaskMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select value={status} onValueChange={setStatus} disabled={updateTaskMutation.isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona estado" />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        s.value === 'TODO' ? 'bg-gray-400' :
                        s.value === 'IN_PROGRESS' ? 'bg-blue-400' :
                        s.value === 'IN_REVIEW' ? 'bg-yellow-400' :
                        'bg-green-400'
                      }`} />
                      <span>{s.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={updateTaskMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateTaskMutation.isPending || !title.trim()}
            >
              {updateTaskMutation.isPending ? 'Actualizando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}