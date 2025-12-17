import { db } from '@/lib/db';

export interface AnalyticsMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalUsers: number;
  activeUsers: number;
  totalTeams: number;
  averageTaskCompletion: number;
  averageProjectDuration: number;
  productivityScore: number;
}

export interface ProjectAnalytics {
  projectId: string;
  projectName: string;
  status: string;
  progress: number;
  taskCount: number;
  completedTasks: number;
  teamSize: number;
  budgetUsed?: number;
  budgetTotal?: number;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
}

export interface TeamAnalytics {
  teamId: string;
  teamName: string;
  memberCount: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  averageProductivity: number;
  collaborationScore: number;
}

export interface UserAnalytics {
  userId: string;
  userName: string;
  email: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  averageCompletionTime: number;
  productivityScore: number;
  lastActiveDate: Date;
}

export interface TimeAnalytics {
  period: string;
  projectsCompleted: number;
  tasksCompleted: number;
  hoursWorked: number;
  productivityScore: number;
  teamCollaboration: number;
}

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  teamIds?: string[];
  projectIds?: string[];
  userIds?: string[];
  status?: string[];
  priority?: string[];
}

export interface AnalyticsDashboard {
  overview: AnalyticsMetrics;
  projects: ProjectAnalytics[];
  teams: TeamAnalytics[];
  users: UserAnalytics[];
  timeSeries: TimeAnalytics[];
  trends: {
    projectCompletion: number[];
    taskCompletion: number[];
    productivity: number[];
  };
}

class AnalyticsService {
  /**
   * Get comprehensive analytics dashboard
   */
  async getDashboard(filters?: AnalyticsFilters): Promise<AnalyticsDashboard> {
    const [overview, projects, teams, users, timeSeries] = await Promise.all([
      this.getOverviewMetrics(filters),
      this.getProjectAnalytics(filters),
      this.getTeamAnalytics(filters),
      this.getUserAnalytics(filters),
      this.getTimeSeriesAnalytics(filters)
    ]);

    const trends = await this.getTrends(filters);

    return {
      overview,
      projects,
      teams,
      users,
      timeSeries,
      trends
    };
  }

