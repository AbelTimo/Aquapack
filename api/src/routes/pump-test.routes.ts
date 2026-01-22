import { Router, Response } from 'express';
import { pumpTestService } from '../services/pump-test.service';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import {
  createPumpTestSchema,
  updatePumpTestSchema,
  createPumpTestEntrySchema,
} from '@aquapack/shared';
import { UserRole } from '@prisma/client';

const router = Router();

// Get all pump tests with filters
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { siteId, boreholeId, testType, page, limit, sortBy, sortOrder } = req.query;

    const result = await pumpTestService.findAll(req.user!.organizationId, {
      siteId: siteId as string,
      boreholeId: boreholeId as string,
      testType: testType as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({ success: true, data: result.items, meta: result.meta });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch pump tests' },
    });
  }
});

// Get single pump test with entries and steps
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pumpTest = await pumpTestService.findById(req.params.id);

    if (!pumpTest) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Pump test not found' },
      });
      return;
    }

    res.json({ success: true, data: pumpTest });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch pump test' },
    });
  }
});

// Create pump test
router.post(
  '/',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = createPumpTestSchema.safeParse(req.body);

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

      const pumpTest = await pumpTestService.create(validation.data, req.user!.id);

      res.status(201).json({ success: true, data: pumpTest });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create pump test';
      res.status(400).json({
        success: false,
        error: { code: 'CREATE_FAILED', message },
      });
    }
  }
);

// Update pump test
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = updatePumpTestSchema.safeParse(req.body);

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

      const pumpTest = await pumpTestService.update(req.params.id, validation.data);

      res.json({ success: true, data: pumpTest });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: { code: 'UPDATE_FAILED', message: 'Failed to update pump test' },
      });
    }
  }
);

// Delete pump test (cascade entries)
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await pumpTestService.delete(req.params.id);
      res.json({ success: true, data: { message: 'Pump test deleted' } });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: { code: 'DELETE_FAILED', message: 'Failed to delete pump test' },
      });
    }
  }
);

// Add pump test entry
router.post(
  '/:id/entries',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const entryData = {
        ...req.body,
        pumpTestId: req.params.id,
      };

      const validation = createPumpTestEntrySchema.safeParse(entryData);

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

      const entry = await pumpTestService.addEntry(validation.data);

      res.status(201).json({ success: true, data: entry });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add pump test entry';
      res.status(400).json({
        success: false,
        error: { code: 'CREATE_FAILED', message },
      });
    }
  }
);

// Update pump test entry
router.put(
  '/:id/entries/:entryId',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const entry = await pumpTestService.updateEntry(req.params.entryId, req.body);

      res.json({ success: true, data: entry });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: { code: 'UPDATE_FAILED', message: 'Failed to update pump test entry' },
      });
    }
  }
);

// Delete pump test entry
router.delete(
  '/:id/entries/:entryId',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await pumpTestService.deleteEntry(req.params.entryId);
      res.json({ success: true, data: { message: 'Pump test entry deleted' } });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: { code: 'DELETE_FAILED', message: 'Failed to delete pump test entry' },
      });
    }
  }
);

export default router;
