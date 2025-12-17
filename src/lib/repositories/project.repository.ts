import { db } from '@/lib/db'
import { Project, ProjectRole } from '@prisma/client'
import type { 
  ProjectWithRelations, 
  CreateProjectData, 
  UpdateProjectData,
  ApiResponse 
} from '@/types'

// Mock data for when database is not available
const mockProjects: ProjectWithRelations[] = [
  {
    id: '1',
    title: 'Website Redesign',
    description: 'Complete website overhaul with modern design',
    color: '#3B82F6',
    ownerId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    owner: {
      id: '1',
      email: 'demo@example.com',
      name: 'Demo User',
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    members: [
      {
        id: '1',
        projectId: '1',
        userId: '1',
        role: 'OWNER',
        joinedAt: new Date(),
        user: {
          id: '1',
          email: 'demo@example.com',
          name: 'Demo User',
          role: 'ADMIN',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      },
      {
        id: '2',
        projectId: '1',
        userId: '2',
        role: 'MEMBER',
        joinedAt: new Date(),
        user: {
          id: '2',
          email: 'john@example.com',
          name: 'John Doe',
          role: 'MEMBER',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
    ],
    tasks: [],
    _count: {
      members: 2,
      tasks: 0
    }
  },
  {
    id: '2',
    title: 'Mobile App Development',
    description: 'Create a mobile app for iOS and Android',
    color: '#10B981',
    ownerId: '2',
    createdAt: new Date(),
    updatedAt: new Date(),
    owner: {
      id: '2',
      email: 'john@example.com',
      name: 'John Doe',
      role: 'MEMBER',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    members: [
      {
        id: '3',
        projectId: '2',
        userId: '2',
        role: 'OWNER',
        joinedAt: new Date(),
        user: {
          id: '2',
          email: 'john@example.com',
          name: 'John Doe',
          role: 'MEMBER',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
    ],
    tasks: [],
    _count: {
      members: 1,
      tasks: 0
    }
  }
]

export class ProjectRepository {
  async findById(id: string): Promise<ProjectWithRelations | null> {
    if (!db) {
      return mockProjects.find(project => project.id === id) || null
    }
    
    return await db.project.findUnique({
      where: { id },
      include: {
        owner: true,
        members: {
          include: {
            user: true
          }
        },
        tasks: {
          include: {
            assignee: true,
            creator: true
          }
        },
        _count: {
          select: {
            members: true,
            tasks: true
          }
        }
      }
    })
  }

  async findByUserId(userId: string): Promise<ProjectWithRelations[]> {
    if (!db) {
      return mockProjects.filter(project => 
        project.ownerId === userId || 
        project.members.some(member => member.userId === userId)
      )
    }
    
    return await db.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId: userId
              }
            }
          }
        ]
      },
      include: {
        owner: true,
        members: {
          include: {
            user: true
          }
        },
        tasks: {
          include: {
            assignee: true,
            creator: true
          }
        },
        _count: {
          select: {
            members: true,
            tasks: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
  }

  async create(data: CreateProjectData & { ownerId: string, initialTasks?: InitialTask[] }): Promise<ProjectWithRelations> {
    if (!db) {
      const newProject: ProjectWithRelations = {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: {
          id: data.ownerId,
          email: 'owner@example.com',
          name: 'Project Owner',
          role: 'MEMBER',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        members: [
          {
            id: Date.now().toString(),
            projectId: Date.now().toString(),
            userId: data.ownerId,
            role: 'OWNER',
            joinedAt: new Date(),
            user: {
              id: data.ownerId,
              email: 'owner@example.com',
              name: 'Project Owner',
              role: 'MEMBER',
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          }
        ],
        tasks: [],
        _count: {
          members: 1,
          tasks: 0
        }
      }
      
      mockProjects.push(newProject)
      return newProject
    }

    const project = await db.project.create({
      data,
      include: {
        owner: true,
        members: {
          include: {
            user: true
          }
        },
        tasks: {
          include: {
            assignee: true,
            creator: true
          }
        },
        _count: {
          select: {
            members: true,
            tasks: true
          }
        }
      }
    })

    return project
  }

  async update(id: string, data: UpdateProjectData): Promise<ProjectWithRelations> {
    if (!db) {
      const projectIndex = mockProjects.findIndex(project => project.id === id)
      if (projectIndex === -1) {
        throw new Error('Project not found')
      }
      
      mockProjects[projectIndex] = { ...mockProjects[projectIndex], ...data, updatedAt: new Date() }
      return mockProjects[projectIndex]
    }

    return await db.project.update({
      where: { id },
      data,
      include: {
        owner: true,
        members: {
          include: {
            user: true
          }
        },
        tasks: {
          include: {
            assignee: true,
            creator: true
          }
        },
        _count: {
          select: {
            members: true,
            tasks: true
          }
        }
      }
    })
  }

  async delete(id: string): Promise<void> {
    if (!db) {
      const projectIndex = mockProjects.findIndex(project => project.id === id)
      if (projectIndex !== -1) {
        mockProjects.splice(projectIndex, 1)
      }
      return
    }

    await db.project.delete({
      where: { id }
    })
  }

  async addMember(
    projectId: string, 
    userId: string, 
    role: ProjectRole = ProjectRole.MEMBER
  ): Promise<void> {
    if (!db) {
      const project = mockProjects.find(p => p.id === projectId)
      if (project) {
        const newMember = {
          id: Date.now().toString(),
          projectId,
          userId,
          role,
          joinedAt: new Date(),
          user: {
            id: userId,
            email: 'member@example.com',
            name: 'New Member',
            role: 'MEMBER',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        }
        project.members.push(newMember)
        project._count.members++
      }
      return
    }

    await db.projectMember.create({
      data: {
        projectId,
        userId,
        role
      }
    })
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    if (!db) {
      const project = mockProjects.find(p => p.id === projectId)
      if (project) {
        const memberIndex = project.members.findIndex(m => m.userId === userId)
        if (memberIndex !== -1) {
          project.members.splice(memberIndex, 1)
          project._count.members--
        }
      }
      return
    }

    await db.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId
        }
      }
    })
  }

  async updateMemberRole(
    projectId: string, 
    userId: string, 
    role: ProjectRole
  ): Promise<void> {
    if (!db) {
      const project = mockProjects.find(p => p.id === projectId)
      if (project) {
        const member = project.members.find(m => m.userId === userId)
        if (member) {
          member.role = role
        }
      }
      return
    }

    await db.projectMember.update({
      where: {
        projectId_userId: {
          projectId,
          userId
        }
      },
      data: { role }
    })
  }

  async isMember(projectId: string, userId: string): Promise<boolean> {
    if (!db) {
      const project = mockProjects.find(p => p.id === projectId)
      return project ? project.members.some(m => m.userId === userId) : false
    }

    const member = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId
        }
      }
    })
    return !!member
  }

  async getMemberRole(projectId: string, userId: string): Promise<ProjectRole | null> {
    if (!db) {
      const project = mockProjects.find(p => p.id === projectId)
      if (project) {
        const member = project.members.find(m => m.userId === userId)
        return member ? member.role : null
      }
      return null
    }

    const member = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId
        }
      }
    })
    return member?.role || null
  }

  async getMembers(projectId: string) {
    if (!db) {
      const project = mockProjects.find(p => p.id === projectId)
      return project ? project.members : []
    }

    return await db.projectMember.findMany({
      where: { projectId },
      include: {
        user: true
      }
    })
  }
}

export const projectRepository = new ProjectRepository()