  /**
   * Get overview metrics
   */
  async getOverviewMetrics(filters?: AnalyticsFilters): Promise<AnalyticsMetrics> {
    const whereClause = this.buildWhereClause(filters);

    const [
      projectStats,
      taskStats,
      userStats,
      teamStats
    ] = await Promise.all([
      // Project statistics
      db.project.aggregate({
        where: whereClause.projects || {},
        _count: { id: true },
        where: {
          ...whereClause.projects,
          status: 'active'
        },
        _count: { id: true }
      }),
      // Task statistics
      db.task.aggregate({
        where: whereClause.tasks || {},
        _count: { id: true },
        where: {
          ...whereClause.tasks,
          status: 'completed'
        },
        _count: { id: true }
      }),
      // User statistics
      db.user.aggregate({
        _count: { id: true },
        where: {
          lastActiveAt: {
            gte: filters?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _count: { id: true }
      }),
      // Team statistics
      db.team.count()
    ]);

    const totalProjects = await db.project.count();
    const completedProjects = await db.project.count({
      where: { status: 'completed' }
    });
    const totalTasks = await db.task.count();
    const completedTasks = await db.task.count({
      where: { status: 'completed' }
    });
    const totalUsers = await db.user.count();

    return {
      totalProjects,
      activeProjects: projectStats._count.id,
      completedProjects,
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      totalUsers,
      activeUsers: userStats._count.id,
      totalTeams: teamStats,
      averageTaskCompletion: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      averageProjectDuration: await this.calculateAverageProjectDuration(),
      productivityScore: await this.calculateProductivityScore()
    };
  }

  /**
   * Get project-specific analytics
   */
  async getProjectAnalytics(filters?: AnalyticsFilters): Promise<ProjectAnalytics[]> {
    const whereClause = this.buildWhereClause(filters);

    const projects = await db.project.findMany({
      where: whereClause.projects || {},
      include: {
        tasks: {
          select: {
            status: true,
            assignedToId: true
          }
        },
        team: {
          select: {
            members: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    });

    return projects.map(project => ({
      projectId: project.id,
      projectName: project.name,
      status: project.status,
      progress: this.calculateProjectProgress(project),
      taskCount: project.tasks.length,
      completedTasks: project.tasks.filter(task => task.status === 'completed').length,
      teamSize: project.team?.members.length || 0,
      budgetUsed: project.budgetUsed || undefined,
      budgetTotal: project.budget || undefined,
      startDate: project.startDate || project.createdAt,
      endDate: project.endDate || undefined,
      createdAt: project.createdAt
    }));
  }

  /**
   * Get team-specific analytics
   */
  async getTeamAnalytics(filters?: AnalyticsFilters): Promise<TeamAnalytics[]> {
    const whereClause = this.buildWhereClause(filters);

    const teams = await db.team.findMany({
      where: whereClause.teams || {},
      include: {
        members: {
          include: {
            user: true
          }
        },
        projects: {
          include: {
            tasks: true
          }
        }
      }
    });

    return teams.map(team => ({
      teamId: team.id,
      teamName: team.name,
      memberCount: team.members.length,
      activeProjects: team.projects.filter(p => p.status === 'active').length,
      completedProjects: team.projects.filter(p => p.status === 'completed').length,
      totalTasks: team.projects.reduce((sum, p) => sum + p.tasks.length, 0),
      completedTasks: team.projects.reduce((sum, p) => 
        sum + p.tasks.filter(t => t.status === 'completed').length, 0),
      averageProductivity: this.calculateTeamProductivity(team),
      collaborationScore: this.calculateCollaborationScore(team)
    }));
  }

  /**
   * Get user-specific analytics
   */
  async getUserAnalytics(filters?: AnalyticsFilters): Promise<UserAnalytics[]> {
    const whereClause = this.buildWhereClause(filters);

    const users = await db.user.findMany({
      where: whereClause.users || {},
      include: {
        assignedTasks: {
          include: {
            project: true
          }
        }
      }
    });

    return users.map(user => ({
      userId: user.id,
      userName: user.name,
      email: user.email,
      totalTasks: user.assignedTasks.length,
      completedTasks: user.assignedTasks.filter(t => t.status === 'completed').length,
      pendingTasks: user.assignedTasks.filter(t => t.status === 'todo').length,
      overdueTasks: user.assignedTasks.filter(t => 
        t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date()
      ).length,
      averageCompletionTime: this.calculateAverageCompletionTime(user),
      productivityScore: this.calculateUserProductivity(user),
      lastActiveDate: user.lastActiveAt || user.createdAt
    }));
  }

  /**
   * Get time series analytics
   */
  async getTimeSeriesAnalytics(filters?: AnalyticsFilters): Promise<TimeAnalytics[]> {
    const startDate = filters?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = filters?.endDate || new Date();
    
    const periods = this.generateTimePeriods(startDate, endDate, 'week');
    
    const timeSeries = await Promise.all(periods.map(async (period) => {
      const periodStart = new Date(period.start);
      const periodEnd = new Date(period.end);
      
      const [projectsCompleted, tasksCompleted] = await Promise.all([
        db.project.count({
          where: {
            status: 'completed',
            updatedAt: {
              gte: periodStart,
              lte: periodEnd
            }
          }
        }),
        db.task.count({
          where: {
            status: 'completed',
            updatedAt: {
              gte: periodStart,
              lte: periodEnd
            }
          }
        })
      ]);

      return {
        period: period.label,
        projectsCompleted,
        tasksCompleted,
        hoursWorked: await this.calculateHoursWorked(periodStart, periodEnd),
        productivityScore: await this.calculatePeriodProductivity(periodStart, periodEnd),
        teamCollaboration: await this.calculatePeriodCollaboration(periodStart, periodEnd)
      };
    }));

    return timeSeries;
  }

  /**
   * Get trend analytics
   */
  async getTrends(filters?: AnalyticsFilters): Promise<{
    projectCompletion: number[];
    taskCompletion: number[];
    productivity: number[];
  }> {
    const timeSeries = await this.getTimeSeriesAnalytics(filters);
    
    return {
      projectCompletion: timeSeries.map(t => t.projectsCompleted),
      taskCompletion: timeSeries.map(t => t.tasksCompleted),
      productivity: timeSeries.map(t => t.productivityScore)
    };
  }

  /**
   * Helper methods
   */
  private buildWhereClause(filters?: AnalyticsFilters) {
    if (!filters) return {};

    return {
      projects: {
        ...(filters.teamIds && { teamId: { in: filters.teamIds } }),
        ...(filters.projectIds && { id: { in: filters.projectIds } }),
        ...(filters.status && { status: { in: filters.status } }),
        ...(filters.startDate && { createdAt: { gte: filters.startDate } }),
        ...(filters.endDate && { createdAt: { lte: filters.endDate } })
      },
      tasks: {
        ...(filters.projectIds && { projectId: { in: filters.projectIds } }),
        ...(filters.userIds && { assignedToId: { in: filters.userIds } }),
        ...(filters.status && { status: { in: filters.status } }),
        ...(filters.priority && { priority: { in: filters.priority } }),
        ...(filters.startDate && { createdAt: { gte: filters.startDate } }),
        ...(filters.endDate && { createdAt: { lte: filters.endDate } })
      },
      users: {
        ...(filters.userIds && { id: { in: filters.userIds } })
      },
      teams: {
        ...(filters.teamIds && { id: { in: filters.teamIds } })
      }
    };
  }

  private calculateProjectProgress(project: any): number {
    if (!project.tasks.length) return 0;
    const completedTasks = project.tasks.filter((task: any) => task.status === 'completed').length;
    return (completedTasks / project.tasks.length) * 100;
  }

  private async calculateAverageProjectDuration(): Promise<number> {
    const completedProjects = await db.project.findMany({
      where: { status: 'completed' },
      select: { createdAt: true, updatedAt: true }
    });

    if (completedProjects.length === 0) return 0;

    const totalDuration = completedProjects.reduce((sum, project) => {
      const duration = project.updatedAt.getTime() - project.createdAt.getTime();
      return sum + duration;
    }, 0);

    return totalDuration / completedProjects.length / (1000 * 60 * 60 * 24); // Convert to days
  }

  private async calculateProductivityScore(): Promise<number> {
    const [totalTasks, completedTasks, activeUsers] = await Promise.all([
      db.task.count(),
      db.task.count({ where: { status: 'completed' } }),
      db.user.count({
        where: {
          lastActiveAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    if (totalTasks === 0 || activeUsers === 0) return 0;
    return (completedTasks / totalTasks) * 100 * (activeUsers / 10); // Normalize by 10 users
  }

  private calculateTeamProductivity(team: any): number {
    const totalTasks = team.projects.reduce((sum: number, p: any) => sum + p.tasks.length, 0);
    const completedTasks = team.projects.reduce((sum: number, p: any) => 
      sum + p.tasks.filter((t: any) => t.status === 'completed').length, 0);
    
    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  }

  private calculateCollaborationScore(team: any): number {
    // Simple collaboration score based on team size and project diversity
    const projectDiversity = Math.min(team.projects.length / team.members.length, 1);
    const teamSizeFactor = Math.min(team.members.length / 5, 1); // Normalize to 5 members
    return (projectDiversity + teamSizeFactor) * 50;
  }

  private calculateAverageCompletionTime(user: any): number {
    const completedTasks = user.assignedTasks.filter((task: any) => task.status === 'completed');
    
    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((sum: number, task: any) => {
      const completionTime = task.updatedAt.getTime() - task.createdAt.getTime();
      return sum + completionTime;
    }, 0);

    return totalTime / completedTasks.length / (1000 * 60 * 60); // Convert to hours
  }

  private calculateUserProductivity(user: any): number {
    const totalTasks = user.assignedTasks.length;
    const completedTasks = user.assignedTasks.filter((task: any) => task.status === 'completed').length;
    
    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  }

  private generateTimePeriods(startDate: Date, endDate: Date, granularity: 'day' | 'week' | 'month'): Array<{start: string, end: string, label: string}> {
    const periods = [];
    const current = new Date(startDate);

    while (current < endDate) {
      const periodStart = new Date(current);
      let periodEnd: Date;

      switch (granularity) {
        case 'day':
          periodEnd = new Date(current.getTime() + 24 * 60 * 60 * 1000);
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          periodEnd = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          periodEnd = new Date(current.getTime() + 30 * 24 * 60 * 60 * 1000);
          current.setDate(current.getDate() + 30);
          break;
        default:
          periodEnd = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
          current.setDate(current.getDate() + 7);
      }

      periods.push({
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
        label: periodStart.toLocaleDateString()
      });
    }

    return periods;
  }

  private async calculateHoursWorked(startDate: Date, endDate: Date): Promise<number> {
    // This would typically integrate with time tracking system
    // For now, return an estimated value based on completed tasks
    const completedTasks = await db.task.count({
      where: {
        status: 'completed',
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    return completedTasks * 4; // Assume 4 hours per task on average
  }

  private async calculatePeriodProductivity(startDate: Date, endDate: Date): Promise<number> {
    const [totalTasks, completedTasks] = await Promise.all([
      db.task.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      db.task.count({
        where: {
          status: 'completed',
          updatedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      })
    ]);

    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  }

  private async calculatePeriodCollaboration(startDate: Date, endDate: Date): Promise<number> {
    // Calculate collaboration based on multi-user task participation
    const collaborativeTasks = await db.task.count({
      where: {
        updatedAt: {
          gte: startDate,
          lte: endDate
        },
        comments: {
          some: {}
        }
      }
    });

    const totalTasks = await db.task.count({
      where: {
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    return totalTasks > 0 ? (collaborativeTasks / totalTasks) * 100 : 0;
  }
}

export const analyticsService = new AnalyticsService();