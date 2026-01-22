import { Router, Response } from 'express';
import { waterLevelService } from '../services/water-level.service';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { createWaterLevelSchema, updateWaterLevelSchema } from '@aquapack/shared';
import { UserRole } from '@prisma/client';

const router = Router();

// Get all water level measurements with filters
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { siteId, boreholeId, dateFrom, dateTo, measurementType, page, limit, sortBy, sortOrder } =
      req.query;

    const result = await waterLevelService.findAll(req.user!.organizationId, {
      siteId: siteId as string,
      boreholeId: boreholeId as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      measurementType: measurementType as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({ success: true, data: result.items, meta: result.meta });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch water level measurements' },
    });
  }
});

// Get water level trends for a site
router.get('/trends/:siteId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const trends = await waterLevelService.getTrends(
      req.params.siteId,
      dateFrom as string,
      dateTo as string
    );

    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch water level trends' },
    });
  }
});

// Get single water level measurement
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const waterLevel = await waterLevelService.findById(req.params.id);

    if (!waterLevel) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Water level measurement not found' },
      });
      return;
    }

    res.json({ success: true, data: waterLevel });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch water level measurement' },
    });
  }
});

// Create water level measurement
router.post(
  '/',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = createWaterLevelSchema.safeParse(req.body);

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

      const waterLevel = await waterLevelService.create(validation.data, req.user!.id);

      res.status(201).json({ success: true, data: waterLevel });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create water level measurement';
      res.status(400).json({
        success: false,
        error: { code: 'CREATE_FAILED', message },
      });
    }
  }
);

// Update water level measurement
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = updateWaterLevelSchema.safeParse(req.body);

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

      const waterLevel = await waterLevelService.update(req.params.id, validation.data);

      res.json({ success: true, data: waterLevel });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: { code: 'UPDATE_FAILED', message: 'Failed to update water level measurement' },
      });
    }
  }
);

// Delete water level measurement
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await waterLevelService.delete(req.params.id);
      res.json({ success: true, data: { message: 'Water level measurement deleted' } });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: { code: 'DELETE_FAILED', message: 'Failed to delete water level measurement' },
      });
    }
  }
);

export default router;
