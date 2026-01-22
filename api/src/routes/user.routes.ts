import { Router, Response } from 'express';
import { userService } from '../services/user.service';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const router = Router();

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

const inviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.nativeEnum(UserRole),
});

const changeRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

// Get all users in organization
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await userService.findByOrganization(req.user!.organizationId);

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch users' },
    });
  }
});

// Get single user
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await userService.findById(req.params.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch user' },
    });
  }
});

// Update user
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = updateUserSchema.safeParse(req.body);

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

      const user = await userService.updateUser(req.params.id, validation.data);

      res.json({ success: true, data: user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      res.status(400).json({
        success: false,
        error: { code: 'UPDATE_FAILED', message },
      });
    }
  }
);

// Deactivate user
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Don't allow deactivating yourself
      if (req.params.id === req.user!.id) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_OPERATION', message: 'Cannot deactivate your own account' },
        });
        return;
      }

      const user = await userService.deactivateUser(req.params.id);

      res.json({ success: true, data: user });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: { code: 'DELETE_FAILED', message: 'Failed to deactivate user' },
      });
    }
  }
);

// Invite user
router.post(
  '/invite',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = inviteUserSchema.safeParse(req.body);

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

      const result = await userService.inviteUser(
        validation.data,
        req.user!.organizationId,
        req.user!.id
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to invite user';
      res.status(400).json({
        success: false,
        error: { code: 'INVITE_FAILED', message },
      });
    }
  }
);

// Change user role
router.put(
  '/:id/role',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Don't allow changing your own role
      if (req.params.id === req.user!.id) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_OPERATION', message: 'Cannot change your own role' },
        });
        return;
      }

      const validation = changeRoleSchema.safeParse(req.body);

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

      const user = await userService.changeRole(req.params.id, validation.data.role);

      res.json({ success: true, data: user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change user role';
      res.status(400).json({
        success: false,
        error: { code: 'UPDATE_FAILED', message },
      });
    }
  }
);

export default router;
