import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import siteRoutes from './site.routes';
import boreholeRoutes from './borehole.routes';
import waterLevelRoutes from './water-level.routes';
import pumpTestRoutes from './pump-test.routes';
import waterQualityRoutes from './water-quality.routes';
import userRoutes from './user.routes';
import syncRoutes from './sync.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    },
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/sites', siteRoutes);
router.use('/boreholes', boreholeRoutes);
router.use('/water-levels', waterLevelRoutes);
router.use('/pump-tests', pumpTestRoutes);
router.use('/water-quality', waterQualityRoutes);
router.use('/users', userRoutes);
router.use('/sync', syncRoutes);

// TODO: Add these routes
// router.use('/media', mediaRoutes);
// router.use('/reports', reportRoutes);

export default router;
