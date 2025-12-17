'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useDeleteProject } from '@/hooks/use-projects'
import { Trash2 } from 'lucide-react'

interface DeleteProjectButtonProps {
  projectId: string
  userId: string
  projectName: string
}

export function DeleteProjectButton({ projectId, userId, projectName }: DeleteProjectButtonProps) {
  const [open, setOpen] = useState(false)
  const deleteProjectMutation = useDeleteProject()

  const handleDelete = async () => {
    try {
      await deleteProjectMutation.mutateAsync({ id: projectId, userId })
      setOpen(false)
    } catch (error) {
      console.error('Delete project error:', error)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de eliminar el proyecto <strong>"{projectName}"</strong>. 
            Esta acción no se puede deshacer y también se eliminarán todas las tareas asociadas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteProjectMutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteProjectMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteProjectMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}