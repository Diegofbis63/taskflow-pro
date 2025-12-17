'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { taskRepository } from '@/lib/repositories'
import { createTaskSchema, updateTaskSchema } from '@/validations'
import type { CreateTaskInput, UpdateTaskInput } from '@/validations'
import { ActivityType, EntityType } from '@prisma/client'
import { activityRepository } from '@/lib/repositories'

export async function getTask(id: string) {
  try {
    const task = await taskRepository.findById(id)
    if (!task) {
      return { success: false, error: 'Task not found' }
    }
    return { success: true, data: task }
  } catch (error) {
    console.error('Error fetching task:', error)
    return { success: false, error: 'Failed to fetch task' }
  }
}

export async function getTasksByProject(projectId: string, filters?: any) {
  try {
    const tasks = await taskRepository.findByProjectId(projectId, filters)
    return { success: true, data: tasks }
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return { success: false, error: 'Failed to fetch tasks' }
  }
}

export async function getKanbanColumns(projectId: string) {
  try {
    const columns = await taskRepository.getKanbanColumns(projectId)
    return { success: true, data: columns }
  } catch (error) {
    console.error('Error fetching kanban columns:', error)
    return { success: false, error: 'Failed to fetch kanban columns' }
  }
}

export async function createTask(data: CreateTaskInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const validatedData = createTaskSchema.parse(data)
    
    const task = await taskRepository.create({
      ...validatedData,
      creatorId: session.user.id,
    })

    // Log activity
    await activityRepository.create({
      action: 'CREATED' as ActivityType,
      entityType: 'TASK' as EntityType,
      entityId: task.id,
      projectId: task.projectId,
      userId: session.user.id,
      metadata: {
        taskTitle: task.title,
        taskStatus: task.status
      }
    })

    revalidatePath(`/projects/${task.projectId}`)
    return { success: true, data: task }
  } catch (error) {
    console.error('Error creating task:', error)
    if (error instanceof Error && error.message.includes('Invalid')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to create task' }
  }
}

export async function updateTask(id: string, data: UpdateTaskInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const validatedData = updateTaskSchema.parse(data)
    
    const existingTask = await taskRepository.findById(id)
    if (!existingTask) {
      return { success: false, error: 'Task not found' }
    }

    // Check if user has permission to update this task
    const isOwner = existingTask.project.ownerId === session.user.id
    const isAssignee = existingTask.assigneeId === session.user.id
    const isCreator = existingTask.creatorId === session.user.id

    if (!isOwner && !isAssignee && !isCreator) {
      return { success: false, error: 'Insufficient permissions' }
    }

    const task = await taskRepository.update(id, validatedData)

    // Log activity for significant changes
    const changes = Object.keys(validatedData).filter(key => 
      existingTask[key as keyof typeof existingTask] !== validatedData[key as keyof typeof validatedData]
    )

    if (changes.length > 0) {
      await activityRepository.create({
        action: 'UPDATED' as ActivityType,
        entityType: 'TASK' as EntityType,
        entityId: task.id,
        projectId: task.projectId,
        userId: session.user.id,
        metadata: {
          changes: validatedData,
          previousValues: existingTask
        }
      })
    }

    revalidatePath(`/projects/${task.projectId}`)
    return { success: true, data: task }
  } catch (error) {
    console.error('Error updating task:', error)
    if (error instanceof Error && error.message.includes('Invalid')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to update task' }
  }
}

export async function moveTask(
  taskId: string,
  sourceStatus: string,
  destinationStatus: string,
  sourceIndex: number,
  destinationIndex: number
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const task = await taskRepository.findById(taskId)
    if (!task) {
      return { success: false, error: 'Task not found' }
    }

    // Check permissions
    const isOwner = task.project.ownerId === session.user.id
    const isAssignee = task.assigneeId === session.user.id
    const isCreator = task.creatorId === session.user.id

    if (!isOwner && !isAssignee && !isCreator) {
      return { success: false, error: 'Insufficient permissions' }
    }

    await taskRepository.reorderTasks(
      task.projectId,
      sourceStatus as any,
      destinationStatus as any,
      sourceIndex,
      destinationIndex
    )

    // Log activity if status changed
    if (sourceStatus !== destinationStatus) {
      await activityRepository.create({
        action: 'MOVED' as ActivityType,
        entityType: 'TASK' as EntityType,
        entityId: taskId,
        projectId: task.projectId,
        userId: session.user.id,
        metadata: {
          from: sourceStatus,
          to: destinationStatus,
          taskTitle: task.title
        }
      })
    }

    revalidatePath(`/projects/${task.projectId}`)
    return { success: true }
  } catch (error) {
    console.error('Error moving task:', error)
    return { success: false, error: 'Failed to move task' }
  }
}

export async function deleteTask(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const task = await taskRepository.findById(id)
    if (!task) {
      return { success: false, error: 'Task not found' }
    }

    // Check permissions (only owner or creator can delete)
    const isOwner = task.project.ownerId === session.user.id
    const isCreator = task.creatorId === session.user.id

    if (!isOwner && !isCreator) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Log activity before deletion
    await activityRepository.create({
      action: 'DELETED' as ActivityType,
      entityType: 'TASK' as EntityType,
      entityId: task.id,
      projectId: task.projectId,
      userId: session.user.id,
      metadata: {
        taskTitle: task.title,
        taskStatus: task.status
      }
    })

    await taskRepository.delete(id)

    revalidatePath(`/projects/${task.projectId}`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting task:', error)
    return { success: false, error: 'Failed to delete task' }
  }
}