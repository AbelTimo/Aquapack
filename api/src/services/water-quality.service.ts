import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';

export interface CreateWaterQualityData {
  siteId: string;
  boreholeId?: string;
  sampleDatetime: string;
  sampleId?: string;
  temperature?: number;
  temperatureUnit: 'celsius' | 'fahrenheit';
  ph?: number;
  electricalConductivity?: number;
  ecUnit: 'uS/cm' | 'mS/cm';
  totalDissolvedSolids?: number;
  tdsUnit: 'mg/L' | 'ppm';
  dissolvedOxygen?: number;
  doUnit: 'mg/L' | '%sat';
  turbidity?: number;
  turbidityUnit: 'NTU' | 'FNU';
  redoxPotential?: number;
  instrumentId?: string;
  calibrationDate?: string;
  notes?: string;
}

export interface WaterQualityFilters {
  siteId?: string;
  boreholeId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class WaterQualityService {
  async create(data: CreateWaterQualityData, userId: string) {
    const waterQuality = await prisma.waterQualityReading.create({
      data: {
        ...data,
        sampleDatetime: new Date(data.sampleDatetime),
        calibrationDate: data.calibrationDate ? new Date(data.calibrationDate) : undefined,
        collectedBy: userId,
      },
      include: {
        site: { select: { id: true, name: true, code: true } },
        borehole: { select: { id: true, name: true } },
        collectedByUser: { select: { id: true, name: true } },
      },
    });

    return waterQuality;
  }

  async findAll(organizationId: string, filters: WaterQualityFilters = {}) {
    const {
      siteId,
      boreholeId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 50,
      sortBy = 'sampleDatetime',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.WaterQualityReadingWhereInput = {
      site: { organizationId },
      ...(siteId && { siteId }),
      ...(boreholeId && { boreholeId }),
      ...(dateFrom || dateTo
        ? {
            sampleDatetime: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo) }),
            },
          }
        : {}),
    };

    const [waterQualityReadings, total] = await Promise.all([
      prisma.waterQualityReading.findMany({
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
      prisma.waterQualityReading.count({ where }),
    ]);

    return {
      items: waterQualityReadings,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    return prisma.waterQualityReading.findUnique({
      where: { id },
      include: {
        site: { select: { id: true, name: true, code: true } },
        borehole: { select: { id: true, name: true } },
        collectedByUser: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findBySite(siteId: string) {
    return prisma.waterQualityReading.findMany({
      where: { siteId },
      include: {
        borehole: { select: { id: true, name: true } },
      },
      orderBy: { sampleDatetime: 'desc' },
    });
  }

  async findByBorehole(boreholeId: string) {
    return prisma.waterQualityReading.findMany({
      where: { boreholeId },
      orderBy: { sampleDatetime: 'desc' },
    });
  }

  async getSummary(siteId: string) {
    const readings = await prisma.waterQualityReading.findMany({
      where: { siteId },
      select: {
        ph: true,
        electricalConductivity: true,
        totalDissolvedSolids: true,
        dissolvedOxygen: true,
        turbidity: true,
        temperature: true,
      },
    });

    if (readings.length === 0) {
      return {
        count: 0,
        parameters: {},
      };
    }

    const calculateStats = (values: (number | null)[]) => {
      const validValues = values.filter((v): v is number => v !== null && v !== undefined);
      if (validValues.length === 0) return null;

      return {
        count: validValues.length,
        min: Math.min(...validValues),
        max: Math.max(...validValues),
        avg: validValues.reduce((sum, v) => sum + v, 0) / validValues.length,
      };
    };

    return {
      count: readings.length,
      parameters: {
        ph: calculateStats(readings.map((r) => r.ph)),
        electricalConductivity: calculateStats(readings.map((r) => r.electricalConductivity)),
        totalDissolvedSolids: calculateStats(readings.map((r) => r.totalDissolvedSolids)),
        dissolvedOxygen: calculateStats(readings.map((r) => r.dissolvedOxygen)),
        turbidity: calculateStats(readings.map((r) => r.turbidity)),
        temperature: calculateStats(readings.map((r) => r.temperature)),
      },
    };
  }

  async update(id: string, data: Partial<CreateWaterQualityData>) {
    return prisma.waterQualityReading.update({
      where: { id },
      data: {
        ...data,
        sampleDatetime: data.sampleDatetime ? new Date(data.sampleDatetime) : undefined,
        calibrationDate: data.calibrationDate ? new Date(data.calibrationDate) : undefined,
      },
      include: {
        site: { select: { id: true, name: true, code: true } },
        borehole: { select: { id: true, name: true } },
      },
    });
  }

  async delete(id: string) {
    return prisma.waterQualityReading.delete({
      where: { id },
    });
  }
}

export const waterQualityService = new WaterQualityService();
