/**
 * Audit Logging Controller
 * 
 * API endpoints for audit logging operations including:
 * - Viewing audit logs
 * - Searching audit logs
 * - Exporting audit logs
 */

const auditLoggingService = require('../services/audit-logging.service');
const { logSecurityEvent, SEC_EVENT_SEVERITY } = require('../utils/securityEventLogger');
const { NotFoundError, UnauthorizedError, BadRequestError } = require('../utils/errorHandler');
const mongoose = require('mongoose');

/**
 * Get audit logs with filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function getAuditLogs(req, res, next) {
  try {
    const {
      entity,
      entityId,
      userId,
      action,
      from,
      to,
      sensitive,
      limit = 100,
      skip = 0,
      sort = -1,
      sanitize = true
    } = req.query;
    
    let logs = [];
    
    // Log this access as a sensitive operation
    await auditLoggingService.logFromRequest(req, {
      action: 'AUDIT_LOGS_ACCESSED',
      entity: 'AuditLog',
      description: `Audit logs accessed by ${req.user.username || req.user.email}`,
      sensitive: true,
      severity: 'medium',
      metadata: { query: req.query }
    });
    
    // Get logs based on the query parameters
    if (entity && entityId) {
      // Get logs for a specific entity
      logs = await auditLoggingService.getEntityAuditLogs(entity, entityId, {
        action,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
        sensitive: sensitive === 'true',
        limit: parseInt(limit),
        skip: parseInt(skip),
        sort: parseInt(sort),
        sanitize: sanitize === 'true'
      });
    } else if (userId) {
      // Get logs for a specific user
      logs = await auditLoggingService.getUserAuditLogs(userId, {
        action,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
        sensitive: sensitive === 'true',
        limit: parseInt(limit),
        skip: parseInt(skip),
        sort: parseInt(sort),
        sanitize: sanitize === 'true'
      });
    } else if (sensitive === 'true') {
      // Get sensitive operation logs
      logs = await auditLoggingService.getSensitiveOperationLogs({
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
        limit: parseInt(limit)
      });
    } else {
      // Get all logs with basic filtering
      const AuditLog = mongoose.model('AuditLog');
      const query = {};
      
      if (action) query.action = action;
      if (from) query.timestamp = { $gte: new Date(from) };
      if (to) query.timestamp = { ...query.timestamp, $lte: new Date(to) };
      if (sensitive !== undefined) query.sensitive = sensitive === 'true';
      
      logs = await AuditLog.find(query)
        .sort({ timestamp: parseInt(sort) })
        .limit(parseInt(limit))
        .skip(parseInt(skip));
      
      if (sanitize === 'true') {
        logs = logs.map(log => log.sanitize());
      }
    }
    
    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get audit log by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function getAuditLogById(req, res, next) {
  try {
    const { id } = req.params;
    const { sanitize = true } = req.query;
    
    const AuditLog = mongoose.model('AuditLog');
    const log = await AuditLog.findById(id);
    
    if (!log) {
      throw new NotFoundError(`Audit log with ID ${id} not found`);
    }
    
    // Log this access as a sensitive operation
    await auditLoggingService.logFromRequest(req, {
      action: 'AUDIT_LOG_ACCESSED',
      entity: 'AuditLog',
      entityId: log._id,
      description: `Audit log ${id} accessed by ${req.user.username || req.user.email}`,
      sensitive: true,
      severity: 'medium'
    });
    
    res.status(200).json({
      success: true,
      data: sanitize === 'true' ? log.sanitize() : log
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Export audit logs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function exportAuditLogs(req, res, next) {
  try {
    const {
      entity,
      entityId,
      userId,
      action,
      from,
      to,
      sensitive,
      format = 'json'
    } = req.body;
    
    // Log this export as a sensitive operation
    await auditLoggingService.logFromRequest(req, {
      action: 'AUDIT_LOGS_EXPORTED',
      entity: 'AuditLog',
      description: `Audit logs exported by ${req.user.username || req.user.email}`,
      sensitive: true,
      severity: 'high',
      metadata: { query: req.body }
    });
    
    let logs = [];
    
    // Get logs based on the query parameters
    if (entity && entityId) {
      // Get logs for a specific entity
      logs = await auditLoggingService.getEntityAuditLogs(entity, entityId, {
        action,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
        sensitive: sensitive === true,
        limit: 1000, // Higher limit for exports
        sanitize: true
      });
    } else if (userId) {
      // Get logs for a specific user
      logs = await auditLoggingService.getUserAuditLogs(userId, {
        action,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
        sensitive: sensitive === true,
        limit: 1000, // Higher limit for exports
        sanitize: true
      });
    } else {
      // Get all logs with basic filtering
      const AuditLog = mongoose.model('AuditLog');
      const query = {};
      
      if (action) query.action = action;
      if (from) query.timestamp = { $gte: new Date(from) };
      if (to) query.timestamp = { ...query.timestamp, $lte: new Date(to) };
      if (sensitive !== undefined) query.sensitive = sensitive === true;
      
      logs = await AuditLog.find(query)
        .sort({ timestamp: -1 })
        .limit(1000); // Higher limit for exports
      
      logs = logs.map(log => log.sanitize());
    }
    
    // Format the logs based on the requested format
    if (format === 'csv') {
      // Convert logs to CSV format
      const fields = [
        'timestamp',
        'action',
        'entity',
        'entityId',
        'status',
        'description',
        'severity',
        'sensitive',
        'user.username',
        'user.role',
        'metadata.ip',
        'metadata.userAgent',
        'metadata.requestId'
      ];
      
      const csv = [
        fields.join(','),
        ...logs.map(log => {
          return fields.map(field => {
            const value = field.includes('.')
              ? field.split('.').reduce((obj, key) => obj && obj[key], log)
              : log[field];
            
            if (value === undefined || value === null) return '';
            if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
            return String(value).replace(/"/g, '""');
          }).join(',');
        })
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString()}.csv"`);
      return res.send(csv);
    } else {
      // Return JSON format
      res.status(200).json({
        success: true,
        count: logs.length,
        data: logs
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Get audit statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function getAuditStatistics(req, res, next) {
  try {
    const { from, to } = req.query;
    
    const AuditLog = mongoose.model('AuditLog');
    
    const query = {};
    if (from) query.timestamp = { $gte: new Date(from) };
    if (to) query.timestamp = { ...query.timestamp, $lte: new Date(to) };
    
    // Get count of all logs
    const totalCount = await AuditLog.countDocuments(query);
    
    // Get count of sensitive logs
    const sensitiveCount = await AuditLog.countDocuments({
      ...query,
      sensitive: true
    });
    
    // Get count by severity
    const severityCounts = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);
    
    // Get count by action (top 10)
    const actionCounts = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get count by entity (top 10)
    const entityCounts = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$entity', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get count by user (top 10)
    const userCounts = await AuditLog.aggregate([
      { $match: { ...query, 'user.id': { $exists: true } } },
      { $group: { _id: { id: '$user.id', username: '$user.username' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalCount,
        sensitiveCount,
        severityCounts: severityCounts.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
        actionCounts: actionCounts.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
        entityCounts: entityCounts.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
        userCounts: userCounts.map(item => ({
          id: item._id.id,
          username: item._id.username,
          count: item.count
        }))
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAuditLogs,
  getAuditLogById,
  exportAuditLogs,
  getAuditStatistics
}; 