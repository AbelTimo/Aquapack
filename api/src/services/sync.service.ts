import { prisma } from '../utils/prisma';

export interface SyncEntity {
  localId: string;
  deviceId: string;
  entityType: 'site' | 'borehole' | 'waterLevel' | 'pumpTest' | 'waterQuality';
  data: any;
}

export interface PushPayload {
  deviceId: string;
  entities: SyncEntity[];
}

export interface PullParams {
  lastSyncTimestamp?: string;
  projectIds?: string[];
}

export interface ConflictResolution {
  entityType: string;
  entityId: string;
  resolution: 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGED';
  mergedData?: any;
}

class SyncService {
  async push(payload: PushPayload, userId: string, organizationId: string) {
    const results = {
      created: [] as any[],
      updated: [] as any[],
      conflicts: [] as any[],
    };

    for (const entity of payload.entities) {
      try {
        const result = await this.processEntity(entity, userId, organizationId);

        if (result.conflict) {
          results.conflicts.push(result.conflict);
        } else if (result.created) {
          results.created.push(result.created);
        } else if (result.updated) {
          results.updated.push(result.updated);
        }
      } catch (error) {
        console.error(`Failed to process entity ${entity.localId}:`, error);
        results.conflicts.push({
          localId: entity.localId,
          entityType: entity.entityType,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Log sync event
    await prisma.syncLog.create({
      data: {
        userId,
        deviceId: payload.deviceId,
        action: 'PUSH',
        entityCount: payload.entities.length,
        successCount: results.created.length + results.updated.length,
        failureCount: results.conflicts.length,
      },
    });

    return results;
  }

  async pull(params: PullParams, userId: string, organizationId: string) {
    const lastSync = params.lastSyncTimestamp ? new Date(params.lastSyncTimestamp) : undefined;

    // Get user's accessible projects
    const userProjects = params.projectIds
      ? await prisma.projectAssignment.findMany({
          where: {
            userId,
            projectId: { in: params.projectIds },
          },
          select: { projectId: true },
        })
      : await prisma.projectAssignment.findMany({
          where: { userId },
          select: { projectId: true },
        });

    const projectIds = userProjects.map((p) => p.projectId);

    const where = lastSync
      ? {
          updatedAt: { gte: lastSync },
        }
      : {};

    // Fetch all relevant entities
    const [sites, boreholes, waterLevels, pumpTests, waterQuality] = await Promise.all([
      prisma.site.findMany({
        where: {
          ...where,
          projectId: { in: projectIds },
        },
        include: {
          project: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.borehole.findMany({
        where: {
          ...where,
          site: { projectId: { in: projectIds } },
        },
        include: {
          site: { select: { id: true, name: true } },
        },
      }),
      prisma.waterLevelMeasurement.findMany({
        where: {
          ...where,
          site: { projectId: { in: projectIds } },
        },
      }),
      prisma.pumpTest.findMany({
        where: {
          ...where,
          site: { projectId: { in: projectIds } },
        },
        include: {
          entries: true,
          steps: true,
        },
      }),
      prisma.waterQualityReading.findMany({
        where: {
          ...where,
          site: { projectId: { in: projectIds } },
        },
      }),
    ]);

    // Log sync event
    await prisma.syncLog.create({
      data: {
        userId,
        deviceId: 'pull',
        action: 'PULL',
        entityCount:
          sites.length +
          boreholes.length +
          waterLevels.length +
          pumpTests.length +
          waterQuality.length,
        successCount:
          sites.length +
          boreholes.length +
          waterLevels.length +
          pumpTests.length +
          waterQuality.length,
        failureCount: 0,
      },
    });

    return {
      timestamp: new Date().toISOString(),
      sites,
      boreholes,
      waterLevels,
      pumpTests,
      waterQuality,
    };
  }

  async resolveConflict(resolution: ConflictResolution, userId: string) {
    const { entityType, entityId, resolution: strategy, mergedData } = resolution;

    if (strategy === 'SERVER_WINS') {
      // Do nothing, server version is already current
      return { success: true, message: 'Server version kept' };
    }

    if (strategy === 'LOCAL_WINS' || strategy === 'MERGED') {
      const data = strategy === 'MERGED' ? mergedData : resolution;

      // Update entity based on type
      switch (entityType) {
        case 'site':
          await prisma.site.update({ where: { id: entityId }, data });
          break;
        case 'borehole':
          await prisma.borehole.update({ where: { id: entityId }, data });
          break;
        case 'waterLevel':
          await prisma.waterLevelMeasurement.update({ where: { id: entityId }, data });
          break;
        case 'pumpTest':
          await prisma.pumpTest.update({ where: { id: entityId }, data });
          break;
        case 'waterQuality':
          await prisma.waterQualityReading.update({ where: { id: entityId }, data });
          break;
      }

      return { success: true, message: `${strategy} applied` };
    }

    throw new Error('Invalid resolution strategy');
  }

  private async processEntity(entity: SyncEntity, userId: string, organizationId: string) {
    const { localId, deviceId, entityType, data } = entity;

    // Check if entity already exists (by deviceId + localId)
    let existingEntity;

    switch (entityType) {
      case 'site':
        existingEntity = await prisma.site.findFirst({
          where: { deviceId, localId },
        });
        break;
      case 'borehole':
        existingEntity = await prisma.borehole.findFirst({
          where: { deviceId, localId },
        });
        break;
      case 'waterLevel':
        existingEntity = await prisma.waterLevelMeasurement.findFirst({
          where: { deviceId, localId },
        });
        break;
      case 'pumpTest':
        existingEntity = await prisma.pumpTest.findFirst({
          where: { deviceId, localId },
        });
        break;
      case 'waterQuality':
        existingEntity = await prisma.waterQualityReading.findFirst({
          where: { deviceId, localId },
        });
        break;
    }

    if (existingEntity) {
      // Check for conflicts
      const serverUpdatedAt = new Date(existingEntity.updatedAt);
      const clientUpdatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date(0);

      if (serverUpdatedAt > clientUpdatedAt) {
        return {
          conflict: {
            localId,
            entityType,
            serverId: existingEntity.id,
            serverVersion: existingEntity,
            clientVersion: data,
          },
        };
      }

      // Update existing
      let updated;
      switch (entityType) {
        case 'site':
          updated = await prisma.site.update({
            where: { id: existingEntity.id },
            data: { ...data, updatedAt: new Date() },
          });
          break;
        case 'borehole':
          updated = await prisma.borehole.update({
            where: { id: existingEntity.id },
            data: { ...data, updatedAt: new Date() },
          });
          break;
        case 'waterLevel':
          updated = await prisma.waterLevelMeasurement.update({
            where: { id: existingEntity.id },
            data: { ...data, updatedAt: new Date() },
          });
          break;
        case 'pumpTest':
          updated = await prisma.pumpTest.update({
            where: { id: existingEntity.id },
            data: { ...data, updatedAt: new Date() },
          });
          break;
        case 'waterQuality':
          updated = await prisma.waterQualityReading.update({
            where: { id: existingEntity.id },
            data: { ...data, updatedAt: new Date() },
          });
          break;
      }

      return { updated: { localId, serverId: existingEntity.id, entity: updated } };
    }

    // Create new entity
    let created;
    const createData = {
      ...data,
      deviceId,
      localId,
      collectedBy: userId,
    };

    switch (entityType) {
      case 'site':
        created = await prisma.site.create({ data: createData });
        break;
      case 'borehole':
        created = await prisma.borehole.create({ data: createData });
        break;
      case 'waterLevel':
        created = await prisma.waterLevelMeasurement.create({ data: createData });
        break;
      case 'pumpTest':
        created = await prisma.pumpTest.create({ data: createData });
        break;
      case 'waterQuality':
        created = await prisma.waterQualityReading.create({ data: createData });
        break;
    }

    return { created: { localId, serverId: created.id, entity: created } };
  }
}

export const syncService = new SyncService();
