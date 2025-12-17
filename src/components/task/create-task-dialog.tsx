'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Plus, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { TaskStatus, Priority } from '@prisma/client'
import type { CreateTaskInput } from '@/types'

interface CreateTaskDialogProps {
  projectId: string
  onCreateTask: (data: CreateTaskInput) => Promise<{ success: boolean; error?: string }>
  trigger?: React.ReactNode
}

export function CreateTaskDialog({ projectId, onCreateTask, trigger }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<CreateTaskInput>>({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    projectId,
    tags: ''
  })
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await onCreateTask({
        ...formData,
        dueDate: dueDate?.toISOString(),
      } as CreateTaskInput)

      if (result.success) {
        setOpen(false)
        setFormData({
          title: '',
          description: '',
          status: 'TODO',
          priority: 'MEDIUM',
          projectId,
          tags: ''
        })
        setDueDate(undefined)
      }
    } finally {
      setLoading(false)
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title"
              required
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

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}