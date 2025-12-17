import { db } from '@/lib/db';
import { validateRequest, inviteTeamMemberSchema, teamMemberSchema } from '@/lib/validation';

export interface Team {
  id: string;
  name: string;
  description?: string;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'member' | 'lead' | 'admin';
  permissions: string[];
  joinedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  role: 'member' | 'lead' | 'admin';
  invitedBy: string;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

export interface ActivityLog {
  id: string;
  userId: string;
  teamId?: string;
  projectId?: string;
  taskId?: string;
  action: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

class TeamManagementService {
  /**
   * Create a new team
   */
  async createTeam(data: { name: string; description?: string; department?: string; createdBy: string }): Promise<Team> {
    const team = await db.team.create({
      data: {
        name: data.name,
        description: data.description,
        department: data.department,
        createdById: data.createdBy
      }
    });

    // Add creator as admin
    await this.addTeamMember({
      teamId: team.id,
      userId: data.createdBy,
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'admin']
    });

    // Log activity
    await this.logActivity({
      userId: data.createdBy,
      teamId: team.id,
      action: 'TEAM_CREATED',
      details: { teamName: data.name }
    });

    return team;
  }

  /**
   * Get team by ID with members
   */
  async getTeam(teamId: string): Promise<Team & { members: TeamMember[] }> {
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!team) {
      throw new Error('Team not found');
    }

    return team;
  }

  /**
   * Get all teams for a user
   */
  async getUserTeams(userId: string): Promise<Team[]> {
    const memberships = await db.teamMember.findMany({
      where: { userId },
      include: {
        team: true
      }
    });

    return memberships.map(membership => membership.team);
  }

  /**
   * Add member to team
   */
  async addTeamMember(data: { teamId: string; userId: string; role: 'member' | 'lead' | 'admin'; permissions?: string[] }): Promise<TeamMember> {
    const defaultPermissions = this.getDefaultPermissions(data.role);
    
    const member = await db.teamMember.create({
      data: {
        teamId: data.teamId,
        userId: data.userId,
        role: data.role,
        permissions: data.permissions || defaultPermissions
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log activity
    await this.logActivity({
      userId: data.userId,
      teamId: data.teamId,
      action: 'MEMBER_ADDED',
      details: { role: data.role, permissions: member.permissions }
    });

    return member;
  }

  /**
   * Remove member from team
   */
  async removeTeamMember(teamId: string, userId: string, removedBy: string): Promise<void> {
    await db.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId
        }
      }
    });

