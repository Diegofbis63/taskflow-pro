'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { commentRepository } from '@/lib/repositories'
import { createCommentSchema, updateCommentSchema } from '@/validations'
import type { CreateCommentInput, UpdateCommentInput } from '@/validations'
import { ActivityType, EntityType } from '@prisma/client'
import { activityRepository } from '@/lib/repositories'

export async function getCommentsByTask(taskId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const comments = await commentRepository.findByTaskId(taskId)
    return { success: true, data: comments }
  } catch (error) {
    console.error('Error fetching comments:', error)
    return { success: false, error: 'Failed to fetch comments' }
  }
}

export async function createComment(data: CreateCommentInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const validatedData = createCommentSchema.parse(data)
    
    const comment = await commentRepository.create({
      ...validatedData,
      authorId: session.user.id,
    })

    // Log activity
    await activityRepository.create({
      action: 'COMMENTED' as ActivityType,
      entityType: 'TASK' as EntityType,
      entityId: comment.taskId,
      projectId: comment.task.projectId,
      userId: session.user.id,
      metadata: {
        commentId: comment.id,
        taskTitle: comment.task.title
      }
    })

    revalidatePath(`/projects/${comment.task.projectId}`)
    return { success: true, data: comment }
  } catch (error) {
    console.error('Error creating comment:', error)
    if (error instanceof Error && error.message.includes('Invalid')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to create comment' }
  }
}

export async function updateComment(id: string, data: UpdateCommentInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const validatedData = updateCommentSchema.parse(data)
    
    const existingComment = await commentRepository.findById(id)
    if (!existingComment) {
      return { success: false, error: 'Comment not found' }
    }

    // Only comment author can update
    if (existingComment.authorId !== session.user.id) {
      return { success: false, error: 'Insufficient permissions' }
    }

    const comment = await commentRepository.update(id, validatedData)

    revalidatePath(`/projects/${comment.task.projectId}`)
    return { success: true, data: comment }
  } catch (error) {
    console.error('Error updating comment:', error)
    if (error instanceof Error && error.message.includes('Invalid')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to update comment' }
  }
}

export async function deleteComment(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const comment = await commentRepository.findById(id)
    if (!comment) {
      return { success: false, error: 'Comment not found' }
    }

    // Check permissions (comment author, project owner, or task assignee can delete)
    const isAuthor = comment.authorId === session.user.id
    const isProjectOwner = comment.task.project.ownerId === session.user.id
    const isTaskAssignee = comment.task.assigneeId === session.user.id

    if (!isAuthor && !isProjectOwner && !isTaskAssignee) {
      return { success: false, error: 'Insufficient permissions' }
    }

    await commentRepository.delete(id)

    revalidatePath(`/projects/${comment.task.projectId}`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting comment:', error)
    return { success: false, error: 'Failed to delete comment' }
  }
}