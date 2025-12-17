import { db } from '@/lib/db'
import { Task, TaskStatus, Priority, TaskWithRelations, CreateTaskData, UpdateTaskData, TaskFilters, ApiResponse, PaginatedResponse } from '@/types'

// Mock data for when database is not available
const mockTasks: TaskWithRelations[] = [
  {
    id: '1',
    title: 'Design new landing page',
    description: 'Create a modern, responsive landing page design',
    status: 'TODO',
    priority: 'HIGH',
    projectId: '1',
    assigneeId: '1',
    creatorId: '1',
    position: 0,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    tags: 'design,ui/ux',
    createdAt: new Date(),
    updatedAt: new Date(),
    project: {
      id: '1',
      title: 'Website Redesign',
      description: 'Complete website overhaul with modern design',
      color: '#3B82F6',
      ownerId: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    assignee: {
      id: '1',
      email: 'demo@example.com',
      name: 'Demo User',
      role: 'ADMIN' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    creator: {
      id: '1',
      email: 'creator@example.com',
      name: 'Creator User',
      role: 'ADMIN' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    comments: [],
    _count: { comments: 0, tasks: 0 }
  },
  {
    id: '2',
    title: 'Implement authentication',
    description: 'Add user authentication and authorization system',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    projectId: '1',
    assigneeId: '2',
    creatorId: '1',
    position: 1,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    tags: 'backend,security',
    createdAt: new Date(),
    updatedAt: new Date(),
    project: {
      id: '1',
      title: 'Website Redesign',
      description: 'Complete website overhaul with modern design',
      color: '3B82F6',
      ownerId: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    assignee: {
      id: '2',
      email: 'john@example.com',
      name: 'John Doe',
      role: 'MEMBER' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    creator: {
      id: '1',
      email: 'creator@example.com',
      name: 'Creator User',
      role: 'ADMIN' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    comments: [],
    _count: { comments: 0, tasks: 0 }
  },
  {
    id: '3',
    title: 'Create API documentation',
    description: 'Write comprehensive API documentation for all endpoints',
    status: 'TODO',
    priority: 'LOW',
    projectId: '1',
    assigneeId: null,
    creatorId: '1',
    position: 2,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    tags: 'api,documentation',
    createdAt: new Date(),
    updatedAt: new Date(),
    project: {
      id: '1',
      title: 'Website Redesign',
      description: 'Complete website overhaul with modern design',
      color: '#3B82F6',
      ownerId: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    assignee: null,
    creator: {
      id: '1',
      email: 'creator@example.com',
      name: 'Creator User',
      role: 'ADMIN' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    comments: [],
    _count: { comments: 0, tasks: 0 }
  }
]

export class TaskRepository {
  async findById(id: string): Promise<TaskWithRelations | null> {
    if (!db) {
      return mockTasks.find(task => task.id === id) || null
    }
    
    return await db.task.findUnique({
      where: { id },
      include: {
        project: true,
        assignee: true,
        creator: true,
        comments: {
          include: {
            author: true
          },
          _count: true
        },
      },
    })
  }

  async findByProjectId(
    projectId: string, 
    filters?: TaskFilters
  ): Promise<TaskWithRelations[]> {
    if (!db) {
      let filteredTasks = mockTasks.filter(task => task.projectId === projectId)
      
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          filteredTasks = filteredTasks.filter(task => filters.status!.includes(task.status))
        }
        if (filters.priority && filters.priority.length > 0) {
          filteredTasks = filteredTasks.filter(task => filters.priority!.includes(task.priority))
        }
        if (filters.assigneeId) {
          filteredTasks = filteredTasks.filter(task => task.assigneeId === filters.assigneeId)
        }
        if (filters.search) {
          filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(filters.search!.toLowerCase()) ||
            task.description?.toLowerCase().includes(filters.search!.toLowerCase())
          )
        }
        if (filters.tags && filters.tags.length > 0) {
          filteredTasks = filteredTasks.filter(task => 
            task.tags?.split(',').some(tag => filters.tags!.includes(tag.trim()))
          )
        }
        if (filters.dueDate) {
          filteredTasks = filteredTasks.filter(task => {
            if (!task.dueDate) return false
            const dueDate = new Date(task.dueDate)
            const fromDate = new Date(filters.dueDate!.from)
            const toDate = new Date(filters.dueDate!.to)
            return dueDate >= fromDate && dueDate <= toDate
          })
        }
      }
      
      return filteredTasks
    }
  }

  async create(data: CreateTaskData & { projectId: string }): Promise<TaskWithRelations> {
    if (!db) {
      // Fallback to mock data
      const mockTask: TaskWithRelations = {
        id: `temp-${Date.now()}`,
        ...data,
        projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: {
          id: 'current-user',
          email: '',
          name: 'Current User',
          role: 'MEMBER' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        assignee: data.assigneeId ? {
          id: data.assigneeId,
          email: 'assigned@example.com',
          name: 'Assigned User',
          role: 'MEMBER' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        } : null,
        comments: [],
        _count: { comments: 0, tasks: 0 },
      }

      mockTasks.push(mockTask)
      return mockTask
    }

    // Create task with assignee
    const task = await db.task.create({
      data: {
        ...data,
        projectId,
        creatorId: 'current-user',
      },
      include: {
        project: true,
        assignee: data.assigneeId ? {
          include: {
            user: true
          }
        } : undefined,
        creator: {
          include: {
            user: true
          },
        },
      },
    })

    return task
  }

  async update(id: string, data: UpdateTaskData): Promise<TaskWithRelations> {
    if (!db) {
      // Fallback to mock data
      const taskIndex = mockTasks.findIndex(task => task.id === id)
      if (taskIndex === -1) {
        throw new Error('Task not found')
      }
      
      mockTasks[taskIndex] = { ...mockTasks[taskIndex], ...data, updatedAt: new Date() }
      return mockTasks[taskIndex]
    }

    const updatedTask = await db.task.update({
      where: { id },
      data,
      include: {
        project: true,
        assignee: {
          include: { user: true }
        },
        creator: {
          include: { user: true }
        },
      },
    })

    return updatedTask
  }

  async updatePosition(id: string, status: TaskStatus, position: number): Promise<TaskWithRelations> {
    if (!db) {
      // Fallback to mock data
      const taskIndex = mockTasks.findIndex(task => task.id === id)
      if (taskIndex === -1) {
        throw new Error('Task not found')
      }
      
      mockTasks[taskIndex] = { ...mockTasks[taskIndex], status, position, updatedAt: new Date() }
      return mockTasks[taskIndex]
    }

    const updatedTask = await db.task.update({
      where: { id },
      data: { status, position },
      include: {
        project: true,
        assignee: {
          include: { user: true }
        },
        creator: {
          include: { user: true }
        },
      },
    })

    return updatedTask
  }

  async updateStatus(id: string, status: TaskStatus): Promise<TaskWithRelations> {
    if (!db) {
      // Fallback to mock data
      const taskIndex = mockTasks.findIndex(task => task.id === id)
      if (taskIndex === -1) {
        throw new Error('Task not found')
      }
      
      mockTasks[taskIndex] = { ...mockTasks[taskIndex], status, updatedAt: new Date() }
      return mockTasks[taskIndex]
    }

    const updatedTask = await db.task.update({
      where: { id },
      data: { status },
      include: {
        project: true,
        assignee: {
          include: { user: true }
        },
        creator: {
          include: { user: true }
        },
      },
    })

    return updatedTask
  }

  async delete(id: string): Promise<void> {
    if (!db) {
      // Fallback to mock data
      const taskIndex = mockTasks.findIndex(task => task.id === id)
      if (taskIndex !== -1) {
        mockTasks.splice(taskIndex, 1)
      }
      return
    }

    await db.task.delete({ where: { id } })
  }

  async getKanbanColumns(projectId: string): Promise<Record<TaskStatus, TaskWithRelations[]>> {
    const tasks = await this.findByProjectId(projectId)
    
    const columns: Record<TaskStatus, TaskWithRelations[]> = {
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      DONE: []
    }

    tasks.forEach(task => {
      columns[task.status].push(task)
    })

    return columns
  }

  async reorderTasks(
    projectId: string,
    sourceStatus: TaskStatus,
    destinationStatus: TaskStatus,
    sourceIndex: number,
    destinationIndex: number
  ): Promise<void> {
    if (!db) {
      // Fallback to mock data
      const projectTasks = mockTasks.filter(task => task.projectId === projectId)
      const sourceTasks = projectTasks.filter(task => task.status === sourceStatus)
      const destinationTasks = projectTasks.filter(task => task.status === destinationStatus)
      
      // Remove from source
      const [movedTask] = sourceTasks.splice(sourceIndex, 1)
      
      // Add to destination at correct position
      destinationTasks.splice(destinationIndex, 0, movedTask)
      
      // Update positions
      destinationTasks.forEach((task, index) => {
        const taskIndex = mockTasks.findIndex(t => t.id === task.id)
        if (taskIndex !== -1) {
          mockTasks[taskIndex] = { ...mockTasks[taskIndex], position: index, updatedAt: new Date() }
        }
      })
      
      return
    }

    // Update all affected tasks
    const updates = destinationTasks.map((task, index) => ({
      where: { id: task.id },
      data: { position: index, status: destinationStatus }
    }))

    await Promise.all(updates.map(update => 
      db.task.update(update)
    ))
  }
}

export const taskRepository = new TaskRepository()