    // Log activity
    await this.logActivity({
      userId: removedBy,
      teamId,
      action: 'MEMBER_REMOVED',
      details: { removedUserId: userId }
    });
  }

  /**
   * Update member role and permissions
   */
  async updateTeamMember(teamId: string, userId: string, role: 'member' | 'lead' | 'admin', permissions?: string[]): Promise<TeamMember> {
    const defaultPermissions = this.getDefaultPermissions(role);
    
    const member = await db.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId
        }
      },
      data: {
        role,
        permissions: permissions || defaultPermissions
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log activity
    await this.logActivity({
      userId,
      teamId,
      action: 'MEMBER_UPDATED',
      details: { role, permissions: member.permissions }
    });

    return member;
  }

  /**
   * Invite user to team
   */
  async inviteToTeam(data: { teamId: string; email: string; role: 'member' | 'lead' | 'admin'; invitedBy: string; message?: string }): Promise<TeamInvitation> {
    // Validate input
    const validatedData = validateRequest(inviteTeamMemberSchema, data);
    if (!validatedData.success) {
      throw new Error(validatedData.error);
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      // Check if already a member
      const existingMember = await db.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: data.teamId,
            userId: existingUser.id
          }
        }
      });

      if (existingMember) {
        throw new Error('User is already a team member');
      }

      // Add directly as member
      return await this.addTeamMember({
        teamId: data.teamId,
        userId: existingUser.id,
        role: data.role
      });
    }

    // Create invitation
    const token = this.generateInvitationToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await db.teamInvitation.create({
      data: {
        teamId: data.teamId,
        email: data.email,
        role: data.role,
        invitedBy: data.invitedBy,
        token,
        expiresAt
      }
    });

    // Send invitation email (implement email service)
    await this.sendInvitationEmail(invitation, data.message);

    // Log activity
    await this.logActivity({
      userId: data.invitedBy,
      teamId: data.teamId,
      action: 'INVITATION_SENT',
      details: { email: data.email, role: data.role }
    });

    return invitation;
  }

  /**
   * Accept team invitation
   */
  async acceptInvitation(token: string, userId: string): Promise<TeamMember> {
    const invitation = await db.teamInvitation.findUnique({
      where: { token },
      include: {
        team: true
      }
    });

    if (!invitation) {
      throw new Error('Invalid invitation token');
    }

    if (invitation.expiresAt < new Date()) {
      throw new Error('Invitation has expired');
    }

    if (invitation.acceptedAt) {
      throw new Error('Invitation has already been accepted');
    }

    // Mark invitation as accepted
    await db.teamInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() }
    });

    // Add user to team
    const member = await this.addTeamMember({
      teamId: invitation.teamId,
      userId,
      role: invitation.role
    });

    // Log activity
    await this.logActivity({
      userId,
      teamId: invitation.teamId,
      action: 'INVITATION_ACCEPTED',
      details: { invitationId: invitation.id }
    });

    return member;
  }

  /**
   * Get pending invitations for a team
   */
  async getTeamInvitations(teamId: string): Promise<TeamInvitation[]> {
    return await db.teamInvitation.findMany({
      where: {
        teamId,
        acceptedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: {
        invitedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Cancel invitation
   */
  async cancelInvitation(invitationId: string, cancelledBy: string): Promise<void> {
    const invitation = await db.teamInvitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    await db.teamInvitation.delete({
      where: { id: invitationId }
    });

    // Log activity
    await this.logActivity({
      userId: cancelledBy,
      teamId: invitation.teamId,
      action: 'INVITATION_CANCELLED',
      details: { invitationId, email: invitation.email }
    });
  }

  /**
   * Get activity logs for a team
   */
  async getTeamActivityLogs(teamId: string, limit: number = 50): Promise<ActivityLog[]> {
    return await db.activityLog.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Log activity
   */
  async logActivity(data: {
    userId: string;
    teamId?: string;
    projectId?: string;
    taskId?: string;
    action: string;
    details: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ActivityLog> {
    return await db.activityLog.create({
      data: {
        userId: data.userId,
        teamId: data.teamId,
        projectId: data.projectId,
        taskId: data.taskId,
        action: data.action,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      }
    });
  }

  /**
   * Check user permissions for team
   */
  async checkTeamPermission(userId: string, teamId: string, permission: string): Promise<boolean> {
    const member = await db.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId
        }
      }
    });

    if (!member) {
      return false;
    }

    return member.permissions.includes(permission) || member.permissions.includes('admin');
  }

  /**
   * Get user's role in team
   */
  async getUserTeamRole(userId: string, teamId: string): Promise<string | null> {
    const member = await db.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId
        }
      },
      select: { role: true }
    });

    return member?.role || null;
  }

  /**
   * Helper methods
   */
  private getDefaultPermissions(role: 'member' | 'lead' | 'admin'): string[] {
    switch (role) {
      case 'member':
        return ['read'];
      case 'lead':
        return ['read', 'write'];
      case 'admin':
        return ['read', 'write', 'delete', 'admin'];
      default:
        return ['read'];
    }
  }

  private generateInvitationToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  private async sendInvitationEmail(invitation: TeamInvitation, message?: string): Promise<void> {
    // Implement email sending logic here
    // This would typically use a service like SendGrid, AWS SES, or Nodemailer
    console.log(`Invitation email sent to ${invitation.email} with token ${invitation.token}`);
    
    // For now, just log the invitation
    console.log('Invitation details:', {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
      message
    });
  }
}

export const teamManagementService = new TeamManagementService();

// Export types for use in other files
export type { Team, TeamMember, TeamInvitation, ActivityLog };