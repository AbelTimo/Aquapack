import { Router, Response } from 'express';
import { projectService } from '../services/project.service';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { createProjectSchema, updateProjectSchema } from '@aquapack/shared';
import { UserRole } from '@prisma/client';

const router = Router();

// Get all projects for organization
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, isActive, page, limit, sortBy, sortOrder } = req.query;

    const result = await projectService.findAll(req.user!.organizationId, {
      search: search as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({ success: true, data: result.items, meta: result.meta });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch projects' },
    });
  }
});

// Get projects assigned to current user (for mobile)
router.get('/my-projects', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projects = await projectService.findByUser(req.user!.id);
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch projects' },
    });
  }
});

// Get single project
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const project = await projectService.findById(req.params.id, req.user!.organizationId);

    if (!project) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found' },
      });
      return;
    }

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch project' },
    });
  }
});

// Get project dashboard stats
router.get('/:id/dashboard', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dashboard = await projectService.getDashboard(req.params.id);
    res.json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch dashboard' },
    });
  }
});

// Create project (team lead/admin only)
router.post(
  '/',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = createProjectSchema.safeParse(req.body);

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

      const project = await projectService.create(
        validation.data,
        req.user!.id,
        req.user!.organizationId
      );

      res.status(201).json({ success: true, data: project });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create project';
      res.status(400).json({
        success: false,
        error: { code: 'CREATE_FAILED', message },
      });
    }
  }
);

// Update project
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = updateProjectSchema.safeParse(req.body);

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

      const project = await projectService.update(
        req.params.id,
        validation.data,
        req.user!.organizationId
      );

      res.json({ success: true, data: project });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: { code: 'UPDATE_FAILED', message: 'Failed to update project' },
      });
    }
  }
);

// Delete project
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await projectService.delete(req.params.id, req.user!.organizationId);
      res.json({ success: true, data: { message: 'Project deleted' } });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: { code: 'DELETE_FAILED', message: 'Failed to delete project' },
      });
    }
  }
);

// Assign user to project
router.post(
  '/:id/assign',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, role } = req.body;

      if (!userId || !role) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'userId and role are required' },
        });
        return;
      }

      const assignment = await projectService.assignUser(req.params.id, userId, role);
      res.json({ success: true, data: assignment });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: { code: 'ASSIGN_FAILED', message: 'Failed to assign user' },
      });
    }
  }
);

// Remove user from project
router.delete(
  '/:id/assign/:userId',
  authenticate,
  authorize(UserRole.TEAM_LEAD, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await projectService.removeUser(req.params.id, req.params.userId);
      res.json({ success: true, data: { message: 'User removed from project' } });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: { code: 'REMOVE_FAILED', message: 'Failed to remove user' },
      });
    }
  }
);

export default router;
