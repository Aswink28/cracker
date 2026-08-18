import { Router } from 'express';
import mongoose from 'mongoose';
import productRoutes from './productRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import authRoutes from './authRoutes.js';
import orderEnquiryRoutes from './orderEnquiryRoutes.js';
import uploadRoutes from './uploadRoutes.js';

const router = Router();

/**
 * Liveness/readiness probe. Reports the database state so a failing deploy is
 * obvious from the platform's health check rather than from user reports.
 */
router.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  const healthy = dbState === 1;

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? 'ok' : 'degraded',
    database: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] ?? 'unknown',
    uptime: Math.round(process.uptime()),
  });
});

router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/auth', authRoutes);
router.use('/order-enquiries', orderEnquiryRoutes);
router.use('/uploads', uploadRoutes);

export default router;
