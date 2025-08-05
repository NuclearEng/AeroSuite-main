/**
 * Session Controller
 * 
 * Controller for managing user sessions
 * Implements RF038 - Implement distributed session management
 */

const { sessionUtils } = require('../middleware/distributedSession.middleware');
const { DomainError } = require('../core/errors');
const logger = require('../utils/logger');

/**
 * Get all active sessions for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function getUserSessions(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userId = req.session.userId;
    const sessions = await sessionUtils.getUserSessions(userId);
    
    // Add current session flag
    const currentSessionId = req.sessionID;
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      loginTime: session.loginTime,
      ipAddress: session.security?.ipAddress,
      userAgent: session.security?.userAgent,
      lastActivity: session.security?.lastActivity,
      isCurrentSession: session.id === currentSessionId
    }));
    
    res.json({
      success: true,
      data: {
        sessions: formattedSessions,
        count: formattedSessions.length
      }
    });
  } catch (error) {
    logger.error('Error getting user sessions:', error);
    next(error);
  }
}

/**
 * Invalidate a specific session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function invalidateSession(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userId = req.session.userId;
    const sessionId = req.params.sessionId;
    const currentSessionId = req.sessionID;
    
    // Get session data to verify ownership
    const sessions = await sessionUtils.getUserSessions(userId);
    const targetSession = sessions.find(session => session.id === sessionId);
    
    if (!targetSession) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Check if trying to invalidate current session
    if (sessionId === currentSessionId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot invalidate current session. Use logout instead.'
      });
    }
    
    // Invalidate the session
    const success = await sessionUtils.invalidateSession(sessionId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Session invalidated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to invalidate session'
      });
    }
  } catch (error) {
    logger.error('Error invalidating session:', error);
    next(error);
  }
}

/**
 * Invalidate all other sessions except current
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function invalidateOtherSessions(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userId = req.session.userId;
    const currentSessionId = req.sessionID;
    
    // Invalidate all other sessions
    const count = await sessionUtils.invalidateOtherSessions(userId, currentSessionId);
    
    res.json({
      success: true,
      message: `${count} session(s) invalidated successfully`,
      data: { count }
    });
  } catch (error) {
    logger.error('Error invalidating other sessions:', error);
    next(error);
  }
}

/**
 * Extend current session duration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function extendSession(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const { duration } = req.body;
    
    // Validate duration
    if (!duration || typeof duration !== 'number' || duration <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid duration is required'
      });
    }
    
    // Limit maximum extension
    const maxDuration = 30 * 24 * 60 * 60; // 30 days in seconds
    const actualDuration = Math.min(duration, maxDuration);
    
    // Extend session
    const success = await sessionUtils.extendSession(req, actualDuration);
    
    if (success) {
      res.json({
        success: true,
        message: 'Session extended successfully',
        data: {
          expiresIn: actualDuration,
          expiresAt: new Date(Date.now() + actualDuration * 1000).toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to extend session'
      });
    }
  } catch (error) {
    logger.error('Error extending session:', error);
    next(error);
  }
}

/**
 * Get session statistics (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function getSessionStats(req, res, next) {
  try {
    // Check if user is admin
    if (!req.session || !req.session.userId || req.session.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const stats = await sessionUtils.getSessionStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting session stats:', error);
    next(error);
  }
}

/**
 * Broadcast a message to all active sessions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function broadcastMessage(req, res, next) {
  try {
    // Check if user is admin
    if (!req.session || !req.session.userId || req.session.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { type, payload } = req.body;
    
    if (!type || !payload) {
      return res.status(400).json({
        success: false,
        message: 'Message type and payload are required'
      });
    }
    
    // Broadcast message
    await sessionUtils.broadcast(type, payload);
    
    res.json({
      success: true,
      message: 'Message broadcast successfully'
    });
  } catch (error) {
    logger.error('Error broadcasting message:', error);
    next(error);
  }
}

module.exports = {
  getUserSessions,
  invalidateSession,
  invalidateOtherSessions,
  extendSession,
  getSessionStats,
  broadcastMessage
}; 