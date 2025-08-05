/**
 * Session Routes
 * 
 * Routes for managing user sessions
 * Implements RF038 - Implement distributed session management
 */

const express = require('express');
const router = express.Router();
const sessionController = require('../../controllers/session.controller');
const { requireAuth, requireRole } = require('../../middleware/distributedSession.middleware');

/**
 * @route GET /api/v1/sessions
 * @desc Get all active sessions for the current user
 * @access Private
 */
router.get('/', requireAuth(), sessionController.getUserSessions);

/**
 * @route DELETE /api/v1/sessions/:sessionId
 * @desc Invalidate a specific session
 * @access Private
 */
router.delete('/:sessionId', requireAuth(), sessionController.invalidateSession);

/**
 * @route DELETE /api/v1/sessions
 * @desc Invalidate all other sessions except current
 * @access Private
 */
router.delete('/', requireAuth(), sessionController.invalidateOtherSessions);

/**
 * @route PUT /api/v1/sessions/extend
 * @desc Extend current session duration
 * @access Private
 */
router.put('/extend', requireAuth(), sessionController.extendSession);

/**
 * @route GET /api/v1/sessions/stats
 * @desc Get session statistics
 * @access Admin
 */
router.get('/stats', requireRole('admin'), sessionController.getSessionStats);

/**
 * @route POST /api/v1/sessions/broadcast
 * @desc Broadcast a message to all active sessions
 * @access Admin
 */
router.post('/broadcast', requireRole('admin'), sessionController.broadcastMessage);

module.exports = router; 