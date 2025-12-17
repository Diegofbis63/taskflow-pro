'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUpdateTask } from '@/hooks/use-tasks'
import { UserPlus, Users } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface AssignTaskDialogProps {
  taskId: string
  projectId: string
  currentAssignee?: string
  projectMembers: Array<{
    id: string
    user: {
      id: string
      name: string
      email: string
    }
  }>
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AssignTaskDialog({ 
  taskId, 
  projectId, 
  currentAssignee, 
  projectMembers, 
  open, 
  onOpenChange 
}: AssignTaskDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [selectedAssignee, setSelectedAssignee] = useState('')

  // Use external open state if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  const updateTaskMutation = useUpdateTask()

  const handleAssign = async () => {
    if (!selectedAssignee) {
      toast({
        title: "Error de validación",
        description: "Debes seleccionar un usuario para asignar la tarea.",
        variant: "destructive",
      })
      return
    }

    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        data: {
          assigneeId: selectedAssignee
        }
      })
      
      setIsOpen(false)
      setSelectedAssignee('')
      
      toast({
        title: "¡Tarea asignada!",
        description: "La tarea se ha asignado exitosamente.",
      })
    } catch (error) {
      console.error('Task assignment error:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <UserPlus className="h-4 w-4 mr-2" />
          Asignar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Asignar Tarea</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assignee">Asignar a</Label>
            <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un miembro del equipo" />
              </SelectTrigger>
              <SelectContent>
                {projectMembers.length > 0 ? (
                  projectMembers.map((member) => (
                    <SelectItem key={member.id} value={member.user.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
                          {member.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{member.user.name}</div>
                          <div className="text-sm text-gray-500">{member.user.email}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>No hay miembros en este proyecto</span>
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {currentAssignee && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Asignación actual:</span> {
                  projectMembers.find(m => m.user.id === currentAssignee)?.user.name || 'Usuario no encontrado'
                }
              </p>
            </div>
          )}

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
              onClick={handleAssign}
              disabled={updateTaskMutation.isPending || !selectedAssignee}
            >
              {updateTaskMutation.isPending ? 'Asignando...' : 'Asignar Tarea'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}