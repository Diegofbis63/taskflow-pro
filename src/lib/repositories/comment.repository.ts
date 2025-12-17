import { db } from '@/lib/db'
import { Comment } from '@prisma/client'
import type { CommentWithRelations, CreateCommentInput, UpdateCommentInput } from '@/types'

// Mock data for when database is not available
const mockComments: CommentWithRelations[] = []

export class CommentRepository {
  async findById(id: string): Promise<CommentWithRelations | null> {
    if (!db) {
      return mockComments.find(comment => comment.id === id) || null
    }
    
    return await db.comment.findUnique({
      where: { id },
      include: {
        author: true,
        task: {
          include: {
            project: true
          }
        }
      }
    })
  }

  async findByTaskId(taskId: string): Promise<CommentWithRelations[]> {
    if (!db) {
      return mockComments.filter(comment => comment.taskId === taskId)
    }
    
    return await db.comment.findMany({
      where: { taskId },
      include: {
        author: true,
        task: {
          include: {
            project: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
  }

  async create(data: CreateCommentInput & { authorId: string }): Promise<CommentWithRelations> {
    if (!db) {
      const newComment: CommentWithRelations = {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: data.authorId,
          email: 'author@example.com',
          name: 'Comment Author',
          role: 'MEMBER',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        task: {
          id: data.taskId,
          title: 'Mock Task',
          description: 'Mock task description',
          status: 'TODO',
          priority: 'MEDIUM',
          projectId: '1',
          assigneeId: null,
          creatorId: data.authorId,
          position: 0,
          dueDate: null,
          tags: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          project: {
            id: '1',
            title: 'Mock Project',
            description: 'Mock project description',
            color: '#3B82F6',
            ownerId: '1',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        }
      }
      
      mockComments.push(newComment)
      return newComment
    }

    const comment = await db.comment.create({
      data,
      include: {
        author: true,
        task: {
          include: {
            project: true
          }
        }
      }
    })

    return comment
  }

  async update(id: string, data: UpdateCommentInput): Promise<CommentWithRelations> {
    if (!db) {
      const commentIndex = mockComments.findIndex(comment => comment.id === id)
      if (commentIndex === -1) {
        throw new Error('Comment not found')
      }
      
      mockComments[commentIndex] = { ...mockComments[commentIndex], ...data, updatedAt: new Date() }
      return mockComments[commentIndex]
    }

    return await db.comment.update({
      where: { id },
      data,
      include: {
        author: true,
        task: {
          include: {
            project: true
          }
        }
      }
    })
  }

  async delete(id: string): Promise<void> {
    if (!db) {
      const commentIndex = mockComments.findIndex(comment => comment.id === id)
      if (commentIndex !== -1) {
        mockComments.splice(commentIndex, 1)
      }
      return
    }

    await db.comment.delete({
      where: { id }
    })
  }

  async deleteByTaskId(taskId: string): Promise<void> {
    if (!db) {
      const initialLength = mockComments.length
      for (let i = mockComments.length - 1; i >= 0; i--) {
        if (mockComments[i].taskId === taskId) {
          mockComments.splice(i, 1)
        }
      }
      return
    }

    await db.comment.deleteMany({
      where: { taskId }
    })
  }
}

export const commentRepository = new CommentRepository()