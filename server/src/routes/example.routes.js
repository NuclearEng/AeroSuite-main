/**
 * Example Routes
 * 
 * This file defines routes for the example controller,
 * demonstrating consistent error handling across API endpoints.
 * 
 * Implements RF020 - Implement consistent error handling in APIs
 */

const express = require('express');
const router = express.Router();
const exampleController = require('../controllers/example.controller');
const { validateRequest } = require('../utils/apiContract');
const { check } = require('express-validator');

// Validation middleware for create/update operations
const validateExample = [
  check('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters'),
  check('status')
    .optional()
    .isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  validateRequest
];

// Get all examples with pagination
router.get('/', exampleController.getAll);

// Get example by ID
router.get('/:id', exampleController.getById);

// Create a new example
router.post('/', validateExample, exampleController.create);

// Update an example
router.put('/:id', validateExample, exampleController.update);

// Delete an example
router.delete('/:id', exampleController.delete);

// Custom action endpoint
router.post('/custom-action', exampleController.customAction);

// Secured action endpoint
router.post('/secured-action', exampleController.securedAction);

// Error demonstration endpoints
router.get('/error-demo/:errorType', exampleController.errorDemo);

module.exports = router; 