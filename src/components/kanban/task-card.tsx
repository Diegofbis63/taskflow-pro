import { memo, useMemo, useCallback } from 'react'
import { TaskStatus, Priority } from '@prisma/client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Calendar, MessageSquare, User, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaskWithRelations } from '@/types'

interface TaskCardProps {
  task: TaskWithRelations
  onMoveTask?: (taskId: string, sourceStatus: TaskStatus, destinationStatus: TaskStatus, 
                  sourceIndex: number, destinationIndex: number) => Promise<{ success: boolean; error?: string }>
  onClick?: (task: TaskWithRelations) => void
  isOverlay?: boolean
}

// Memoize the priority configuration
const priorityConfig = {
  LOW: { label: 'Low', color: 'bg-gray-100 text-gray-700' },
  MEDIUM: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-700' }
} as const

export const TaskCard = memo<TaskCardProps>(({ task, onClick, isOverlay = false }) => {
  // Memoize computed values to prevent unnecessary recalculations
  const priority = useMemo(() => priorityConfig[task.priority], [task.priority])
  
  const tags = useMemo(() => {
    if (!task.tags) return []
    return task.tags.split(',').filter(tag => tag.trim())
  }, [task.tags])

  const formattedDueDate = useMemo(() => {
    if (!task.dueDate) return null
    return new Date(task.dueDate).toLocaleDateString()
  }, [task.dueDate])

  const assigneeInitials = useMemo(() => {
    if (!task.assignee) return null
    return task.assignee.name?.charAt(0) || task.assignee.email.charAt(0)
  }, [task.assignee])

  const handleClick = useCallback(() => {
    onClick?.(task)
  }, [onClick, task])

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]",
        isOverlay && "opacity-90 rotate-2 shadow-lg border-2 border-blue-500"
      )}
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-sm text-gray-900 leading-tight line-clamp-2">
            {task.title}
          </h4>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              // Handle menu click
            }}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {task.description && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className={cn('text-xs', priority.color)}>
            {priority.label}
          </Badge>
          
          {tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag.trim()}
                </Badge>
              ))}
              {tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            {task.assignee ? (
              <div className="flex items-center gap-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.assignee.avatar || ''} />
                  <AvatarFallback className="text-xs">
                    {assigneeInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-600 truncate max-w-20">
                  {task.assignee.name || task.assignee.email}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400">
                <User className="h-3 w-3" />
                <span className="text-xs">Unassigned</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-gray-400">
            {formattedDueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span className="text-xs">{formattedDueDate}</span>
              </div>
            )}
            
            {task._count.comments > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span className="text-xs">{task._count.comments}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

TaskCard.displayName = 'TaskCard'