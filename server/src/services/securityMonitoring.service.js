const EventEmitter = require('events');
const { auditLogService } = require('./auditLog.service');
const logger = require('../utils/logger');
const { sendEmail } = require('./email.service');

/**
 * Security monitoring service for real-time threat detection
 */
class SecurityMonitoringService extends EventEmitter {
  constructor() {
    super();
    
    // Threat detection rules
    this.rules = {
      bruteForce: {
        threshold: 5,
        window: 15 * 60 * 1000, // 15 minutes
        attempts: new Map()
      },
      
      suspiciousActivity: {
        patterns: [
          { regex: /\.(php|asp|aspx|jsp|cgi)$/i, score: 10, description: 'Suspicious file extension' },
          { regex: /\.\./g, score: 15, description: 'Path traversal attempt' },
          { regex: /<script/i, score: 20, description: 'Potential XSS attempt' },
          { regex: /union.*select/i, score: 25, description: 'SQL injection attempt' },
          { regex: /etc\/passwd/i, score: 30, description: 'System file access attempt' },
          { regex: /eval\s*\(/i, score: 20, description: 'Code execution attempt' },
          { regex: /base64_decode/i, score: 15, description: 'Encoded payload' }
        ]
      },
      
      anomalousAccess: {
        unusualHours: { start: 0, end: 6 }, // 12 AM - 6 AM
        geolocations: new Map(),
        userAgents: new Map()
      },
      
      dataExfiltration: {
        threshold: 100, // MB
        window: 60 * 60 * 1000, // 1 hour
        downloads: new Map()
      },
      
      privilegeEscalation: {
        roleChanges: new Map(),
        window: 24 * 60 * 60 * 1000 // 24 hours
      }
    };
    
    // Alert thresholds
    this.alertThresholds = {
      low: 30,
      medium: 50,
      high: 70,
      critical: 90
    };
    
    // Alert recipients
    this.alertRecipients = {
      low: [],
      medium: ['security@aerosuite.com'],
      high: ['security@aerosuite.com', 'admin@aerosuite.com'],
      critical: ['security@aerosuite.com', 'admin@aerosuite.com', 'ciso@aerosuite.com']
    };
    
    // Initialize monitoring
    this.setupEventListeners();
    this.startPeriodicChecks();
  }
  
  /**
   * Setup event listeners for security events
   */
  setupEventListeners() {
    // Listen for authentication events
    this.on('auth:failed', this.handleFailedAuth.bind(this));
    this.on('auth:success', this.handleSuccessfulAuth.bind(this));
    
    // Listen for access events
    this.on('access:denied', this.handleAccessDenied.bind(this));
    this.on('access:suspicious', this.handleSuspiciousAccess.bind(this));
    
    // Listen for data events
    this.on('data:download', this.handleDataDownload.bind(this));
    this.on('data:export', this.handleDataExport.bind(this));
    
    // Listen for privilege events
    this.on('privilege:changed', this.handlePrivilegeChange.bind(this));
  }
  
  /**
   * Start periodic security checks
   */
  startPeriodicChecks() {
    // Check for anomalies every 5 minutes
    setInterval(() => {
      this.performAnomalyDetection();
    }, 5 * 60 * 1000);
    
    // Clean up old data every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);
  }
  
  /**
   * Handle failed authentication attempt
   */
  async handleFailedAuth(data) {
    const { userId, email, ip, userAgent, reason } = data;
    const key = email || ip;
    
    // Track failed attempts
    const attempts = this.rules.bruteForce.attempts;
    const userAttempts = attempts.get(key) || [];
    userAttempts.push({
      timestamp: Date.now(),
      ip,
      userAgent,
      reason
    });
    attempts.set(key, userAttempts);
    
    // Check for brute force
    const recentAttempts = userAttempts.filter(
      a => Date.now() - a.timestamp < this.rules.bruteForce.window
    );
    
    if (recentAttempts.length >= this.rules.bruteForce.threshold) {
      await this.createAlert({
        type: 'BRUTE_FORCE',
        severity: 'HIGH',
        title: 'Brute Force Attack Detected',
        description: `Multiple failed login attempts detected for ${email || ip}`,
        details: {
          attempts: recentAttempts.length,
          key,
          ips: [...new Set(recentAttempts.map(a => a.ip))],
          timeWindow: '15 minutes'
        }
      });
      
      // Emit event for other systems to handle
      this.emit('security:bruteforce', { key, attempts: recentAttempts });
    }
  }
  
  /**
   * Handle successful authentication
   */
  async handleSuccessfulAuth(data) {
    const { userId, email, ip, userAgent, location } = data;
    
    // Check for unusual login time
    const hour = new Date().getHours();
    const { start, end } = this.rules.anomalousAccess.unusualHours;
    
    if (hour >= start && hour <= end) {
      await this.createAlert({
        type: 'UNUSUAL_ACCESS_TIME',
        severity: 'MEDIUM',
        title: 'Login at Unusual Hour',
        description: `User ${email} logged in during unusual hours`,
        details: {
          userId,
          email,
          ip,
          time: new Date().toISOString(),
          localHour: hour
        }
      });
    }
    
    // Check for new location
    if (location) {
      const userLocations = this.rules.anomalousAccess.geolocations.get(userId) || new Set();
      const locationKey = `${location.country}:${location.city}`;
      
      if (!userLocations.has(locationKey)) {
        userLocations.add(locationKey);
        this.rules.anomalousAccess.geolocations.set(userId, userLocations);
        
        await this.createAlert({
          type: 'NEW_LOCATION',
          severity: 'MEDIUM',
          title: 'Login from New Location',
          description: `User ${email} logged in from a new location`,
          details: {
            userId,
            email,
            ip,
            location,
            previousLocations: Array.from(userLocations)
          }
        });
      }
    }
    
    // Check for new device/user agent
    const userAgents = this.rules.anomalousAccess.userAgents.get(userId) || new Set();
    if (!userAgents.has(userAgent)) {
      userAgents.add(userAgent);
      this.rules.anomalousAccess.userAgents.set(userId, userAgents);
      
      await this.createAlert({
        type: 'NEW_DEVICE',
        severity: 'LOW',
        title: 'Login from New Device',
        description: `User ${email} logged in from a new device`,
        details: {
          userId,
          email,
          ip,
          userAgent,
          deviceCount: userAgents.size
        }
      });
    }
  }
  
  /**
   * Handle suspicious access patterns
   */
  async handleSuspiciousAccess(data) {
    const { url, method, ip, userAgent, headers } = data;
    let totalScore = 0;
    const detectedPatterns = [];
    
    // Check URL patterns
    for (const pattern of this.rules.suspiciousActivity.patterns) {
      if (pattern.regex.test(url)) {
        totalScore += pattern.score;
        detectedPatterns.push(pattern.description);
      }
    }
    
    // Check headers
    const suspiciousHeaders = ['x-forwarded-host', 'x-original-url', 'x-rewrite-url'];
    for (const header of suspiciousHeaders) {
      if (headers[header]) {
        totalScore += 10;
        detectedPatterns.push(`Suspicious header: ${header}`);
      }
    }
    
    // Check user agent
    if (!userAgent || userAgent.length < 10) {
      totalScore += 10;
      detectedPatterns.push('Missing or invalid user agent');
    }
    
    if (/bot|crawler|spider|scan/i.test(userAgent)) {
      totalScore += 15;
      detectedPatterns.push('Bot/scanner user agent');
    }
    
    // Determine severity
    let severity = 'LOW';
    if (totalScore >= this.alertThresholds.critical) {
      severity = 'CRITICAL';
    } else if (totalScore >= this.alertThresholds.high) {
      severity = 'HIGH';
    } else if (totalScore >= this.alertThresholds.medium) {
      severity = 'MEDIUM';
    }
    
    if (totalScore >= this.alertThresholds.low) {
      await this.createAlert({
        type: 'SUSPICIOUS_ACTIVITY',
        severity,
        title: 'Suspicious Activity Detected',
        description: `Suspicious request patterns detected from ${ip}`,
        details: {
          url,
          method,
          ip,
          userAgent,
          score: totalScore,
          patterns: detectedPatterns
        }
      });
    }
  }
  
  /**
   * Handle data download events
   */
  async handleDataDownload(data) {
    const { userId, fileSize, fileName, ip } = data;
    const key = `${userId}:${ip}`;
    
    // Track downloads
    const downloads = this.rules.dataExfiltration.downloads;
    const userDownloads = downloads.get(key) || [];
    userDownloads.push({
      timestamp: Date.now(),
      fileSize,
      fileName
    });
    downloads.set(key, userDownloads);
    
    // Calculate total size in window
    const recentDownloads = userDownloads.filter(
      d => Date.now() - d.timestamp < this.rules.dataExfiltration.window
    );
    
    const totalSize = recentDownloads.reduce((sum, d) => sum + d.fileSize, 0);
    const totalSizeMB = totalSize / (1024 * 1024);
    
    if (totalSizeMB > this.rules.dataExfiltration.threshold) {
      await this.createAlert({
        type: 'DATA_EXFILTRATION',
        severity: 'HIGH',
        title: 'Possible Data Exfiltration',
        description: `Large amount of data downloaded by user ${userId}`,
        details: {
          userId,
          ip,
          totalSizeMB: totalSizeMB.toFixed(2),
          fileCount: recentDownloads.length,
          files: recentDownloads.map(d => ({
            name: d.fileName,
            sizeMB: (d.fileSize / (1024 * 1024)).toFixed(2)
          })),
          timeWindow: '1 hour'
        }
      });
    }
  }
  
  /**
   * Handle privilege change events
   */
  async handlePrivilegeChange(data) {
    const { userId, oldRole, newRole, changedBy, ip } = data;
    
    // Track role changes
    const roleChanges = this.rules.privilegeEscalation.roleChanges;
    const userChanges = roleChanges.get(userId) || [];
    userChanges.push({
      timestamp: Date.now(),
      oldRole,
      newRole,
      changedBy,
      ip
    });
    roleChanges.set(userId, userChanges);
    
    // Check for rapid privilege changes
    const recentChanges = userChanges.filter(
      c => Date.now() - c.timestamp < this.rules.privilegeEscalation.window
    );
    
    if (recentChanges.length > 2) {
      await this.createAlert({
        type: 'PRIVILEGE_ESCALATION',
        severity: 'HIGH',
        title: 'Unusual Privilege Changes',
        description: `Multiple role changes detected for user ${userId}`,
        details: {
          userId,
          changes: recentChanges,
          currentRole: newRole
        }
      });
    }
    
    // Alert on admin role assignment
    if (newRole === 'admin' && oldRole !== 'admin') {
      await this.createAlert({
        type: 'ADMIN_PRIVILEGE_GRANTED',
        severity: 'MEDIUM',
        title: 'Admin Privileges Granted',
        description: `User ${userId} granted admin privileges`,
        details: {
          userId,
          oldRole,
          newRole,
          changedBy,
          ip
        }
      });
    }
  }
  
  /**
   * Perform anomaly detection
   */
  async performAnomalyDetection() {
    try {
      // Get recent audit logs
      const endDate = new Date();
      const startDate = new Date(endDate - 60 * 60 * 1000); // Last hour
      
      const { logs } = await auditLogService.query({
        startDate,
        endDate,
        success: false
      }, {
        limit: 1000
      });
      
      // Group failures by type and IP
      const failurePatterns = new Map();
      
      for (const log of logs) {
        const key = `${log.eventType}:${log.ipAddress}`;
        const count = failurePatterns.get(key) || 0;
        failurePatterns.set(key, count + 1);
      }
      
      // Check for anomalous failure patterns
      for (const [key, count] of failurePatterns) {
        if (count > 10) {
          const [eventType, ip] = key.split(':');
          await this.createAlert({
            type: 'ANOMALY_DETECTED',
            severity: 'MEDIUM',
            title: 'Anomalous Failure Pattern',
            description: `High number of ${eventType} failures from ${ip}`,
            details: {
              eventType,
              ip,
              count,
              timeWindow: '1 hour'
            }
          });
        }
      }
    } catch (error) {
      logger.error('Error in anomaly detection:', error);
    }
  }
  
  /**
   * Create security alert
   */
  async createAlert(alert) {
    const { type, severity, title, description, details } = alert;
    
    // Log to audit log
    await auditLogService.log({
      eventType: 'SECURITY_ALERT',
      severity,
      action: type,
      description,
      metadata: details,
      success: false
    });
    
    // Log to application logger
    logger.warn('Security Alert', alert);
    
    // Send email alerts based on severity
    const recipients = this.alertRecipients[severity.toLowerCase()] || [];
    if (recipients.length > 0 && process.env.NODE_ENV === 'production') {
      try {
        await sendEmail({
          to: recipients,
          subject: `[${severity}] Security Alert: ${title}`,
          template: 'security-alert',
          data: {
            ...alert,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV
          }
        });
      } catch (error) {
        logger.error('Error sending security alert email:', error);
      }
    }
    
    // Emit event for other systems
    this.emit('security:alert', alert);
    
    return alert;
  }
  
  /**
   * Clean up old tracking data
   */
  cleanupOldData() {
    const now = Date.now();
    
    // Clean brute force attempts
    for (const [key, attempts] of this.rules.bruteForce.attempts) {
      const filtered = attempts.filter(
        a => now - a.timestamp < this.rules.bruteForce.window * 2
      );
      if (filtered.length === 0) {
        this.rules.bruteForce.attempts.delete(key);
      } else {
        this.rules.bruteForce.attempts.set(key, filtered);
      }
    }
    
    // Clean download tracking
    for (const [key, downloads] of this.rules.dataExfiltration.downloads) {
      const filtered = downloads.filter(
        d => now - d.timestamp < this.rules.dataExfiltration.window * 2
      );
      if (filtered.length === 0) {
        this.rules.dataExfiltration.downloads.delete(key);
      } else {
        this.rules.dataExfiltration.downloads.set(key, filtered);
      }
    }
    
    // Clean role changes
    for (const [key, changes] of this.rules.privilegeEscalation.roleChanges) {
      const filtered = changes.filter(
        c => now - c.timestamp < this.rules.privilegeEscalation.window * 2
      );
      if (filtered.length === 0) {
        this.rules.privilegeEscalation.roleChanges.delete(key);
      } else {
        this.rules.privilegeEscalation.roleChanges.set(key, filtered);
      }
    }
  }
  
  /**
   * Get security dashboard data
   */
  async getDashboardData() {
    const endDate = new Date();
    const startDate = new Date(endDate - 24 * 60 * 60 * 1000); // Last 24 hours
    
    // Get audit statistics
    const auditStats = await auditLogService.getStatistics({ startDate, endDate });
    
    // Get active threats
    const activeThreats = [];
    
    // Check brute force attempts
    for (const [key, attempts] of this.rules.bruteForce.attempts) {
      const recentAttempts = attempts.filter(
        a => Date.now() - a.timestamp < this.rules.bruteForce.window
      );
      if (recentAttempts.length >= this.rules.bruteForce.threshold) {
        activeThreats.push({
          type: 'BRUTE_FORCE',
          target: key,
          count: recentAttempts.length,
          severity: 'HIGH'
        });
      }
    }
    
    // Get recent alerts
    const { logs: recentAlerts } = await auditLogService.query({
      eventType: 'SECURITY_ALERT',
      startDate,
      endDate
    }, {
      limit: 10,
      includeMetadata: true
    });
    
    return {
      summary: {
        totalEvents: auditStats.total,
        failedEvents: auditStats.failures,
        criticalAlerts: recentAlerts.filter(a => a.severity === 'CRITICAL').length,
        highAlerts: recentAlerts.filter(a => a.severity === 'HIGH').length,
        activeThreats: activeThreats.length
      },
      eventDistribution: auditStats.eventTypes,
      severityDistribution: auditStats.severities,
      activeThreats,
      recentAlerts: recentAlerts.map(a => ({
        id: a._id,
        timestamp: a.createdAt,
        type: a.action,
        severity: a.severity,
        description: a.description,
        details: a.metadata
      }))
    };
  }
}

// Create singleton instance
const securityMonitoring = new SecurityMonitoringService();

module.exports = securityMonitoring;