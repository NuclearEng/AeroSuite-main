/**
 * Monitoring Routes
 * 
 * Provides monitoring endpoints for health checks, metrics, and error logging
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { metricsRouter } = require('../monitoring/metrics');
const logger = require('../utils/logger');
const router = express.Router();

/**
 * @route   GET /api/monitoring/health
 * @desc    Get system health
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   POST /api/monitoring/errors
 * @desc    Log client-side errors
 * @access  Public (rate-limited)
 */
router.post('/errors', [
  body('errors').isArray(),
  body('errors.*.message').isString(),
  body('errors.*.timestamp').isString(),
  body('errors.*.url').isString(),
  body('errors.*.userAgent').isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { errors: clientErrors } = req.body;
    
    // Get user information if available
    const userId = req.user ? req.user.id : undefined;
    
    // Process each error
    for (const error of clientErrors) {
      // Add user ID if available and not already present
      if (userId && !error.userId) {
        error.userId = userId;
      }
      
      // Add server timestamp
      error.serverTimestamp = new Date().toISOString();
      
      // Add request information
      error.ip = req.ip;
      error.headers = {
        referer: req.headers.referer,
        origin: req.headers.origin
      };
      
      // Log the error
      logger.error('Client-side error:', {
        ...error,
        source: 'client'
      });
      
      // Here you would typically store the error in a database
      // or send it to an external error tracking service
      // Example: await ErrorModel.create(error);
    }
    
    // Return success
    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error('Error processing client errors:', err);
    return res.status(500).json({ message: 'Error processing client errors' });
  }
});

/**
 * @route   POST /api/monitoring/events
 * @desc    Log user analytics events
 * @access  Public (rate-limited)
 */
router.post('/events', [
  body('events').isArray(),
  body('events.*.category').isString(),
  body('events.*.action').isString(),
  body('events.*.timestamp').isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { events } = req.body;
    
    // Get user information if available
    const userId = req.user ? req.user.id : undefined;
    const sessionId = req.cookies.sessionId || req.headers['x-session-id'];
    
    // Process each event
    for (const event of events) {
      // Add user ID if available and not already present
      if (userId && !event.userId) {
        event.userId = userId;
      }
      
      // Add session ID if available and not already present
      if (sessionId && !event.sessionId) {
        event.sessionId = sessionId;
      }
      
      // Add server timestamp
      event.serverTimestamp = new Date().toISOString();
      
      // Add request information
      event.ip = req.ip;
      event.userAgent = req.headers['user-agent'];
      event.referrer = req.headers.referer;
      
      // Log the event
      logger.info('User event:', {
        ...event,
        source: 'client'
      });
      
      // Here you would typically store the event in a database
      // or send it to an analytics service
      // Example: await AnalyticsEvent.create(event);
    }
    
    // Return success
    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error('Error processing user events:', err);
    return res.status(500).json({ message: 'Error processing user events' });
  }
});

/**
 * @route   GET /api/monitoring/user-analytics
 * @desc    Get user analytics data
 * @access  Private (admin only)
 */
