import { db } from '@/lib/db'
import { Activity } from '@prisma/client'
import type { ActivityWithRelations, ActivityLogInput } from '@/types'

// Mock data for when database is not available
const mockActivities: ActivityWithRelations[] = []

export class ActivityRepository {
  async create(data: ActivityLogInput): Promise<ActivityWithRelations> {
    if (!db) {
      const newActivity: ActivityWithRelations = {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date(),
        user: {
          id: data.userId,
          email: 'user@example.com',
          name: 'Activity User',
          role: 'MEMBER',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        project: data.projectId ? {
          id: data.projectId,
          title: 'Mock Project',
          description: 'Mock project description',
          color: '#3B82F6',
          ownerId: data.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        } : null,
        task: data.entityType === 'TASK' ? {
          id: data.entityId,
          title: 'Mock Task',
          description: 'Mock task description',
          status: 'TODO',
          priority: 'MEDIUM',
          projectId: data.projectId || '1',
          assigneeId: null,
          creatorId: data.userId,
          position: 0,
          dueDate: null,
          tags: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          assignee: null,
        } : null
      }
      
      mockActivities.push(newActivity)
      return newActivity
    }

    const activity = await db.activity.create({
      data,
      include: {
        user: true,
        project: true,
        task: {
          include: {
            assignee: true
          }
        }
      }
    })

    return activity
  }

  async findByProjectId(projectId: string, limit = 50): Promise<ActivityWithRelations[]> {
    if (!db) {
      return mockActivities
        .filter(activity => activity.projectId === projectId)
        .slice(0, limit)
    }
    
    return await db.activity.findMany({
      where: { projectId },
      include: {
        user: true,
        project: true,
        task: {
          include: {
            assignee: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })
  }

  async findByTaskId(taskId: string, limit = 20): Promise<ActivityWithRelations[]> {
    if (!db) {
      return mockActivities
        .filter(activity => activity.entityType === 'TASK' && activity.entityId === taskId)
        .slice(0, limit)
    }
    
    return await db.activity.findMany({
      where: { 
        entityType: 'TASK',
        entityId: taskId 
      },
      include: {
        user: true,
        project: true,
        task: {
          include: {
            assignee: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })
  }

  async findByUserId(userId: string, limit = 20): Promise<ActivityWithRelations[]> {
    if (!db) {
      return mockActivities
        .filter(activity => activity.userId === userId)
        .slice(0, limit)
    }
    
    return await db.activity.findMany({
      where: { userId },
      include: {
        user: true,
        project: true,
        task: {
          include: {
            assignee: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })
  }

  async deleteOldActivities(daysOld = 90): Promise<void> {
    if (!db) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)
      
      for (let i = mockActivities.length - 1; i >= 0; i--) {
        if (mockActivities[i].createdAt < cutoffDate) {
          mockActivities.splice(i, 1)
        }
      }
      return
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    await db.activity.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    })
  }
}

export const activityRepository = new ActivityRepository()