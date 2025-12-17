'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateTask } from '@/hooks/use-tasks'
import { Plus, Calendar } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface CreateTaskDialogProps {
  projectId: string
  onTaskCreated?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const TASK_PRIORITIES = [
  { value: 'LOW', label: 'Baja' },
  { value: 'MEDIUM', label: 'Media' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
]

export function CreateTaskDialog({ projectId, onTaskCreated, open, onOpenChange }: CreateTaskDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [dueDate, setDueDate] = useState('')

  // Use external open state if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  const createTaskMutation = useCreateTask()

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
      await createTaskMutation.mutateAsync({
        data: {
          title: title.trim(),
          description: description.trim(),
          priority: priority as any,
          dueDate: dueDate ? new Date(dueDate) : null,
          status: 'TODO',
          position: 0,
        },
        projectId
      })
      
      // Success - close dialog and reset form
      setIsOpen(false)
      setTitle('')
      setDescription('')
      setPriority('MEDIUM')
      setDueDate('')
      
      // Show success message
      toast({
        title: "¡Tarea creada!",
        description: "La tarea se ha creado exitosamente.",
      })
      
      // Call parent callback
      onTaskCreated?.()
    } catch (error) {
      console.error('Task creation error:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarea
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Tarea</DialogTitle>
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
              disabled={createTaskMutation.isPending}
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
              disabled={createTaskMutation.isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select value={priority} onValueChange={setPriority} disabled={createTaskMutation.isPending}>
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
                disabled={createTaskMutation.isPending}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={createTaskMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createTaskMutation.isPending || !title.trim()}
            >
              {createTaskMutation.isPending ? 'Creando...' : 'Crear Tarea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}