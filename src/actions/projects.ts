import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { projectRepository } from '@/lib/repositories'
import { createProjectSchema, updateProjectSchema } from '@/lib/validation'
import type { CreateProjectInput, UpdateProjectInput } from '@/lib/validation'
import { ActivityType, EntityType } from '@prisma/client'
import { activityRepository } from '@/lib/repositories'

export async function getProject(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const project = await projectRepository.findById(id)
    if (!project) {
      return { success: false, error: 'Project not found' }
    }

    // Check if user has access to this project
    const hasAccess = project.ownerId === session.user.userId || 
                     project.members.some(member => member.userId === session.user.userId)

    if (!hasAccess) {
      return { success: false, error: 'Access denied' }
    }

    return { success: true, data: project }
  } catch (error) {
    console.error('Error fetching project:', error)
    return { success: false, error: 'Failed to fetch project' }
  }
}

export async function getUserProjects() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const projects = await projectRepository.findByUserId(session.user.userId)
    return { success: true, data: projects }
  } catch (error) {
    console.error('Error fetching user projects:', error)
    return { success: false, error: 'Failed to fetch projects' }
  }
}

export async function getProjects() {
  return await getUserProjects()
}

export async function createProject(data: CreateProjectInput & { userId: string }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate input
    const validatedData = createProjectSchema.parse(data)
    
    const project = await projectRepository.create({
      ...validatedData,
      ownerId: session.user.userId,
    })

    // Log activity
    await activityRepository.create({
      action: 'CREATED' as ActivityType,
      entityType: 'PROJECT' as EntityType,
      entityId: project.id,
      projectId: project.id,
      userId: session.user.userId,
      metadata: {
        projectTitle: project.title
      }
    })

    revalidatePath('/projects')
    revalidatePath('/dashboard')
    return { success: true, data: project }
  } catch (error) {
    console.error('Error creating project:', error)
    if (error instanceof Error && error.message.includes('Invalid')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to create project' }
  }
}

export async function updateProject(id: string, data: UpdateProjectInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate input
    const validatedData = updateProjectSchema.parse(data)
    
    const existingProject = await projectRepository.findById(id)
    if (!existingProject) {
      return { success: false, error: 'Project not found' }
    }

    // Check if user has permission to update this project
    const isOwner = existingProject.ownerId === session.user.userId
    const isAdmin = existingProject.members.some(
      member => member.userId === session.user.userId && member.role === 'ADMIN'
    )

    if (!isOwner && !isAdmin) {
      return { success: false, error: 'Insufficient permissions' }
    }

    const project = await projectRepository.update(id, validatedData)

    // Log activity for significant changes
    const changes = Object.keys(validatedData).filter(key => 
      existingProject[key as keyof typeof existingProject] !== validatedData[key as keyof typeof validatedData]
    )

    if (changes.length > 0) {
      await activityRepository.create({
        action: 'UPDATED' as ActivityType,
        entityType: 'PROJECT' as EntityType,
        entityId: project.id,
        projectId: project.id,
        userId: session.user.userId,
        metadata: {
          changes: validatedData,
          previousValues: existingProject
        }
      })
    }

    revalidatePath(`/projects/${id}`)
    revalidatePath('/projects')
    revalidatePath('/dashboard')
    return { success: true, data: project }
  } catch (error) {
    console.error('Error updating project:', error)
    if (error instanceof Error && error.message.includes('Invalid')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to update project' }
  }
}

export async function deleteProject(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const project = await projectRepository.findById(id)
    if (!project) {
      return { success: false, error: 'Project not found' }
    }

    // Only project owner can delete
    if (project.ownerId !== session.user.userId) {
      return { success: false, error: 'Only project owner can delete projects' }
    }

    // Log activity before deletion
    await activityRepository.create({
      action: 'DELETED' as ActivityType,
      entityType: 'PROJECT' as EntityType,
      entityId: project.id,
      projectId: project.id,
      userId: session.user.userId,
      metadata: {
        projectTitle: project.title
      }
    })

    await projectRepository.delete(id)

    revalidatePath('/projects')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error deleting project:', error)
    return { success: false, error: 'Failed to delete project' }
  }
}

export async function addProjectMember(
  projectId: string,
  userId: string,
  role = 'MEMBER'
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const project = await projectRepository.findById(projectId)
    if (!project) {
      return { success: false, error: 'Project not found' }
    }

    // Check permissions (owner or admin can add members)
    const isOwner = project.ownerId === session.user.userId
    const isAdmin = project.members.some(
      member => member.userId === session.user.userId && member.role === 'ADMIN'
    )

    if (!isOwner && !isAdmin) {
      return { success: false, error: 'Insufficient permissions' }
    }

    await projectRepository.addMember(projectId, userId, role as any)

    // Log activity
    await activityRepository.create({
      action: 'UPDATED' as ActivityType,
      entityType: 'PROJECT' as EntityType,
      entityId: projectId,
      projectId: projectId,
      userId: session.user.userId,
      metadata: {
        action: 'member_added',
        userId: userId,
        role: role
      }
    })

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    console.error('Error adding project member:', error)
    return { success: false, error: 'Failed to add member' }
  }
}

export async function removeProjectMember(projectId: string, userId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const project = await projectRepository.findById(projectId)
    if (!project) {
      return { success: false, error: 'Project not found' }
    }

    // Check permissions
    const isOwner = project.ownerId === session.user.userId
    const isAdmin = project.members.some(
      member => member.userId === session.user.userId && member.role === 'ADMIN'
    )
    const isSelf = userId === session.user.userId

    if (!isOwner && !isAdmin && !isSelf) {
      return { success: false, error: 'Insufficient permissions' }
    }

    await projectRepository.removeMember(projectId, userId)

    // Log activity
    await activityRepository.create({
      action: 'UPDATED' as ActivityType,
      entityType: 'PROJECT' as EntityType,
      entityId: projectId,
      projectId: projectId,
      userId: session.user.userId,
      metadata: {
        action: 'member_removed',
        userId: userId
      }
    })

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    console.error('Error removing project member:', error)
    return { success: false, error: 'Failed to remove member' }
  }
}