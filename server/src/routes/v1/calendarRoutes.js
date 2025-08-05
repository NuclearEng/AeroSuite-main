/**
 * Calendar Routes
 * 
 * API routes for calendar functionality
 * Task: TS366 - Calendar integration implementation
 */

const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const calendarController = require('../../controllers/calendarController');
const authMiddleware = require('../../middleware/authMiddleware');

// Apply authentication middleware to all calendar routes
router.use(authMiddleware);

// Get calendar events
router.get('/events', calendarController.getEvents);

// Create a new calendar event
router.post('/events', [
  check('title').notEmpty().withMessage('Title is required'),
  check('start').notEmpty().withMessage('Start date is required'),
  check('type').isIn(['inspection', 'audit', 'meeting', 'deadline', 'reminder', 'other'])
    .withMessage('Invalid event type')
], calendarController.createEvent);

// Update a calendar event
router.put('/events/:id', [
  check('title').optional().notEmpty().withMessage('Title cannot be empty'),
  check('type').optional().isIn(['inspection', 'audit', 'meeting', 'deadline', 'reminder', 'other'])
    .withMessage('Invalid event type')
], calendarController.updateEvent);

// Delete a calendar event
router.delete('/events/:id', calendarController.deleteEvent);

// Get calendar integrations
router.get('/integrations', calendarController.getIntegrations);

// Connect to Google Calendar
router.post('/integrations/google/connect', calendarController.connectGoogle);

// Connect to Microsoft Outlook
router.post('/integrations/outlook/connect', calendarController.connectOutlook);

// Disconnect from a calendar
router.post('/integrations/:type/disconnect', calendarController.disconnectCalendar);

// Sync calendars
router.post('/sync', calendarController.syncCalendars);

module.exports = router; 