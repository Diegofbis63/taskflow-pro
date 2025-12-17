'use client'

import { useState, useEffect } from 'react'
import { getCommentsByTask, createComment, updateComment, deleteComment } from '@/actions'
import type { CommentWithRelations } from '@/types'

export function useComments(taskId: string) {
  const [comments, setComments] = useState<CommentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchComments = async () => {
    if (!taskId) return

    try {
      setLoading(true)
      const result = await getCommentsByTask(taskId)
      if (result.success) {
        setComments(result.data || [])
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch comments')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [taskId])

  const createNewComment = async (data: any) => {
    try {
      const result = await createComment(data)
      if (result.success) {
        await fetchComments() // Refresh comments
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      return { success: false, error: 'Failed to create comment' }
    }
  }

  const updateExistingComment = async (id: string, data: any) => {
    try {
      const result = await updateComment(id, data)
      if (result.success) {
        await fetchComments() // Refresh comments
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      return { success: false, error: 'Failed to update comment' }
    }
  }

  const deleteExistingComment = async (id: string) => {
    try {
      const result = await deleteComment(id)
      if (result.success) {
        await fetchComments() // Refresh comments
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      return { success: false, error: 'Failed to delete comment' }
    }
  }

  return {
    comments,
    loading,
    error,
    refetch: fetchComments,
    createComment: createNewComment,
    updateComment: updateExistingComment,
    deleteComment: deleteExistingComment,
  }
}