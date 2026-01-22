import { Router, Response } from 'express';
import { boreholeService } from '../services/borehole.service';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { createBoreholeSchema, updateBoreholeSchema } from '@aquapack/shared';
import { UserRole, QAStatus } from '@prisma/client';

const router = Router();

// Get all boreholes with filters
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { siteId, qaStatus, search, page, limit, sortBy, sortOrder } = req.query;

    const result = await boreholeService.findAll(req.user!.organizationId, {
      siteId: siteId as string,
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
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch boreholes' },
    });
  }
});

// Get single borehole
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const borehole = await boreholeService.findById(req.params.id);

    if (!borehole) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Borehole not found' },
      });
      return;
    }

    res.json({ success: true, data: borehole });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch borehole' },
    });
  }
});

// Create borehole
router.post(
  '/',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = createBoreholeSchema.safeParse(req.body);

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

      const borehole = await boreholeService.create(validation.data, req.user!.id);

      res.status(201).json({ success: true, data: borehole });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create borehole';
      res.status(400).json({
        success: false,
        error: { code: 'CREATE_FAILED', message },
      });
    }
  }
);

// Update borehole
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = updateBoreholeSchema.safeParse(req.body);

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

      const borehole = await boreholeService.update(req.params.id, validation.data);

      res.json({ success: true, data: borehole });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: { code: 'UPDATE_FAILED', message: 'Failed to update borehole' },
      });
    }
  }
);

// Delete borehole
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await boreholeService.delete(req.params.id);
      res.json({ success: true, data: { message: 'Borehole deleted' } });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: { code: 'DELETE_FAILED', message: 'Failed to delete borehole' },
      });
    }
  }
);

// QA status update
router.post(
  '/:id/review',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, comment } = req.body;

      if (!status || !Object.values(QAStatus).includes(status)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Valid status is required' },
        });
        return;
      }

      const result = await boreholeService.updateQAStatus(
        req.params.id,
        status as QAStatus,
        req.user!.id,
        comment
      );

      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: { code: 'REVIEW_FAILED', message: 'Failed to update QA status' },
      });
    }
  }
);

export default router;
