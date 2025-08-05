/**
 * Payment Routes
 * 
 * API routes for payment functionality
 * Task: TS367 - Payment gateway integration
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/payment.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const { body } = require('express-validator');
const webhookMiddleware = require('../../middleware/webhookMiddleware');

// Create Stripe Checkout session
router.post('/create-session', 
  authMiddleware,
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('description').optional().isString().withMessage('Description must be a string')
  ],
  paymentController.createSession
);

// Stripe webhook endpoint - no auth required, uses webhook secret
router.post('/webhook', 
  webhookMiddleware.verifyStripeWebhook, 
  paymentController.handleWebhook
);

// Get payment history - requires authentication
router.get('/history', 
  authMiddleware, 
  paymentController.getPaymentHistory
);

// Get payment details by ID - requires authentication
router.get('/:id', 
  authMiddleware, 
  paymentController.getPaymentById
);

// Create a refund - requires authentication
router.post('/:id/refund', 
  authMiddleware, 
  paymentController.createRefund
);

module.exports = router; 