import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import siteRoutes from './site.routes';

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

// TODO: Add these routes
// router.use('/boreholes', boreholeRoutes);
// router.use('/water-levels', waterLevelRoutes);
// router.use('/pump-tests', pumpTestRoutes);
// router.use('/water-quality', waterQualityRoutes);
// router.use('/media', mediaRoutes);
// router.use('/reports', reportRoutes);
// router.use('/sync', syncRoutes);

export default router;
