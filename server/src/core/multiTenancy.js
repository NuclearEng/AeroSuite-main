/**
 * Multi-tenant Data Isolation Core
 * Task: SaaS002 - Multi-tenant Data Isolation Core
 * 
 * This module provides the core functionality for ensuring data isolation
 * between different tenants in the multi-tenant architecture.
 */

const { logSecurityEvent, SEC_EVENT_SEVERITY } = require('../utils/securityEventLogger');

// Tenant context management
const TENANT_CONTEXT = new Map();

// Current tenant context (thread-local storage would be better in production)
let currentTenantId = null;

/**
 * Set the current tenant context for the request
 * @param {string} tenantId - Tenant identifier
 * @param {Object} tenantInfo - Additional tenant information
 */
function setTenantContext(tenantId, tenantInfo = {}) {
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  currentTenantId = tenantId;
  
  // Store tenant info if not already present
  if (!TENANT_CONTEXT.has(tenantId)) {
    TENANT_CONTEXT.set(tenantId, {
      ...tenantInfo,
      createdAt: new Date().toISOString()
    });

    // Log tenant context creation for security audit
    logSecurityEvent(
      'DATA_ACCESS',
      SEC_EVENT_SEVERITY.MEDIUM,
      `New tenant context created: ${tenantId}`,
      { tenantId, action: 'CREATE_TENANT_CONTEXT' }
    );
  }

  // Log tenant context switch for security audit
  logSecurityEvent(
    'DATA_ACCESS',
    SEC_EVENT_SEVERITY.INFO,
    `Tenant context switched: ${tenantId}`,
    { tenantId, action: 'SET_TENANT_CONTEXT' }
  );
}

/**
 * Get the current tenant ID
 * @returns {string|null} Current tenant ID or null if not set
 */
function getCurrentTenantId() {
  return currentTenantId;
}

/**
 * Clear the current tenant context
 */
function clearTenantContext() {
  const previousTenantId = currentTenantId;
  currentTenantId = null;

  if (previousTenantId) {
    // Log tenant context clear for security audit
    logSecurityEvent(
      'DATA_ACCESS',
      SEC_EVENT_SEVERITY.INFO,
      `Tenant context cleared: ${previousTenantId}`,
      { tenantId: previousTenantId, action: 'CLEAR_TENANT_CONTEXT' }
    );
  }
}

/**
 * Get tenant information by ID
 * @param {string} tenantId - Tenant identifier
 * @returns {Object|null} Tenant information or null if not found
 */
function getTenantInfo(tenantId) {
  return TENANT_CONTEXT.get(tenantId) || null;
}

/**
 * Apply tenant isolation to a database query
 * @param {Object} query - Database query object
 * @returns {Object} Modified query with tenant isolation
 */
function applyTenantIsolation(query) {
  const tenantId = getCurrentTenantId();
  
  if (!tenantId) {
    throw new Error('No tenant context set for database operation');
  }

  // Add tenant filter to query
  // This implementation is generic and would need to be adapted for specific ORMs
  const tenantFilter = { tenantId };
  
  if (typeof query === 'object' && query !== null) {
    return {
      ...query,
      ...tenantFilter
    };
  }
  
  return query;
}

/**
 * Verify that data belongs to the current tenant
 * @param {Object} data - Data object to verify
 * @returns {boolean} Whether the data belongs to the current tenant
 */
function verifyTenantData(data) {
  const tenantId = getCurrentTenantId();
  
  if (!tenantId) {
    throw new Error('No tenant context set for data verification');
  }

  // Check if data has tenantId and it matches current tenant
  if (!data || !data.tenantId || data.tenantId !== tenantId) {
    // Log security event for tenant isolation violation
    logSecurityEvent(
      'DATA_ACCESS',
      SEC_EVENT_SEVERITY.HIGH,
      'Tenant isolation violation detected',
      { 
        tenantId, 
        dataId: data.id || 'unknown',
        dataTenantId: data.tenantId || 'missing',
        action: 'TENANT_ISOLATION_VIOLATION'
      }
    );
    
    return false;
  }
  
  return true;
}

/**
 * Create a middleware for setting tenant context from request
 * @param {Function} tenantExtractor - Function to extract tenant ID from request
 * @returns {Function} Express middleware
 */
function tenantMiddleware(tenantExtractor) {
  return (req, res, next) => {
    try {
      // Clear any existing tenant context
      clearTenantContext();
      
      // Extract tenant ID using the provided function
      const tenantId = tenantExtractor(req);
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID not found in request' });
      }
      
      // Set tenant context
      setTenantContext(tenantId, { 
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.headers['x-request-id'] || `req_${Date.now()}`
      });
      
      // Add cleanup after request is complete
      res.on('finish', () => {
        clearTenantContext();
      });
      
      next();
    } catch (error) {
      console.error('Error in tenant middleware:', error);
      clearTenantContext();
      res.status(500).json({ error: 'Failed to set tenant context' });
    }
  };
}

/**
 * Common tenant ID extractors for different authentication schemes
 */
const tenantExtractors = {
  /**
   * Extract tenant ID from JWT token
   */
  fromJwt: (req) => {
    // In a real implementation, this would parse the JWT token
    // and extract the tenant ID from the payload
    return req.user && req.user.tenantId ? req.user.tenantId : null;
  },
  
  /**
   * Extract tenant ID from request header
   */
  fromHeader: (headerName) => {
    return (req) => req.headers[headerName.toLowerCase()];
  },
  
  /**
   * Extract tenant ID from request parameter
   */
  fromParam: (paramName) => {
    return (req) => req.params[paramName];
  },
  
  /**
   * Extract tenant ID from subdomain
   */
  fromSubdomain: (req) => {
    const host = req.headers.host || '';
    const subdomain = host.split('.')[0];
    return subdomain || null;
  }
};

/**
 * Middleware that enforces tenant isolation for all routes
 */
const enforceTenantIsolation = (req, res, next) => {
  const tenantId = getCurrentTenantId();
  
  if (!tenantId) {
    return res.status(400).json({ error: 'No tenant context available' });
  }
  
  // Add tenant ID to response headers for debugging
  res.set('X-Tenant-ID', tenantId);
  
  next();
};

module.exports = {
  setTenantContext,
  getCurrentTenantId,
  clearTenantContext,
  getTenantInfo,
  applyTenantIsolation,
  verifyTenantData,
  tenantMiddleware,
  tenantExtractors,
  enforceTenantIsolation
}; 