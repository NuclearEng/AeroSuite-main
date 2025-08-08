const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const controller = require('../../controllers/verification.controller');
const { createOrderValidators, sendResultValidators } = require('../../middleware/validators/verification.validator');

// Optionally secure; skip in tests when SKIP_AUTH_FOR_TESTS or NODE_ENV==='test'
if (!(process.env.SKIP_AUTH_FOR_TESTS === 'true' || process.env.NODE_ENV === 'test')) {
  router.use(protect);
  router.use(requirePermission('write:verifications'));
}

// POST /api/v2/verification/orders - customer posts verification orders
router.post('/orders', createOrderValidators, controller.createVerificationOrder);

// GET /api/v2/verification/orders - list orders
router.get('/orders', controller.listVerificationOrders);

// GET /api/v2/verification/orders/:orderId - get one order
router.get('/orders/:orderId', controller.getVerificationOrder);

// POST /api/v2/verification/orders/:orderId/process - process order -> creates result
router.post('/orders/:orderId/process', controller.processVerificationOrder);

// POST /api/v2/verification/orders/:orderId/send-result - send result to customer
router.post('/orders/:orderId/send-result', sendResultValidators, controller.sendVerificationResult);

module.exports = router;

