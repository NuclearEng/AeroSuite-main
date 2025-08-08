const { validationResult } = require('express-validator');
const VerificationOrder = require('../models/verificationOrder.model');
const VerificationResult = require('../models/verificationResult.model');
const verificationService = require('../services/verification.service');

exports.createVerificationOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const created = await verificationService.createOrder(req.body);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    return next(err);
  }
};

exports.processVerificationOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    // Simple processor stub: echo fields to a result
    const processor = async (orderDetails) => ({
      resultId: `res-${orderId}`,
      orderId,
      status: 'success',
      details: { processed: true, ...orderDetails },
    });
    const result = await verificationService.processOrder(orderId, processor);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
};

exports.listVerificationOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;
    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      VerificationOrder.find(query).sort('-createdAt').skip(skip).limit(Number(limit)).lean(),
      VerificationOrder.countDocuments(query),
    ]);

    return res.json({ success: true, data: items, pagination: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    return next(err);
  }
};

exports.getVerificationOrder = async (req, res, next) => {
  try {
    const item = await VerificationOrder.findOne({ orderId: req.params.orderId }).lean();
    if (!item) return res.status(404).json({ success: false, message: 'Order not found' });
    return res.json({ success: true, data: item });
  } catch (err) {
    return next(err);
  }
};

exports.sendVerificationResult = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const order = await VerificationOrder.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const resultDoc = await VerificationResult.findById(order.resultId);
    if (!resultDoc) return res.status(404).json({ success: false, message: 'Result not found' });

    const endpointPath = process.env.CUSTOMER_VERIFICATION_RESULT_PATH || '/verification/results';
    const outcome = await verificationService.sendResultToCustomer(endpointPath, resultDoc);
    const status = outcome.ok ? 200 : 502;
    return res.status(status).json({ success: outcome.ok, ...(outcome.ok ? { data: outcome.data } : { error: outcome.error?.message }) });
  } catch (err) {
    return next(err);
  }
};

