const Stripe = require('stripe');
const stripeConfig = require('../config/stripe.config');
const stripe = Stripe(stripeConfig.stripeSecretKey);
const logger = require('../utils/logger');
const Payment = require('../models/Payment');
const mongoose = require('mongoose');

/**
 * Create a Stripe checkout session
 */
exports.createSession = async (req, res) => {
  try {
    const { amount, description, metadata = {}, customerId } = req.body;
    
    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    // Add user information to metadata
    const enhancedMetadata = {
      ...metadata,
      userId: req.user ? req.user._id.toString() : 'guest',
    };
    
    if (customerId) {
      enhancedMetadata.customerId = customerId;
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: stripeConfig.currency,
            product_data: {
              name: description || 'AeroSuite Payment',
            },
            unit_amount: Math.round(amount * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: stripeConfig.successUrl,
      cancel_url: stripeConfig.cancelUrl,
      metadata: enhancedMetadata,
      customer_email: req.user ? req.user.email : undefined,
    });
    
    // Create a pending payment record
    const payment = new Payment({
      amount,
      currency: stripeConfig.currency,
      description,
      status: 'pending',
      sessionId: session.id,
      metadata: enhancedMetadata,
      userId: req.user ? req.user._id : null,
    });
    
    await payment.save();
    
    res.json({ id: session.id, url: session.url });
  } catch (err) {
    logger.error('Stripe session error:', err);
    res.status(500).json({ error: 'Failed to create payment session' });
  }
};

/**
 * Handle Stripe webhooks
 */
exports.handleWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  if (!signature) {
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.rawBody, // Express needs to be configured to provide raw body
      signature,
      stripeConfig.webhookSecret
    );
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      default:
        logger.info(`Unhandled Stripe event type: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (err) {
    logger.error('Stripe webhook error:', err);
    res.status(400).json({ error: 'Webhook error' });
  }
};

/**
 * Get payment history for current user
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const { limit = 10, page = 1, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = { userId: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await Payment.countDocuments(query);
    
    res.json({
      payments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    logger.error('Error fetching payment history:', err);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};

/**
 * Get payment details by ID
 */
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid payment ID' });
    }
    
    const payment = await Payment.findById(id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Check if user has permission to view this payment
    if (payment.userId && payment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    res.json(payment);
  } catch (err) {
    logger.error('Error fetching payment details:', err);
    res.status(500).json({ error: 'Failed to fetch payment details' });
  }
};

/**
 * Create a payment refund
 */
exports.createRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const payment = await Payment.findById(id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    if (payment.status !== 'completed') {
      return res.status(400).json({ error: 'Only completed payments can be refunded' });
    }
    
    if (payment.refunded) {
      return res.status(400).json({ error: 'Payment has already been refunded' });
    }
    
    // Process refund through Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.paymentIntentId,
      reason: reason || 'requested_by_customer'
    });
    
    // Update payment record
    payment.refunded = true;
    payment.refundId = refund.id;
    payment.status = 'refunded';
    payment.updatedAt = new Date();
    
    await payment.save();
    
    res.json(payment);
  } catch (err) {
    logger.error('Error processing refund:', err);
    res.status(500).json({ error: 'Failed to process refund' });
  }
};

// Helper functions for webhook handling

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(session) {
  try {
    // Find the corresponding payment record
    const payment = await Payment.findOne({ sessionId: session.id });
    
    if (!payment) {
      logger.error(`No payment record found for session: ${session.id}`);
      return;
    }
    
    // Update payment status
    payment.status = 'completed';
    payment.paymentIntentId = session.payment_intent;
    payment.updatedAt = new Date();
    
    await payment.save();
    
    logger.info(`Payment ${payment._id} completed successfully`);
  } catch (err) {
    logger.error('Error handling checkout.session.completed:', err);
  }
}

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    // Find the corresponding payment record
    const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
    
    if (!payment) {
      logger.error(`No payment record found for payment intent: ${paymentIntent.id}`);
      return;
    }
    
    // Update payment details
    payment.status = 'completed';
    payment.chargeId = paymentIntent.latest_charge;
    payment.paymentMethod = paymentIntent.payment_method;
    payment.updatedAt = new Date();
    
    await payment.save();
    
    logger.info(`Payment ${payment._id} processed successfully`);
  } catch (err) {
    logger.error('Error handling payment_intent.succeeded:', err);
  }
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentIntentFailed(paymentIntent) {
  try {
    // Find the corresponding payment record
    const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
    
    if (!payment) {
      logger.error(`No payment record found for payment intent: ${paymentIntent.id}`);
      return;
    }
    
    // Update payment status
    payment.status = 'failed';
    payment.failureReason = paymentIntent.last_payment_error?.message || 'Unknown error';
    payment.updatedAt = new Date();
    
    await payment.save();
    
    logger.info(`Payment ${payment._id} failed: ${payment.failureReason}`);
  } catch (err) {
    logger.error('Error handling payment_intent.payment_failed:', err);
  }
} 