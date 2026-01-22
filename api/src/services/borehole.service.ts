import { prisma } from '../utils/prisma';
import { Prisma, QAStatus } from '@prisma/client';

export interface CreateBoreholeData {
  siteId: string;
  name: string;
  wellType: 'BOREHOLE' | 'DUG_WELL' | 'SPRING' | 'PIEZOMETER';
  totalDepth: number;
  depthUnit: 'meters' | 'feet';
  drillingDate?: string;
  drillingMethod?: string;
  driller?: string;
  diameter?: number;
  casingDetails?: any;
  screenIntervals?: any;
  lithologyLog?: any;
  staticWaterLevel?: number;
  notes?: string;
}

export interface BoreholeFilters {
  siteId?: string;
  qaStatus?: QAStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class BoreholeService {
  async create(data: CreateBoreholeData, userId: string) {
    const borehole = await prisma.borehole.create({
      data: {
        ...data,
        drillingDate: data.drillingDate ? new Date(data.drillingDate) : undefined,
        collectedBy: userId,
      },
      include: {
        site: { select: { id: true, name: true, code: true } },
        collectedByUser: { select: { id: true, name: true } },
      },
    });

    return borehole;
  }

  async findAll(organizationId: string, filters: BoreholeFilters = {}) {
    const {
      siteId,
      qaStatus,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.BoreholeWhereInput = {
      site: { organizationId },
      ...(siteId && { siteId }),
      ...(qaStatus && { qaStatus }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { driller: { contains: search, mode: 'insensitive' } },
          { drillingMethod: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [boreholes, total] = await Promise.all([
      prisma.borehole.findMany({
        where,
        include: {
          site: { select: { id: true, name: true, code: true } },
          _count: {
            select: {
              waterLevelMeasurements: true,
              pumpTests: true,
              waterQualityReadings: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.borehole.count({ where }),
    ]);

    return {
      items: boreholes,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    return prisma.borehole.findUnique({
      where: { id },
      include: {
        site: { select: { id: true, name: true, code: true, projectId: true } },
        collectedByUser: { select: { id: true, name: true, email: true } },
        reviewedByUser: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            waterLevelMeasurements: true,
            pumpTests: true,
            waterQualityReadings: true,
            media: true,
          },
        },
      },
    });
  }

  async findBySite(siteId: string) {
    return prisma.borehole.findMany({
      where: { siteId },
      include: {
        _count: {
          select: {
            waterLevelMeasurements: true,
            pumpTests: true,
            waterQualityReadings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Partial<CreateBoreholeData>) {
    return prisma.borehole.update({
      where: { id },
      data: {
        ...data,
        drillingDate: data.drillingDate ? new Date(data.drillingDate) : undefined,
      },
      include: {
        site: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async delete(id: string) {
    return prisma.borehole.delete({
      where: { id },
    });
  }

  async updateQAStatus(
    id: string,
    status: QAStatus,
    reviewerId: string,
    comment?: string
  ) {
    const [borehole, reviewComment] = await prisma.$transaction([
      prisma.borehole.update({
        where: { id },
        data: {
          qaStatus: status,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        },
      }),
      comment
        ? prisma.reviewComment.create({
            data: {
              linkedEntityType: 'borehole',
              linkedEntityId: id,
              status,
              comment,
              reviewedBy: reviewerId,
            },
          })
        : Promise.resolve(null),
    ]);

    return { borehole, reviewComment };
  }
}

export const boreholeService = new BoreholeService();
