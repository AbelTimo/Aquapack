import { Router, Response } from 'express';
import { syncService } from '../services/sync.service';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Push local changes to server
router.post('/push', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { deviceId, entities } = req.body;

    if (!deviceId || !entities || !Array.isArray(entities)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'deviceId and entities array are required',
        },
      });
      return;
    }

    const result = await syncService.push(
      { deviceId, entities },
      req.user!.id,
      req.user!.organizationId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sync data';
    res.status(400).json({
      success: false,
      error: { code: 'SYNC_FAILED', message },
    });
  }
});

// Pull server changes since timestamp
router.post('/pull', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { lastSyncTimestamp, projectIds } = req.body;

    const result = await syncService.pull(
      { lastSyncTimestamp, projectIds },
      req.user!.id,
      req.user!.organizationId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to pull data';
    res.status(500).json({
      success: false,
      error: { code: 'SYNC_FAILED', message },
    });
  }
});

// Resolve sync conflict
router.post('/resolve-conflict', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { entityType, entityId, resolution, mergedData } = req.body;

    if (!entityType || !entityId || !resolution) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'entityType, entityId, and resolution are required',
        },
      });
      return;
    }

    if (!['LOCAL_WINS', 'SERVER_WINS', 'MERGED'].includes(resolution)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'resolution must be LOCAL_WINS, SERVER_WINS, or MERGED',
        },
      });
      return;
    }

    const result = await syncService.resolveConflict(
      { entityType, entityId, resolution, mergedData },
      req.user!.id
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to resolve conflict';
    res.status(400).json({
      success: false,
      error: { code: 'RESOLVE_FAILED', message },
    });
  }
});

export default router;
