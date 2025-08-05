import express from 'express';
import supplierRoutes from './supplierRoutes';
import customerRoutes from './customerRoutes';
import inspectionRoutes from './inspectionRoutes';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import reportRoutes from './reportRoutes';
import imageRoutes from './imageRoutes';
import batchRoutes from './batchRoutes';
import oauthRoutes from './oauth.routes';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Register route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/customers', customerRoutes);
router.use('/inspections', inspectionRoutes);
router.use('/reports', reportRoutes);
router.use('/images', imageRoutes);
router.use('/batch', batchRoutes);
router.use('/auth/sso', oauthRoutes);

export default router; 