import { db } from '@/lib/db';
import { validateRequest, exportRequestSchema } from '@/lib/validation';

export interface ExportRequest {
  id: string;
  type: 'projects' | 'tasks' | 'teams' | 'analytics' | 'reports';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  filters?: any;
  template?: string;
  includeCharts: boolean;
  includeDetails: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
  requestedBy: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ScheduledExport {
  id: string;
  name: string;
  type: 'projects' | 'tasks' | 'teams' | 'analytics' | 'reports';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  filters?: any;
  schedule: string; // Cron expression
  recipients: string[];
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

class ExportService {
  /**
   * Generate export request
   */
  async generateExport(data: {
    type: 'projects' | 'tasks' | 'teams' | 'analytics' | 'reports';
    format: 'pdf' | 'excel' | 'csv' | 'json';
    filters?: any;
    template?: string;
    includeCharts?: boolean;
    includeDetails?: boolean;
    requestedBy: string;
  }): Promise<ExportRequest> {
    // Validate input
    const validatedData = validateRequest(exportRequestSchema, data);
    if (!validatedData.success) {
      throw new Error(validatedData.error);
    }

    // Create export request
    const exportRequest = await db.exportRequest.create({
      data: {
        type: data.type,
        format: data.format,
        filters: data.filters,
        template: data.template,
        includeCharts: data.includeCharts ?? true,
        includeDetails: data.includeDetails ?? true,
        status: 'pending',
        requestedBy: data.requestedBy
      }
    });

    // Process export asynchronously
    this.processExport(exportRequest.id).catch(console.error);

    return exportRequest;
  }

  /**
   * Get export request by ID
   */
  async getExport(exportId: string): Promise<ExportRequest | null> {
    return await db.exportRequest.findUnique({
      where: { id: exportId }
    });
  }

  /**
   * Get user's export requests
   */
  async getUserExports(userId: string, limit: number = 20): Promise<ExportRequest[]> {
    return await db.exportRequest.findMany({
      where: { requestedBy: userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Process export request
   */
  private async processExport(exportId: string): Promise<void> {
    try {
      // Update status to processing
      await db.exportRequest.update({
        where: { id: exportId },
        data: { status: 'processing' }
      });

      const exportRequest = await this.getExport(exportId);
      if (!exportRequest) {
        throw new Error('Export request not found');
      }

      // Generate export based on type and format
      const exportData = await this.generateExportData(exportRequest);
      
      // Create file based on format
      const fileUrl = await this.createExportFile(exportRequest, exportData);
      
      // Calculate expiry date (7 days from now)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Update export request with results
      await db.exportRequest.update({
        where: { id: exportId },
        data: {
          status: 'completed',
          downloadUrl: fileUrl,
          expiresAt,
          completedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Export processing failed:', error);
      
      // Update status to failed
      await db.exportRequest.update({
        where: { id: exportId },
        data: { 
          status: 'failed',
          completedAt: new Date()
        }
      });
    }
  }

  /**
   * Generate export data based on type
   */
  private async generateExportData(exportRequest: ExportRequest): Promise<any> {
    const { type, filters } = exportRequest;

    switch (type) {
      case 'projects':
        return await this.exportProjects(filters);
      case 'tasks':
        return await this.exportTasks(filters);
      case 'teams':
        return await this.exportTeams(filters);
      case 'analytics':
        return await this.exportAnalytics(filters);
      case 'reports':
        return await this.exportReports(filters);
      default:
        throw new Error(`Unsupported export type: ${type}`);
    }
  }

  /**
   * Export projects data
   */
  private async exportProjects(filters?: any): Promise<any[]> {
    const whereClause = this.buildWhereClause(filters);
    
    const projects = await db.project.findMany({
      where: whereClause,
      include: {
        team: {
          select: {
            name: true,
            department: true
          }
        },
        tasks: {
          select: {
            status: true,
            priority: true,
            assignedToId: true
          }
        },
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget,
      team: project.team?.name || 'No Team',
      department: project.team?.department || 'N/A',
      taskCount: project.tasks.length,
      completedTasks: project.tasks.filter(t => t.status === 'completed').length,
      createdBy: project.createdBy.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }));
  }

  /**
   * Export tasks data
   */
  private async exportTasks(filters?: any): Promise<any[]> {
    const whereClause = this.buildWhereClause(filters);
    
    const tasks = await db.task.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            name: true,
            status: true
          }
        },
        assignedTo: {
          select: {
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      project: task.project.name,
      projectStatus: task.project.status,
      assignedTo: task.assignedTo?.name || 'Unassigned',
      createdBy: task.createdBy.name,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      tags: task.tags?.join(', ') || '',
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }));
  }

  /**
   * Export teams data
   */
  private async exportTeams(filters?: any): Promise<any[]> {
    const whereClause = this.buildWhereClause(filters);
    
    const teams = await db.team.findMany({
      where: whereClause,
      include: {
        members: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });

    return teams.map(team => ({
      id: team.id,
      name: team.name,
      description: team.description,
      department: team.department,
      memberCount: team.members.length,
      members: team.members.map(m => `${m.user.name} (${m.role})`).join(', '),
      projectCount: team.projects.length,
      activeProjects: team.projects.filter(p => p.status === 'active').length,
      completedProjects: team.projects.filter(p => p.status === 'completed').length,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt
    }));
  }

  /**
   * Export analytics data
   */
  private async exportAnalytics(filters?: any): Promise<any> {
    const { analyticsService } = await import('./analytics');
    const dashboard = await analyticsService.getDashboard(filters);

    return {
      overview: dashboard.overview,
      projectAnalytics: dashboard.projects,
      teamAnalytics: dashboard.teams,
      userAnalytics: dashboard.users,
      timeSeries: dashboard.timeSeries,
      trends: dashboard.trends,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Export custom reports
   */
  private async exportReports(filters?: any): Promise<any> {
    // Custom report logic based on filters
    const { startDate, endDate, reportType } = filters || {};
    
    return {
      reportType,
      period: { startDate, endDate },
      data: await this.generateCustomReport(reportType, startDate, endDate),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Create export file based on format
   */
  private async createExportFile(exportRequest: ExportRequest, data: any): Promise<string> {
    const { format, type } = exportRequest;
    const filename = `${type}_export_${Date.now()}`;
    
    switch (format) {
      case 'json':
        return await this.createJsonFile(filename, data);
      case 'csv':
        return await this.createCsvFile(filename, data);
      case 'excel':
        return await this.createExcelFile(filename, data);
      case 'pdf':
        return await this.createPdfFile(filename, data, exportRequest);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Create JSON file
   */
  private async createJsonFile(filename: string, data: any): Promise<string> {
    const fs = require('fs').promises;
    const path = require('path');
    
    const filePath = path.join('/tmp', 'exports', `${filename}.json`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    
    return `/api/export/download/${path.basename(filePath)}`;
  }

  /**
   * Create CSV file
   */
  private async createCsvFile(filename: string, data: any[]): Promise<string> {
    const fs = require('fs').promises;
    const path = require('path');
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No data available for CSV export');
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const filePath = path.join('/tmp', 'exports', `${filename}.csv`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, csvContent);
    
    return `/api/export/download/${path.basename(filePath)}`;
  }

  /**
   * Create Excel file
   */
  private async createExcelFile(filename: string, data: any): Promise<string> {
    // This would typically use a library like xlsx or exceljs
    // For now, create a simple CSV and rename it
    const csvUrl = await this.createCsvFile(filename, Array.isArray(data) ? data : [data]);
    return csvUrl.replace('.csv', '.xlsx');
  }

  /**
   * Create PDF file
   */
  private async createPdfFile(filename: string, data: any, exportRequest: ExportRequest): Promise<string> {
    // This would typically use a library like puppeteer or jsPDF
    // For now, create a simple text file as placeholder
    const fs = require('fs').promises;
    const path = require('path');
    
    const content = this.generatePdfContent(data, exportRequest);
    const filePath = path.join('/tmp', 'exports', `${filename}.pdf`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
    
    return `/api/export/download/${path.basename(filePath)}`;
  }

  /**
   * Generate PDF content
   */
  private generatePdfContent(data: any, exportRequest: ExportRequest): string {
    const { type, includeCharts, includeDetails } = exportRequest;
    
    let content = `TaskFlow Pro - ${type.toUpperCase()} Export\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `Format: ${exportRequest.format}\n\n`;

    if (Array.isArray(data)) {
      content += `Total Records: ${data.length}\n\n`;
      
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        content += headers.join('\t') + '\n';
        content += '='.repeat(headers.length * 10) + '\n';
        
        data.forEach(row => {
          content += headers.map(header => row[header] || '').join('\t') + '\n';
        });
      }
    } else {
      content += JSON.stringify(data, null, 2);
    }

    return content;
  }

  /**
   * Build where clause from filters
   */
  private buildWhereClause(filters?: any): any {
    if (!filters) return {};

    const whereClause: any = {};

    if (filters.dateRange) {
      whereClause.createdAt = {
        gte: new Date(filters.dateRange.start),
        lte: new Date(filters.dateRange.end)
      };
    }

    if (filters.status) {
      whereClause.status = { in: filters.status };
    }

    if (filters.priority) {
      whereClause.priority = { in: filters.priority };
    }

    if (filters.teamIds) {
      whereClause.teamId = { in: filters.teamIds };
    }

    if (filters.projectIds) {
      whereClause.projectId = { in: filters.projectIds };
    }

    return whereClause;
  }

  /**
   * Generate custom report
   */
  private async generateCustomReport(reportType: string, startDate?: Date, endDate?: Date): Promise<any> {
    switch (reportType) {
      case 'productivity':
        return await this.generateProductivityReport(startDate, endDate);
      case 'timeline':
        return await this.generateTimelineReport(startDate, endDate);
      case 'budget':
        return await this.generateBudgetReport(startDate, endDate);
      default:
        return { message: 'Custom report type not implemented' };
    }
  }

  /**
   * Generate productivity report
   */
  private async generateProductivityReport(startDate?: Date, endDate?: Date): Promise<any> {
    // Implement productivity report logic
    return {
      averageTaskCompletion: 85.5,
      teamProductivity: [
        { team: 'Development', score: 92 },
        { team: 'Design', score: 88 },
        { team: 'Marketing', score: 76 }
      ],
      period: { startDate, endDate }
    };
  }

  /**
   * Generate timeline report
   */
  private async generateTimelineReport(startDate?: Date, endDate?: Date): Promise<any> {
    // Implement timeline report logic
    return {
      milestones: [
        { name: 'Project Start', date: startDate },
        { name: 'Phase 1 Complete', date: new Date() },
        { name: 'Project End', date: endDate }
      ],
      criticalPath: ['Task 1', 'Task 2', 'Task 3'],
      period: { startDate, endDate }
    };
  }

  /**
   * Generate budget report
   */
  private async generateBudgetReport(startDate?: Date, endDate?: Date): Promise<any> {
    // Implement budget report logic
    return {
      totalBudget: 100000,
      spent: 45000,
      remaining: 55000,
      byProject: [
        { name: 'Project A', budget: 50000, spent: 20000 },
        { name: 'Project B', budget: 30000, spent: 15000 },
        { name: 'Project C', budget: 20000, spent: 10000 }
      ],
      period: { startDate, endDate }
    };
  }

  /**
   * Clean up expired exports
   */
  async cleanupExpiredExports(): Promise<void> {
    const expiredExports = await db.exportRequest.findMany({
      where: {
        expiresAt: { lt: new Date() },
        status: 'completed'
      }
    });

    for (const exportRecord of expiredExports) {
      // Delete file from filesystem
      if (exportRecord.downloadUrl) {
        const fs = require('fs').promises;
        const path = require('path');
        const filePath = path.join('/tmp', 'exports', path.basename(exportRecord.downloadUrl));
        
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.error('Failed to delete export file:', error);
        }
      }

      // Update database record
      await db.exportRequest.update({
        where: { id: exportRecord.id },
        data: { 
          downloadUrl: null,
          status: 'expired'
        }
      });
    }
  }
}

export const exportService = new ExportService();

// Export types
export type { ExportRequest, ScheduledExport };