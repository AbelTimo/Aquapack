import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';

export interface CreateWaterLevelData {
  siteId: string;
  boreholeId?: string;
  measurementDatetime: string;
  depthToWater: number;
  depthUnit: 'meters' | 'feet';
  measurementMethod: 'MANUAL_TAPE' | 'PRESSURE_TRANSDUCER' | 'SOUNDER' | 'OTHER';
  measurementType: 'static' | 'dynamic' | 'recovery';
  referencePoint?: string;
  notes?: string;
}

export interface WaterLevelFilters {
  siteId?: string;
  boreholeId?: string;
  dateFrom?: string;
  dateTo?: string;
  measurementType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class WaterLevelService {
  async create(data: CreateWaterLevelData, userId: string) {
    const waterLevel = await prisma.waterLevelMeasurement.create({
      data: {
        ...data,
        measurementDatetime: new Date(data.measurementDatetime),
        collectedBy: userId,
      },
      include: {
        site: { select: { id: true, name: true, code: true } },
        borehole: { select: { id: true, name: true } },
        collectedByUser: { select: { id: true, name: true } },
      },
    });

    return waterLevel;
  }

  async findAll(organizationId: string, filters: WaterLevelFilters = {}) {
    const {
      siteId,
      boreholeId,
      dateFrom,
      dateTo,
      measurementType,
      page = 1,
      limit = 50,
      sortBy = 'measurementDatetime',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.WaterLevelMeasurementWhereInput = {
      site: { organizationId },
      ...(siteId && { siteId }),
      ...(boreholeId && { boreholeId }),
      ...(measurementType && { measurementType }),
      ...(dateFrom || dateTo
        ? {
            measurementDatetime: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo) }),
            },
          }
        : {}),
    };

    const [waterLevels, total] = await Promise.all([
      prisma.waterLevelMeasurement.findMany({
        where,
        include: {
          site: { select: { id: true, name: true, code: true } },
          borehole: { select: { id: true, name: true } },
          collectedByUser: { select: { id: true, name: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.waterLevelMeasurement.count({ where }),
    ]);

    return {
      items: waterLevels,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    return prisma.waterLevelMeasurement.findUnique({
      where: { id },
      include: {
        site: { select: { id: true, name: true, code: true } },
        borehole: { select: { id: true, name: true, totalDepth: true } },
        collectedByUser: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findBySite(siteId: string) {
    return prisma.waterLevelMeasurement.findMany({
      where: { siteId },
      include: {
        borehole: { select: { id: true, name: true } },
      },
      orderBy: { measurementDatetime: 'desc' },
    });
  }

  async findByBorehole(boreholeId: string) {
    return prisma.waterLevelMeasurement.findMany({
      where: { boreholeId },
      orderBy: { measurementDatetime: 'desc' },
    });
  }

  async getTrends(siteId: string, dateFrom?: string, dateTo?: string) {
    const where: Prisma.WaterLevelMeasurementWhereInput = {
      siteId,
      ...(dateFrom || dateTo
        ? {
            measurementDatetime: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo) }),
            },
          }
        : {}),
    };

    const measurements = await prisma.waterLevelMeasurement.findMany({
      where,
      select: {
        measurementDatetime: true,
        depthToWater: true,
        depthUnit: true,
        measurementType: true,
        borehole: { select: { name: true } },
      },
      orderBy: { measurementDatetime: 'asc' },
    });

    // Group by date for aggregation
    const groupedByDate = measurements.reduce(
      (acc, m) => {
        const date = m.measurementDatetime.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(m.depthToWater);
        return acc;
      },
      {} as Record<string, number[]>
    );

    const trends = Object.entries(groupedByDate).map(([date, depths]) => ({
      date,
      count: depths.length,
      min: Math.min(...depths),
      max: Math.max(...depths),
      avg: depths.reduce((sum, d) => sum + d, 0) / depths.length,
    }));

    return {
      trends,
      measurements: measurements.slice(0, 100), // Return last 100 individual measurements
    };
  }

  async update(id: string, data: Partial<CreateWaterLevelData>) {
    return prisma.waterLevelMeasurement.update({
      where: { id },
      data: {
        ...data,
        measurementDatetime: data.measurementDatetime
          ? new Date(data.measurementDatetime)
          : undefined,
      },
      include: {
        site: { select: { id: true, name: true, code: true } },
        borehole: { select: { id: true, name: true } },
      },
    });
  }

  async delete(id: string) {
    return prisma.waterLevelMeasurement.delete({
      where: { id },
    });
  }
}

export const waterLevelService = new WaterLevelService();
