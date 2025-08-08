const { body, param } = require('express-validator');

// Basic validators assuming typical fields when Swagger not available
const createOrderValidators = [
  body('orderId').isString().notEmpty(),
  body('customerId').isString().notEmpty(),
  body('orderDetails').isObject(),
];

const sendResultValidators = [
  param('orderId').isString().notEmpty(),
];

module.exports = {
  createOrderValidators,
  sendResultValidators,
};

