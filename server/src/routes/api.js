/**
 * @route   GET /api/performance/metrics
 * @desc    Get combined performance metrics data
 * @access  Admin
 */
router.get('/performance/metrics', authenticate({ requiredRole: 'admin' }), async (req, res) => {
  try {
    // Get metrics from various sources
    const [systemMetrics, appMetrics, requestMetrics, dbMetrics] = await Promise.all([
      axios.get('/api/monitoring/metrics/system'),
      axios.get('/api/monitoring/metrics/application'),
      axios.get('/api/monitoring/metrics/requests'),
      axios.get('/api/monitoring/metrics/database'),
    ]);
    
    // Combine metrics
    const combinedMetrics = {
      timestamp: new Date().toISOString(),
      system: systemMetrics.data,
      application: appMetrics.data,
      requests: requestMetrics.data,
      database: dbMetrics.data,
    };
    
    res.json(combinedMetrics);
  } catch (error) {
    console.error('Error fetching combined metrics:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
}); 