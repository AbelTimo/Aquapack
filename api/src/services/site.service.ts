import { prisma } from '../utils/prisma';
import { Prisma, QAStatus, SyncStatus } from '@prisma/client';

export interface CreateSiteData {
  projectId: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  description?: string;
  siteType?: string;
  accessNotes?: string;
  localId?: string;
  deviceId?: string;
}

export interface SiteFilters {
  projectId?: string;
  qaStatus?: QAStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class SiteService {
  async create(data: CreateSiteData, userId: string) {
    return prisma.site.create({
      data: {
        ...data,
        createdBy: userId,
        locationCapturedAt: new Date(),
        syncStatus: data.localId ? SyncStatus.SYNCED : SyncStatus.SYNCED,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, name: true } },
        _count: {
          select: {
            boreholes: true,
            waterLevels: true,
            pumpTests: true,
            waterQualityReadings: true,
          },
        },
      },
    });
  }

  async findAll(organizationId: string, filters: SiteFilters = {}) {
    const {
      projectId,
      qaStatus,
      search,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.SiteWhereInput = {
      project: { organizationId },
      ...(projectId && { projectId }),
      ...(qaStatus && { qaStatus }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [sites, total] = await Promise.all([
      prisma.site.findMany({
        where,
        include: {
          project: { select: { id: true, name: true, code: true } },
          creator: { select: { id: true, name: true } },
          _count: {
            select: {
              boreholes: true,
              waterLevels: true,
              pumpTests: true,
              waterQualityReadings: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.site.count({ where }),
    ]);

    return {
      items: sites,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    return prisma.site.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, name: true } },
        boreholes: {
          include: {
            _count: {
              select: { waterLevels: true, pumpTests: true, waterQualityReadings: true },
            },
          },
        },
        waterLevels: { orderBy: { measurementDatetime: 'desc' }, take: 10 },
        pumpTests: { orderBy: { startDatetime: 'desc' }, take: 5 },
        waterQualityReadings: { orderBy: { sampleDatetime: 'desc' }, take: 5 },
        media: { orderBy: { createdAt: 'desc' } },
        reviewComments: {
          include: { reviewer: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async update(id: string, data: Partial<CreateSiteData>) {
    return prisma.site.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, name: true } },
      },
    });
  }

  async delete(id: string) {
    return prisma.site.delete({
      where: { id },
    });
  }

  async updateQAStatus(id: string, status: QAStatus, reviewerId: string, comment?: string) {
    const site = await prisma.site.update({
      where: { id },
      data: { qaStatus: status },
    });

    if (comment) {
      await prisma.reviewComment.create({
        data: {
          linkedEntityType: 'site',
          linkedEntityId: id,
          siteId: id,
          reviewerId,
          status,
          comment,
        },
      });
    }

    return site;
  }

  async getForMap(projectId: string) {
    return prisma.site.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        code: true,
        latitude: true,
        longitude: true,
        qaStatus: true,
        siteType: true,
        _count: {
          select: { boreholes: true },
        },
      },
    });
  }

  // Sync methods for mobile
  async syncFromDevice(
    sites: CreateSiteData[],
    userId: string,
    deviceId: string,
    lastSyncTimestamp?: string
  ) {
    const results = {
      created: [] as any[],
      updated: [] as any[],
      conflicts: [] as any[],
    };

    for (const siteData of sites) {
      // Check if site with localId already exists
      if (siteData.localId) {
        const existing = await prisma.site.findFirst({
          where: { localId: siteData.localId, deviceId },
        });

        if (existing) {
          // Update existing
          const updated = await this.update(existing.id, siteData);
          results.updated.push(updated);
        } else {
          // Create new
          const created = await this.create({ ...siteData, deviceId }, userId);
          results.created.push(created);
        }
      } else {
        const created = await this.create({ ...siteData, deviceId }, userId);
        results.created.push(created);
      }
    }

    return results;
  }

  async getChanges(projectId: string, since: string) {
    const sinceDate = new Date(since);

    return prisma.site.findMany({
      where: {
        projectId,
        updatedAt: { gt: sinceDate },
      },
      include: {
        boreholes: true,
        waterLevels: true,
        pumpTests: { include: { entries: true } },
        waterQualityReadings: true,
      },
    });
  }
}

export const siteService = new SiteService();
