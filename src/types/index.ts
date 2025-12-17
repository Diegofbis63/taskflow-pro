import { User, Project, Task, Comment, Activity, ProjectMember, Role, ProjectRole, TaskStatus, Priority, ActivityType, EntityType } from '@prisma/client'

export type { User, Project, Task, Comment, Activity, ProjectMember, Role, ProjectRole, TaskStatus, Priority, ActivityType, EntityType }

export type TaskWithRelations = Task & {
  project: Project
  assignee: User | null
  creator: User
  comments: Comment[]
  _count: {
    comments: number
  }
}

export type ProjectWithRelations = Project & {
  owner: User
  members: (ProjectMember & { user: User })[]
  tasks: Task[]
  _count: {
    members: number
    tasks: number
  }
}

export type ActivityWithRelations = Activity & {
  user: User | null
  project: Project | null
  task: Task | null
}

export type CommentWithRelations = Comment & {
  author: User
  task: Task
}

export type CreateTaskData = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'position'>
export type UpdateTaskData = Partial<CreateTaskData>
export type CreateProjectData = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
export type InitialTask = {
  title: string
  completed: boolean
}
export type UpdateProjectData = Partial<CreateProjectData>

export type TaskFilters = {
  status?: TaskStatus[]
  priority?: Priority[]
  assigneeId?: string
  search?: string
  tags?: string[]
  dueDate?: {
    from?: Date
    to?: Date
  }
}

export type KanbanColumn = {
  id: TaskStatus
  title: string
  tasks: TaskWithRelations[]
}

export type DragItem = {
  id: string
  type: 'task'
  columnId: TaskStatus
  index: number
}

export type ApiResponse<T> = {
  data: T | null
  error: string | null
  success: boolean
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type ActivityMetadata = {
  oldValue?: any
  newValue?: any
  fieldName?: string
  [key: string]: any
}