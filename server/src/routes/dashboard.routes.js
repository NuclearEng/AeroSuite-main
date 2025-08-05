/**
 * Dashboard Routes
 * 
 * Provides dashboard endpoints
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @route GET /api/dashboard
 * @desc Get dashboard data
 * @access Private
 */
router.get('/', authMiddleware.protect, (req, res) => {
  // Mock implementation
  res.status(200).json({
    success: true,
    data: {
      metrics: {
        totalSuppliers: 120,
        activeInspections: 45,
        pendingApprovals: 12,
        qualityIssues: 8
      },
      recentActivity: [
        {
          id: '1',
          type: 'inspection',
          title: 'Inspection completed',
          message: 'Inspection #12345 was completed successfully',
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          type: 'supplier',
          title: 'New supplier added',
          message: 'Supplier "Aerospace Components Inc." was added',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ]
    }
  });
});

/**
 * @route GET /api/dashboard/metrics
 * @desc Get dashboard metrics
 * @access Private
 */
router.get('/metrics', authMiddleware.protect, (req, res) => {
  // Mock implementation
  res.status(200).json({
    success: true,
    data: {
      totalSuppliers: 120,
      activeInspections: 45,
      pendingApprovals: 12,
      qualityIssues: 8,
      onTimeDelivery: 92.5,
      qualityRating: 87.3
    }
  });
});

/**
 * @route GET /api/dashboard/activity
 * @desc Get recent activity
 * @access Private
 */
router.get('/activity', authMiddleware.protect, (req, res) => {
  // Mock implementation
  res.status(200).json({
    success: true,
    data: [
      {
        id: '1',
        type: 'inspection',
        title: 'Inspection completed',
        message: 'Inspection #12345 was completed successfully',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        type: 'supplier',
        title: 'New supplier added',
        message: 'Supplier "Aerospace Components Inc." was added',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  });
});

module.exports = router; 