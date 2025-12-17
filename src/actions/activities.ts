'use server'

import { auth } from '@/lib/auth'
import { activityRepository } from '@/lib/repositories'

export async function getProjectActivities(projectId: string, limit = 50) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const activities = await activityRepository.findByProjectId(projectId, limit)
    return { success: true, data: activities }
  } catch (error) {
    console.error('Error fetching activities:', error)
    return { success: false, error: 'Failed to fetch activities' }
  }
}

export async function getTaskActivities(taskId: string, limit = 20) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const activities = await activityRepository.findByTaskId(taskId, limit)
    return { success: true, data: activities }
  } catch (error) {
    console.error('Error fetching task activities:', error)
    return { success: false, error: 'Failed to fetch activities' }
  }
}

export async function getUserActivities(limit = 20) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const activities = await activityRepository.findByUserId(session.user.id, limit)
    return { success: true, data: activities }
  } catch (error) {
    console.error('Error fetching user activities:', error)
    return { success: false, error: 'Failed to fetch activities' }
  }
}