'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CalendarIcon, X, Edit2, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { TaskStatus, Priority } from '@prisma/client'
import type { TaskWithRelations, UpdateTaskInput } from '@/types'

interface TaskDetailDialogProps {
  task: TaskWithRelations | null
  open: boolean
  onClose: () => void
  onUpdateTask: (id: string, data: UpdateTaskInput) => Promise<{ success: boolean; error?: string }>
  onDeleteTask: (id: string) => Promise<{ success: boolean; error?: string }>
}

export function TaskDetailDialog({ task, open, onClose, onUpdateTask, onDeleteTask }: TaskDetailDialogProps) {
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<UpdateTaskInput>>({})
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)

  if (!task) return null

  const priorityConfig = {
    LOW: { label: 'Low', color: 'bg-gray-100 text-gray-700' },
    MEDIUM: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
    HIGH: { label: 'High', color: 'bg-orange-100 text-orange-700' },
    URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-700' }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId,
      tags: task.tags
    })
    setDueDate(task.dueDate ? new Date(task.dueDate) : undefined)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({})
    setDueDate(undefined)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const result = await onUpdateTask(task.id, {
        ...formData,
        dueDate: dueDate?.toISOString(),
      } as UpdateTaskInput)

      if (result.success) {
        setIsEditing(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      setLoading(true)
      try {
        const result = await onDeleteTask(task.id)
        if (result.success) {
          onClose()
        }
      } finally {
        setLoading(false)
      }
    }
  }

  const handleTagsChange = (value: string) => {
    setFormData(prev => ({ ...prev, tags: value }))
  }

  const addTag = (tag: string) => {
    const currentTags = formData.tags ? formData.tags.split(',').filter(t => t.trim()) : []
    if (!currentTags.includes(tag.trim())) {
      const newTags = [...currentTags, tag.trim()].join(', ')
      setFormData(prev => ({ ...prev, tags: newTags }))
    }
  }

  const removeTag = (tagToRemove: string) => {
    const currentTags = formData.tags ? formData.tags.split(',').filter(t => t.trim()) : []
    const newTags = currentTags.filter(tag => tag !== tagToRemove).join(', ')
    setFormData(prev => ({ ...prev, tags: newTags }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Task Details</DialogTitle>
            <div className="flex gap-2">
              {!isEditing && (
                <>
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="text-sm font-medium">Title</label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="status" className="text-sm font-medium">Status</label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as TaskStatus }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="IN_REVIEW">In Review</SelectItem>
                      <SelectItem value="DONE">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="priority" className="text-sm font-medium">Priority</label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as Priority }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label htmlFor="dueDate" className="text-sm font-medium">Due Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label htmlFor="tags" className="text-sm font-medium">Tags</label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="Enter tags separated by commas"
                />
                {formData.tags && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.split(',').filter(tag => tag.trim()).map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag.trim()}
                        <button
                          type="button"
                          onClick={() => removeTag(tag.trim())}
                          className="hover:bg-gray-200 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={priorityConfig[task.priority].color}>
                    {priorityConfig[task.priority].label}
                  </Badge>
                  <Badge variant="outline">{task.status.replace('_', ' ')}</Badge>
                </div>
              </div>

              {task.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{task.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Assignee</h3>
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={task.assignee.avatar || ''} />
                        <AvatarFallback>
                          {task.assignee.name?.charAt(0) || task.assignee.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{task.assignee.name || task.assignee.email}</p>
                        <p className="text-sm text-gray-500">{task.assignee.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Unassigned</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Due Date</h3>
                  {task.dueDate ? (
                    <p className="text-gray-700">{format(new Date(task.dueDate), 'PPP')}</p>
                  ) : (
                    <p className="text-gray-500">No due date</p>
                  )}
                </div>
              </div>

              {task.tags && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.split(',').filter(tag => tag.trim()).map(tag => (
                      <Badge key={tag} variant="secondary">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Metadata</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <p className="text-gray-700">{format(new Date(task.createdAt), 'PPP')}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Updated:</span>
                    <p className="text-gray-700">{format(new Date(task.updatedAt), 'PPP')}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Comments:</span>
                    <p className="text-gray-700">{task._count.comments}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Project:</span>
                    <p className="text-gray-700">{task.project.title}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}