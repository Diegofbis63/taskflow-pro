'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, Filter, X, Search } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { TaskStatus, Priority } from '@prisma/client'
import type { TaskFilters } from '@/types'

interface TaskFiltersProps {
  filters: TaskFilters
  onFiltersChange: (filters: TaskFilters) => void
  onClearFilters: () => void
  users?: Array<{ id: string; name: string | null; email: string }>
}

const statusOptions = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DONE', label: 'Done' }
]

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' }
]

export function TaskFilters({ filters, onFiltersChange, onClearFilters, users = [] }: TaskFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [tempFilters, setTempFilters] = useState<TaskFilters>(filters)
  const [searchQuery, setSearchQuery] = useState(filters.search || '')

  const handleStatusChange = (status: TaskStatus, checked: boolean) => {
    const currentStatuses = tempFilters.status || []
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter(s => s !== status)
    
    setTempFilters(prev => ({ ...prev, status: newStatuses }))
  }

  const handlePriorityChange = (priority: Priority, checked: boolean) => {
    const currentPriorities = tempFilters.priority || []
    const newPriorities = checked
      ? [...currentPriorities, priority]
      : currentPriorities.filter(p => p !== priority)
    
    setTempFilters(prev => ({ ...prev, priority: newPriorities }))
  }

  const handleDateChange = (type: 'from' | 'to', date: Date | undefined) => {
    setTempFilters(prev => ({
      ...prev,
      dueDate: {
        ...prev.dueDate,
        [type]: date?.toISOString()
      }
    }))
  }

  const applyFilters = () => {
    onFiltersChange({ ...tempFilters, search: searchQuery })
    setIsFilterOpen(false)
  }

  const clearFilters = () => {
    setTempFilters({})
    setSearchQuery('')
    onClearFilters()
    setIsFilterOpen(false)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (tempFilters.status?.length) count++
    if (tempFilters.priority?.length) count++
    if (tempFilters.assigneeId) count++
    if (tempFilters.dueDate?.from || tempFilters.dueDate?.to) count++
    if (searchQuery) count++
    return count
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onFiltersChange({ ...tempFilters, search: searchQuery })
            }
          }}
          className="pl-10"
        />
      </div>

      {/* Filter Button */}
      <div className="flex items-center gap-2">
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          
          <PopoverContent className="w-96 p-4" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Filters</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear
                  </Button>
                  <Button size="sm" onClick={applyFilters}>
                    Apply
                  </Button>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <h4 className="text-sm font-medium mb-2">Status</h4>
                <div className="space-y-2">
                  {statusOptions.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${option.value}`}
                        checked={tempFilters.status?.includes(option.value as TaskStatus) || false}
                        onCheckedChange={(checked) => 
                          handleStatusChange(option.value as TaskStatus, checked as boolean)
                        }
                      />
                      <label htmlFor={`status-${option.value}`} className="text-sm">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div>
                <h4 className="text-sm font-medium mb-2">Priority</h4>
                <div className="space-y-2">
                  {priorityOptions.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`priority-${option.value}`}
                        checked={tempFilters.priority?.includes(option.value as Priority) || false}
                        onCheckedChange={(checked) => 
                          handlePriorityChange(option.value as Priority, checked as boolean)
                        }
                      />
                      <label htmlFor={`priority-${option.value}`} className="text-sm">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assignee Filter */}
              <div>
                <h4 className="text-sm font-medium mb-2">Assignee</h4>
                <Select 
                  value={tempFilters.assigneeId || ''} 
                  onValueChange={(value) => 
                    setTempFilters(prev => ({ ...prev, assigneeId: value || undefined }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All assignees</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date Filter */}
              <div>
                <h4 className="text-sm font-medium mb-2">Due Date</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600">From</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !tempFilters.dueDate?.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {tempFilters.dueDate?.from 
                            ? format(new Date(tempFilters.dueDate.from), "PPP") 
                            : "Pick a date"
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={tempFilters.dueDate?.from ? new Date(tempFilters.dueDate.from) : undefined}
                          onSelect={(date) => handleDateChange('from', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-600">To</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !tempFilters.dueDate?.to && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {tempFilters.dueDate?.to 
                            ? format(new Date(tempFilters.dueDate.to), "PPP") 
                            : "Pick a date"
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={tempFilters.dueDate?.to ? new Date(tempFilters.dueDate.to) : undefined}
                          onSelect={(date) => handleDateChange('to', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filter Badges */}
        {getActiveFilterCount() > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {tempFilters.status?.map(status => (
            <Badge key={status} variant="secondary" className="gap-1">
              Status: {statusOptions.find(s => s.value === status)?.label}
              <button
                onClick={() => handleStatusChange(status, false)}
                className="hover:bg-gray-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {tempFilters.priority?.map(priority => (
            <Badge key={priority} variant="secondary" className="gap-1">
              Priority: {priorityOptions.find(p => p.value === priority)?.label}
              <button
                onClick={() => handlePriorityChange(priority, false)}
                className="hover:bg-gray-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {tempFilters.assigneeId && (
            <Badge variant="secondary" className="gap-1">
              Assignee: {users.find(u => u.id === tempFilters.assigneeId)?.name || 'Unknown'}
              <button
                onClick={() => setTempFilters(prev => ({ ...prev, assigneeId: undefined }))}
                className="hover:bg-gray-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchQuery}
              <button
                onClick={() => {
                  setSearchQuery('')
                  onFiltersChange({ ...tempFilters, search: undefined })
                }}
                className="hover:bg-gray-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}