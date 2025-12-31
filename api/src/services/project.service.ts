import { prisma } from '../utils/prisma';
import { Prisma, UserRole } from '@prisma/client';

export interface CreateProjectData {
  name: string;
  code: string;
  client?: string;
  region?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  templateConfig?: any;
}

export interface ProjectFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class ProjectService {
  async create(data: CreateProjectData, userId: string, organizationId: string) {
    const project = await prisma.project.create({
      data: {
        ...data,
        organizationId,
        createdBy: userId,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
      include: {
        organization: { select: { id: true, name: true } },
      },
    });

    // Auto-assign creator as team lead
    await prisma.projectAssignment.create({
      data: {
        userId,
        projectId: project.id,
        role: UserRole.TEAM_LEAD,
      },
    });

    return project;
  }

  async findAll(organizationId: string, filters: ProjectFilters = {}) {
    const {
      search,
      isActive,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.ProjectWhereInput = {
      organizationId,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { client: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          _count: {
            select: { sites: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    return {
      items: projects,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, organizationId: string) {
    return prisma.project.findFirst({
      where: { id, organizationId },
      include: {
        organization: { select: { id: true, name: true } },
        assignments: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        _count: {
          select: { sites: true },
        },
      },
    });
  }

  async findByUser(userId: string) {
    const assignments = await prisma.projectAssignment.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            _count: {
              select: { sites: true },
            },
          },
        },
      },
    });

    return assignments.map((a) => ({
      ...a.project,
      userRole: a.role,
    }));
  }

  async update(id: string, data: Partial<CreateProjectData>, organizationId: string) {
    return prisma.project.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  async delete(id: string, organizationId: string) {
    return prisma.project.delete({
      where: { id },
    });
  }

  async assignUser(projectId: string, userId: string, role: UserRole) {
    return prisma.projectAssignment.upsert({
      where: {
        userId_projectId: { userId, projectId },
      },
      create: { userId, projectId, role },
      update: { role },
    });
  }

  async removeUser(projectId: string, userId: string) {
    return prisma.projectAssignment.delete({
      where: {
        userId_projectId: { userId, projectId },
      },
    });
  }

  async getDashboard(projectId: string) {
    const [
      sitesTotal,
      sitesCompleted,
      boreholesTotal,
      waterLevelCount,
      pumpTestCount,
      waterQualityCount,
      pendingReviewCount,
      flaggedCount,
    ] = await Promise.all([
      prisma.site.count({ where: { projectId } }),
      prisma.site.count({ where: { projectId, qaStatus: 'APPROVED' } }),
      prisma.borehole.count({ where: { site: { projectId } } }),
      prisma.waterLevelMeasurement.count({ where: { site: { projectId } } }),
      prisma.pumpTest.count({ where: { site: { projectId } } }),
      prisma.waterQualityReading.count({ where: { site: { projectId } } }),
      prisma.site.count({ where: { projectId, qaStatus: 'PENDING' } }),
      prisma.site.count({ where: { projectId, qaStatus: 'FLAGGED' } }),
    ]);

    return {
      projectId,
      sitesTotal,
      sitesCompleted,
      boreholesTotal,
      waterLevelCount,
      pumpTestCount,
      waterQualityCount,
      pendingReviewCount,
      flaggedCount,
    };
  }
}

export const projectService = new ProjectService();
