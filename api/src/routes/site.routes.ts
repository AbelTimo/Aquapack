import { Router, Response } from 'express';
import { siteService } from '../services/site.service';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { createSiteSchema, updateSiteSchema } from '@aquapack/shared';
import { UserRole, QAStatus } from '@prisma/client';

const router = Router();

// Get all sites (with filters)
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId, qaStatus, search, page, limit, sortBy, sortOrder } = req.query;

    const result = await siteService.findAll(req.user!.organizationId, {
      projectId: projectId as string,
      qaStatus: qaStatus as QAStatus,
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({ success: true, data: result.items, meta: result.meta });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch sites' },
    });
  }
});

// Get sites for map view
router.get('/map/:projectId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sites = await siteService.getForMap(req.params.projectId);
    res.json({ success: true, data: sites });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch sites for map' },
    });
  }
});

// Get single site with all related data
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const site = await siteService.findById(req.params.id);

    if (!site) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
      return;
    }

    res.json({ success: true, data: site });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch site' },
    });
  }
});

// Create site
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = createSiteSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: validation.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const site = await siteService.create(
      {
        ...validation.data,
        latitude: validation.data.location.latitude,
        longitude: validation.data.location.longitude,
        accuracy: validation.data.location.accuracy,
        altitude: validation.data.location.altitude,
        localId: req.body.localId,
        deviceId: req.body.deviceId,
      },
      req.user!.id
    );

    res.status(201).json({ success: true, data: site });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create site';
    res.status(400).json({
      success: false,
      error: { code: 'CREATE_FAILED', message },
    });
  }
});

// Update site
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = updateSiteSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: validation.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const updateData: any = { ...validation.data };
    if (validation.data.location) {
      updateData.latitude = validation.data.location.latitude;
      updateData.longitude = validation.data.location.longitude;
      updateData.accuracy = validation.data.location.accuracy;
      updateData.altitude = validation.data.location.altitude;
      delete updateData.location;
    }

    const site = await siteService.update(req.params.id, updateData);

    res.json({ success: true, data: site });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'UPDATE_FAILED', message: 'Failed to update site' },
    });
  }
});

// Delete site
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await siteService.delete(req.params.id);
      res.json({ success: true, data: { message: 'Site deleted' } });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: { code: 'DELETE_FAILED', message: 'Failed to delete site' },
      });
    }
  }
);

// Update QA status (team lead only)
router.post(
  '/:id/review',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.DATA_MANAGER, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, comment } = req.body;

      if (!status) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Status is required' },
        });
        return;
      }

      const site = await siteService.updateQAStatus(
        req.params.id,
        status as QAStatus,
        req.user!.id,
        comment
      );

      res.json({ success: true, data: site });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: { code: 'REVIEW_FAILED', message: 'Failed to update review status' },
      });
    }
  }
);

// Sync endpoint for mobile
router.post('/sync', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sites, deviceId, lastSyncTimestamp } = req.body;

    if (!deviceId) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'deviceId is required' },
      });
      return;
    }

    const result = await siteService.syncFromDevice(
      sites || [],
      req.user!.id,
      deviceId,
      lastSyncTimestamp
    );

    res.json({
      success: true,
      data: result,
      meta: { serverTimestamp: new Date().toISOString() },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'SYNC_FAILED', message: 'Sync failed' },
    });
  }
});

// Get changes since timestamp (for mobile pull)
router.get('/sync/:projectId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { since } = req.query;

    if (!since) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'since timestamp is required' },
      });
      return;
    }

    const changes = await siteService.getChanges(req.params.projectId, since as string);

    res.json({
      success: true,
      data: changes,
      meta: { serverTimestamp: new Date().toISOString() },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch changes' },
    });
  }
});

export default router;
