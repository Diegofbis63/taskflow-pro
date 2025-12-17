import { z } from 'zod';

// User validation schemas
export const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be less than 100 characters')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Project validation schemas
export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  status: z.enum(['planning', 'active', 'completed', 'on_hold', 'cancelled']).default('planning'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().positive().optional()
});

export const updateProjectSchema = projectSchema.partial();

// Task validation schemas
export const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'completed', 'cancelled']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  projectId: z.string().uuid('Invalid project ID'),
  assignedToId: z.string().uuid('Invalid user ID').optional(),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().optional(),
  tags: z.array(z.string().max(20)).max(10, 'Maximum 10 tags allowed').optional()
});

export const updateTaskSchema = taskSchema.partial();

// Team validation schemas
export const teamSchema = z.object({
  name: z.string().min(2, 'Team name is required').max(100, 'Team name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  department: z.string().max(50, 'Department must be less than 50 characters').optional()
});

export const teamMemberSchema = z.object({
  teamId: z.string().uuid('Invalid team ID'),
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['member', 'lead', 'admin']).default('member'),
  permissions: z.array(z.enum(['read', 'write', 'delete', 'admin'])).default(['read'])
});

export const inviteTeamMemberSchema = z.object({
  teamId: z.string().uuid('Invalid team ID'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['member', 'lead', 'admin']).default('member'),
  message: z.string().max(500, 'Message must be less than 500 characters').optional()
});

// Analytics validation schemas
export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  teamIds: z.array(z.string().uuid()).optional(),
  projectIds: z.array(z.string().uuid()).optional(),
  userIds: z.array(z.string().uuid()).optional(),
  metrics: z.array(z.enum(['tasks', 'projects', 'time', 'productivity', 'collaboration'])).optional(),
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional(),
  format: z.enum(['json', 'csv', 'pdf']).default('json')
});

// Export validation schemas
export const exportRequestSchema = z.object({
  type: z.enum(['projects', 'tasks', 'teams', 'analytics', 'reports']),
  format: z.enum(['pdf', 'excel', 'csv', 'json']),
  filters: z.object({
    dateRange: z.object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional()
    }).optional(),
    status: z.array(z.string()).optional(),
    priority: z.array(z.string()).optional(),
    teamIds: z.array(z.string().uuid()).optional(),
    projectIds: z.array(z.string().uuid()).optional()
  }).optional(),
  template: z.string().optional(),
  includeCharts: z.boolean().default(true),
  includeDetails: z.boolean().default(true)
});

// Search validation schemas
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Query must be less than 100 characters'),
  type: z.enum(['projects', 'tasks', 'users', 'teams', 'all']).default('all'),
  filters: z.object({
    status: z.array(z.string()).optional(),
    priority: z.array(z.string()).optional(),
    dateRange: z.object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional()
    }).optional()
  }).optional(),
  sortBy: z.enum(['relevance', 'date', 'priority', 'status']).default('relevance'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});

// Utility function to validate request data
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Validation failed' };
  }
}

// Type exports
export type UserInput = z.infer<typeof userSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TeamInput = z.infer<typeof teamSchema>;
export type TeamMemberInput = z.infer<typeof teamMemberSchema>;
export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type ExportRequestInput = z.infer<typeof exportRequestSchema>;
export type SearchInput = z.infer<typeof searchSchema>;