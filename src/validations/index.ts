import { z } from 'zod'
import { TaskStatus, Priority, ProjectRole, ActivityType, EntityType } from '@prisma/client'

export const TaskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'])
export const PriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
export const ProjectRoleEnum = z.enum(['OWNER', 'ADMIN', 'MEMBER'])

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  status: TaskStatusEnum.default('TODO'),
  priority: PriorityEnum.default('MEDIUM'),
  projectId: z.string().cuid('Invalid project ID'),
  assigneeId: z.string().cuid('Invalid assignee ID').optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  tags: z.string().optional(),
})

export const updateTaskSchema = createTaskSchema.partial()

export const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
})

export const updateProjectSchema = createProjectSchema.partial()

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
  taskId: z.string().cuid('Invalid task ID'),
})

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
})

export const addProjectMemberSchema = z.object({
  projectId: z.string().cuid('Invalid project ID'),
  userId: z.string().cuid('Invalid user ID'),
  role: ProjectRoleEnum.default('MEMBER'),
})

export const updateProjectMemberSchema = z.object({
  role: ProjectRoleEnum,
})

export const taskFiltersSchema = z.object({
  status: z.array(TaskStatusEnum).optional(),
  priority: z.array(PriorityEnum).optional(),
  assigneeId: z.string().cuid().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }).optional(),
})

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

export const activityLogSchema = z.object({
  action: z.enum(['CREATED', 'UPDATED', 'DELETED', 'MOVED', 'ASSIGNED', 'COMMENTED', 'STATUS_CHANGED']),
  entityType: z.enum(['PROJECT', 'TASK', 'COMMENT']),
  entityId: z.string().cuid(),
  projectId: z.string().cuid().optional(),
  userId: z.string().cuid(),
  metadata: z.any().optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>
export type UpdateProjectMemberInput = z.infer<typeof updateProjectMemberSchema>
export type TaskFiltersInput = z.infer<typeof taskFiltersSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type ActivityLogInput = z.infer<typeof activityLogSchema>