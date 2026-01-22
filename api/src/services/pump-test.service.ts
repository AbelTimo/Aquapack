import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';

export interface CreatePumpTestData {
  siteId: string;
  boreholeId?: string;
  testType: 'STEP_TEST' | 'CONSTANT_RATE' | 'RECOVERY' | 'SLUG_TEST';
  testName?: string;
  startDatetime: string;
  endDatetime?: string;
  staticWaterLevel?: number;
  pumpDepth?: number;
  pumpType?: string;
  notes?: string;
}

export interface CreatePumpTestEntryData {
  pumpTestId: string;
  elapsedMinutes: number;
  elapsedSeconds?: number;
  depthToWater: number;
  drawdown?: number;
  discharge?: number;
  dischargeUnit?: 'l/s' | 'm3/h' | 'gpm';
  notes?: string;
}

export interface PumpTestFilters {
  siteId?: string;
  boreholeId?: string;
  testType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class PumpTestService {
  async create(data: CreatePumpTestData, userId: string) {
    const pumpTest = await prisma.pumpTest.create({
      data: {
        ...data,
        startDatetime: new Date(data.startDatetime),
        endDatetime: data.endDatetime ? new Date(data.endDatetime) : undefined,
        collectedBy: userId,
      },
      include: {
        site: { select: { id: true, name: true, code: true } },
        borehole: { select: { id: true, name: true } },
        collectedByUser: { select: { id: true, name: true } },
      },
    });

    return pumpTest;
  }

  async findAll(organizationId: string, filters: PumpTestFilters = {}) {
    const {
      siteId,
      boreholeId,
      testType,
      page = 1,
      limit = 20,
      sortBy = 'startDatetime',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.PumpTestWhereInput = {
      site: { organizationId },
      ...(siteId && { siteId }),
      ...(boreholeId && { boreholeId }),
      ...(testType && { testType }),
    };

    const [pumpTests, total] = await Promise.all([
      prisma.pumpTest.findMany({
        where,
        include: {
          site: { select: { id: true, name: true, code: true } },
          borehole: { select: { id: true, name: true } },
          _count: {
            select: { entries: true, steps: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.pumpTest.count({ where }),
    ]);

    return {
      items: pumpTests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    return prisma.pumpTest.findUnique({
      where: { id },
      include: {
        site: { select: { id: true, name: true, code: true } },
        borehole: { select: { id: true, name: true, totalDepth: true } },
        collectedByUser: { select: { id: true, name: true, email: true } },
        entries: {
          orderBy: { elapsedMinutes: 'asc' },
        },
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    });
  }

  async findBySite(siteId: string) {
    return prisma.pumpTest.findMany({
      where: { siteId },
      include: {
        borehole: { select: { id: true, name: true } },
        _count: {
          select: { entries: true },
        },
      },
      orderBy: { startDatetime: 'desc' },
    });
  }

  async update(id: string, data: Partial<CreatePumpTestData>) {
    return prisma.pumpTest.update({
      where: { id },
      data: {
        ...data,
        startDatetime: data.startDatetime ? new Date(data.startDatetime) : undefined,
        endDatetime: data.endDatetime ? new Date(data.endDatetime) : undefined,
      },
      include: {
        site: { select: { id: true, name: true, code: true } },
        borehole: { select: { id: true, name: true } },
      },
    });
  }

  async delete(id: string) {
    // Prisma will cascade delete entries and steps
    return prisma.pumpTest.delete({
      where: { id },
    });
  }

  async addEntry(entryData: CreatePumpTestEntryData) {
    const pumpTest = await prisma.pumpTest.findUnique({
      where: { id: entryData.pumpTestId },
      select: { staticWaterLevel: true },
    });

    // Auto-calculate drawdown if not provided and static water level is known
    let drawdown = entryData.drawdown;
    if (
      drawdown === undefined &&
      pumpTest?.staticWaterLevel !== null &&
      pumpTest?.staticWaterLevel !== undefined
    ) {
      drawdown = entryData.depthToWater - pumpTest.staticWaterLevel;
    }

    return prisma.pumpTestEntry.create({
      data: {
        ...entryData,
        drawdown,
      },
    });
  }

  async updateEntry(entryId: string, data: Partial<CreatePumpTestEntryData>) {
    return prisma.pumpTestEntry.update({
      where: { id: entryId },
      data,
    });
  }

  async deleteEntry(entryId: string) {
    return prisma.pumpTestEntry.delete({
      where: { id: entryId },
    });
  }
}

export const pumpTestService = new PumpTestService();