router.get('/user-analytics', async (req, res) => {
  try {
    // Check if user has admin role
    if (!req.user || !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const period = req.query.period || '7d';
    
    // In a real implementation, this would fetch data from a database
    // For now, return mock data
    const mockData = {
      totalUsers: 1245,
      activeUsers: {
        daily: 432,
        weekly: 876,
        monthly: 1032
      },
      pageViews: {
        total: 15678,
        unique: 8765
      },
      topPages: [
        { path: '/dashboard', views: 3245 },
        { path: '/suppliers', views: 1876 },
        { path: '/customers', views: 1543 },
        { path: '/inspections', views: 1432 },
        { path: '/reports', views: 987 }
      ],
      userEngagement: {
        avgSessionDuration: 340, // seconds
        avgPagesPerSession: 4.5,
        bounceRate: 0.32
      },
      userRetention: {
        daily: 0.45,
        weekly: 0.65,
        monthly: 0.78
      },
      userGrowth: [
        { date: '2023-01-01', users: 980 },
        { date: '2023-02-01', users: 1050 },
        { date: '2023-03-01', users: 1120 },
        { date: '2023-04-01', users: 1180 },
        { date: '2023-05-01', users: 1245 }
      ]
    };
    
    res.status(200).json(mockData);
  } catch (err) {
    logger.error('Error fetching user analytics:', err);
    res.status(500).json({ message: 'Error fetching user analytics' });
  }
});

/**
 * @route   GET /api/monitoring/event-analytics
 * @desc    Get event analytics data
 * @access  Private (admin only)
 */
router.get('/event-analytics', async (req, res) => {
  try {
    // Check if user has admin role
    if (!req.user || !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const category = req.query.category;
    const period = req.query.period || '7d';
    
    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }
    
    // In a real implementation, this would fetch data from a database
    // For now, return mock data
    const mockData = {
      totalEvents: 8765,
      eventsByAction: {
        click: 3456,
        view: 2345,
        submit: 1234,
        search: 876,
        filter: 654,
        sort: 200
      },
      eventTrend: [
        { date: '2023-07-01', count: 245 },
        { date: '2023-07-02', count: 256 },
        { date: '2023-07-03', count: 234 },
        { date: '2023-07-04', count: 267 },
        { date: '2023-07-05', count: 278 },
        { date: '2023-07-06', count: 289 },
        { date: '2023-07-07', count: 301 }
      ],
      topLabels: [
        { label: 'supplier-list', count: 543 },
        { label: 'customer-form', count: 432 },
        { label: 'inspection-details', count: 345 },
        { label: 'dashboard-widget', count: 234 },
        { label: 'report-export', count: 123 }
      ]
    };
    
    res.status(200).json(mockData);
  } catch (err) {
    logger.error('Error fetching event analytics:', err);
    res.status(500).json({ message: 'Error fetching event analytics' });
  }
});

/**
 * @route   GET /api/monitoring/funnel-analytics/:funnelId
 * @desc    Get funnel analytics data
 * @access  Private (admin only)
 */
router.get('/funnel-analytics/:funnelId', async (req, res) => {
  try {
    // Check if user has admin role
    if (!req.user || !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { funnelId } = req.params;
    const period = req.query.period || '7d';
    
    // In a real implementation, this would fetch data from a database
    // For now, return mock data based on the funnel ID
    let mockData;
    
    if (funnelId === 'supplier-creation') {
      mockData = {
        name: 'Supplier Creation Funnel',
        steps: [
          { name: 'View Supplier List', count: 1200, dropoff: 0 },
          { name: 'Click Create Supplier', count: 450, dropoff: 0.625 },
          { name: 'Fill Supplier Form', count: 380, dropoff: 0.156 },
          { name: 'Submit Supplier Form', count: 320, dropoff: 0.158 },
          { name: 'Supplier Created', count: 300, dropoff: 0.063 }
        ],
        conversionRate: 0.25,
        averageTimeToComplete: 340 // seconds
      };
    } else if (funnelId === 'inspection-workflow') {
      mockData = {
        name: 'Inspection Workflow Funnel',
        steps: [
          { name: 'View Inspections', count: 800, dropoff: 0 },
          { name: 'Schedule Inspection', count: 350, dropoff: 0.563 },
          { name: 'Assign Inspector', count: 320, dropoff: 0.086 },
          { name: 'Conduct Inspection', count: 280, dropoff: 0.125 },
          { name: 'Complete Report', count: 250, dropoff: 0.107 }
        ],
        conversionRate: 0.313,
        averageTimeToComplete: 1200 // seconds
      };
    } else {
      return res.status(404).json({ message: 'Funnel not found' });
    }
    
    res.status(200).json(mockData);
  } catch (err) {
    logger.error('Error fetching funnel analytics:', err);
    res.status(500).json({ message: 'Error fetching funnel analytics' });
  }
});

/**
 * @route   POST /api/monitoring/performance
 * @desc    Log performance metrics
 * @access  Public (rate-limited)
 */
router.post('/performance', [
  body('metrics').isArray(),
  body('metrics.*.name').isString(),
  body('metrics.*.type').isString(),
  body('metrics.*.value').isNumeric(),
  body('metrics.*.timestamp').isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { metrics } = req.body;
    
    // Get user information if available
    const userId = req.user ? req.user.id : undefined;
    const sessionId = req.cookies.sessionId || req.headers['x-session-id'];
    
    // Process each metric
    for (const metric of metrics) {
      // Add user ID if available and not already present
      if (userId && !metric.userId) {
        metric.userId = userId;
      }
      
      // Add session ID if available and not already present
      if (sessionId && !metric.sessionId) {
        metric.sessionId = sessionId;
      }
      
      // Add server timestamp
      metric.serverTimestamp = new Date().toISOString();
      
      // Add request information
      metric.ip = req.ip;
      metric.userAgent = req.headers['user-agent'];
      
      // Log the metric
      logger.info('Performance metric:', {
        ...metric,
        source: 'client'
      });
      
      // Here you would typically store the metric in a database
      // or send it to a monitoring service
      // Example: await PerformanceMetric.create(metric);
    }
    
    // Return success
    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error('Error processing performance metrics:', err);
    return res.status(500).json({ message: 'Error processing performance metrics' });
  }
});

/**
 * @route   GET /api/monitoring/performance-metrics
 * @desc    Get performance metrics data
 * @access  Private (admin only)
 */
router.get('/performance-metrics', async (req, res) => {
  try {
    // Check if user has admin role
    if (!req.user || !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const period = req.query.period || '7d';
    
    // In a real implementation, this would fetch data from a database
    // For now, return mock data
    const mockData = {
      currentMetrics: {
        firstContentfulPaint: 850,
        largestContentfulPaint: 2200,
        firstInputDelay: 85,
        cumulativeLayoutShift: 0.05,
        total: 2800,
        domInteractive: 1200
      },
      baselineMetrics: {
        firstContentfulPaint: 800,
        largestContentfulPaint: 2000,
        firstInputDelay: 80,
        cumulativeLayoutShift: 0.04,
        total: 2600,
        domInteractive: 1100
      },
      historicalData: {
        dates: ['2023-01-01', '2023-02-01', '2023-03-01', '2023-04-01', '2023-05-01', '2023-06-01'],
        metrics: {
          firstContentfulPaint: [780, 790, 810, 820, 830, 850],
          largestContentfulPaint: [1900, 1950, 2000, 2050, 2100, 2200],
          firstInputDelay: [75, 76, 78, 80, 82, 85],
          cumulativeLayoutShift: [0.03, 0.035, 0.04, 0.042, 0.045, 0.05],
          total: [2500, 2550, 2600, 2650, 2700, 2800],
          domInteractive: [1000, 1020, 1050, 1080, 1150, 1200]
        }
      },
      budgetViolations: [
        {
          metric: 'largestContentfulPaint',
          current: 2200,
          threshold: 2000,
          condition: 'less-than'
        }
      ],
      regressions: [
        {
          metric: 'largestContentfulPaint',
          currentValue: 2200,
          baselineValue: 2000,
          percentChange: 10,
          threshold: 5
        }
      ]
    };
    
    res.status(200).json(mockData);
  } catch (err) {
    logger.error('Error fetching performance metrics:', err);
    res.status(500).json({ message: 'Error fetching performance metrics' });
  }
});

/**
 * Mount metrics router
 */
router.use('/', metricsRouter);

module.exports = router; 