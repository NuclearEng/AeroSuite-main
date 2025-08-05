/**
 * Webhook Middleware
 * 
 * Middleware for handling webhooks from external services
 * Task: TS367 - Payment gateway integration
 */

const logger = require('../utils/logger');

/**
 * Middleware to verify Stripe webhooks
 * This middleware captures the raw body for Stripe webhook verification
 */
exports.verifyStripeWebhook = (req, res, next) => {
  // Stripe needs the raw body to validate the webhook signature
  let rawBody = '';
  
  req.on('data', (chunk) => {
    rawBody += chunk.toString();
  });
  
  req.on('end', () => {
    req.rawBody = rawBody;
    next();
  });
  
  req.on('error', (err) => {
    logger.error('Error capturing raw body for webhook:', err);
    res.status(400).json({ error: 'Webhook error' });
  });
};

/**
 * Generic webhook verification middleware
 * Can be extended for other webhook providers
 */
exports.verifyWebhook = (req, res, next) => {
  const provider = req.params.provider;
  
  switch (provider) {
    case 'stripe':
      return exports.verifyStripeWebhook(req, res, next);
    default:
      logger.error(`Unknown webhook provider: ${provider}`);
      return res.status(400).json({ error: 'Unknown webhook provider' });
  }
}; 