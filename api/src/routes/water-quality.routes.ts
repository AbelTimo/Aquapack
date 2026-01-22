import { Router, Response } from 'express';
import { waterQualityService } from '../services/water-quality.service';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { createWaterQualitySchema, updateWaterQualitySchema } from '@aquapack/shared';
import { UserRole } from '@prisma/client';

const router = Router();

// Get all water quality readings with filters
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { siteId, boreholeId, dateFrom, dateTo, page, limit, sortBy, sortOrder } = req.query;

    const result = await waterQualityService.findAll(req.user!.organizationId, {
      siteId: siteId as string,
      boreholeId: boreholeId as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({ success: true, data: result.items, meta: result.meta });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch water quality readings' },
    });
  }
});

// Get water quality summary statistics for a site
router.get('/summary/:siteId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await waterQualityService.getSummary(req.params.siteId);

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch water quality summary' },
    });
  }
});

// Get single water quality reading
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const waterQuality = await waterQualityService.findById(req.params.id);

    if (!waterQuality) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Water quality reading not found' },
      });
      return;
    }

    res.json({ success: true, data: waterQuality });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch water quality reading' },
    });
  }
});

// Create water quality reading
router.post(
  '/',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = createWaterQualitySchema.safeParse(req.body);

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

      const waterQuality = await waterQualityService.create(validation.data, req.user!.id);

      res.status(201).json({ success: true, data: waterQuality });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create water quality reading';
      res.status(400).json({
        success: false,
        error: { code: 'CREATE_FAILED', message },
      });
    }
  }
);

// Update water quality reading
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = updateWaterQualitySchema.safeParse(req.body);

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

      const waterQuality = await waterQualityService.update(req.params.id, validation.data);

      res.json({ success: true, data: waterQuality });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: { code: 'UPDATE_FAILED', message: 'Failed to update water quality reading' },
      });
    }
  }
);

// Delete water quality reading
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await waterQualityService.delete(req.params.id);
      res.json({ success: true, data: { message: 'Water quality reading deleted' } });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: { code: 'DELETE_FAILED', message: 'Failed to delete water quality reading' },
      });
    }
  }
);

export default router;
