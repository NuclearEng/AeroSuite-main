/**
 * InspectionController.test.js
 *
 * Unit and integration tests for InspectionController
 * Implements RF079 (Controller unit tests) and RF080 (API endpoint tests)
 */

const request = require('supertest');
const express = require('express');
const InspectionController = require('./InspectionController');
const InspectionServiceInterface = require('../interfaces/InspectionServiceInterface');

jest.mock('../interfaces/InspectionServiceInterface');

const app = express();
app.use(express.json());

// Register routes for testing
app.get('/inspections/:id', InspectionController.getInspectionById);
app.get('/inspections', InspectionController.getAllInspections);
app.post('/inspections', InspectionController.createInspection);
app.put('/inspections/:id', InspectionController.updateInspection);
app.delete('/inspections/:id', InspectionController.deleteInspection);
app.post('/inspections/:id/findings', InspectionController.addFinding);
app.put('/inspections/:id/findings/:findingId', InspectionController.updateFinding);
app.delete('/inspections/:id/findings/:findingId', InspectionController.removeFinding);
app.get('/inspections/search', InspectionController.searchInspections);

// ...tests for each endpoint, mocking service layer, checking responses, errors, and edge cases... 