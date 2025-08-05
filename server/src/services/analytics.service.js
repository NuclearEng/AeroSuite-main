const mongoose = require('mongoose');
const Inspection = require('../models/inspection.model');
const Supplier = require('../models/supplier.model');
const Customer = require('../models/customer.model');
const { executeOptimizedQuery } = require('../utils/queryOptimizer');

/**
 * Get inspection statistics
 * @param {Object} filters - Filter criteria
 * @returns {Object} - Statistics data
 */
exports.getInspectionStats = async (filters = {}) => {
  // Base filter
  const filter = { ...filters };
  
  // Count total inspections by status using optimized query with caching
  const statusCounts = await executeOptimizedQuery(Inspection, 'aggregate', [
    { $match: filter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ], { cacheTTL: 600 }); // Cache for 10 minutes since this is used frequently
  
  // Count by result using optimized query with caching
  const resultCounts = await executeOptimizedQuery(Inspection, 'aggregate', [
    { $match: { ...filter, status: 'completed' } },
    {
      $group: {
        _id: '$result',
        count: { $sum: 1 }
      }
    }
  ], { cacheTTL: 600 }); // Cache for 10 minutes
  
  // Format status counts
  const formattedStatusCounts = {};
  statusCounts.forEach(item => {
    formattedStatusCounts[item._id] = item.count;
  });
  
  // Format result counts
  const formattedResultCounts = {};
  resultCounts.forEach(item => {
    formattedResultCounts[item._id] = item.count;
  });
  
  return {
    statusCounts: formattedStatusCounts,
    resultCounts: formattedResultCounts,
    total: await executeOptimizedQuery(Inspection, 'count', filter) // Use optimized query for count
  };
};

/**
 * Get inspection trend data
 * @param {Object} filters - Filter criteria
 * @param {Date} startDate - Start date for trend analysis
 * @param {Date} endDate - End date for trend analysis
 * @returns {Array} - Trend data by month
 */
exports.getInspectionTrends = async (filters = {}, startDate, endDate) => {
  // Base filter with date range
  const filter = { 
    ...filters,
    createdAt: { $gte: startDate, $lte: endDate }
  };
  
  // Monthly trend using optimized query with caching
  const monthlyTrend = await executeOptimizedQuery(Inspection, 'aggregate', [
    { $match: filter },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        total: { $sum: 1 },
        passed: {
          $sum: {
            $cond: [{ $eq: ['$result', 'pass'] }, 1, 0]
          }
        },
        failed: {
          $sum: {
            $cond: [{ $eq: ['$result', 'fail'] }, 1, 0]
          }
        },
        conditional: {
          $sum: {
            $cond: [{ $eq: ['$result', 'conditional'] }, 1, 0]
          }
        }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ], { cacheTTL: 3600 }); // Cache for 1 hour since trend data changes less frequently
  
  // Format monthly data
  return monthlyTrend.map(item => {
    const date = new Date(item._id.year, item._id.month - 1, 1);
    return {
      month: date.toLocaleString('default', { month: 'short' }),
      year: item._id.year,
      total: item.total,
      passed: item.passed,
      failed: item.failed,
      conditional: item.conditional,
      passRate: item.total > 0 ? (item.passed / item.total) * 100 : 0
    };
  });
};

/**
 * Get supplier performance analytics
 * @param {Object} filters - Filter criteria
 * @returns {Array} - Supplier performance data
 */
exports.getSupplierPerformance = async (filters = {}) => {
  // Aggregate supplier performance using optimized query with caching
  const supplierPerformance = await executeOptimizedQuery(Inspection, 'aggregate', [
    { $match: filters },
    {
      $group: {
        _id: '$supplierId',
        total: { $sum: 1 },
        passed: {
          $sum: {
            $cond: [{ $eq: ['$result', 'pass'] }, 1, 0]
          }
        },
        failed: {
          $sum: {
            $cond: [{ $eq: ['$result', 'fail'] }, 1, 0]
          }
        },
        conditional: {
          $sum: {
            $cond: [{ $eq: ['$result', 'conditional'] }, 1, 0]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'suppliers',
        localField: '_id',
        foreignField: '_id',
        as: 'supplier'
      }
    },
    {
      $unwind: '$supplier'
    },
    {
      $project: {
        _id: 0,
        supplierId: '$_id',
        supplierName: '$supplier.name',
        total: 1,
        passed: 1,
        failed: 1,
        conditional: 1,
        passRate: {
          $cond: [
            { $eq: ['$total', 0] },
            0,
            { $multiply: [{ $divide: ['$passed', '$total'] }, 100] }
          ]
        }
      }
    },
    {
      $sort: { passRate: -1 }
    }
  ], { cacheTTL: 1800 }); // Cache for 30 minutes
  
  return supplierPerformance;
};

/**
 * Get defect analytics
 * @param {Object} filters - Filter criteria
 * @returns {Object} - Defect statistics
 */
exports.getDefectAnalytics = async (filters = {}) => {
  // Count defects by type using optimized query with caching
  const defectsByType = await executeOptimizedQuery(Inspection, 'aggregate', [
    { $match: filters },
    { $unwind: '$defects' },
    {
      $group: {
        _id: '$defects.defectType',
        count: { $sum: 1 },
        totalSeverity: {
          $sum: {
            $switch: {
              branches: [
                { case: { $eq: ['$defects.severity', 'critical'] }, then: 3 },
                { case: { $eq: ['$defects.severity', 'major'] }, then: 2 },
                { case: { $eq: ['$defects.severity', 'minor'] }, then: 1 }
              ],
              default: 0
            }
          }
        }
      }
    },
    { $sort: { count: -1 } }
  ], { cacheTTL: 1800 }); // Cache for 30 minutes
  
  return defectsByType;
};

/**
 * Get inspection timeline analytics
 * @param {Object} filters - Filter criteria
 * @returns {Object} - Timeline statistics
 */
exports.getInspectionTimeline = async (filters = {}) => {
  // Analyze inspection durations
  const inspectionDurations = await Inspection.aggregate([
    { 
      $match: { 
        ...filters,
        status: 'completed',
        startDate: { $exists: true },
        completionDate: { $exists: true }
      } 
    },
    {
      $project: {
        inspectionNumber: 1,
        duration: {
          $divide: [
            { $subtract: ['$completionDate', '$startDate'] },
            3600000 // Convert milliseconds to hours
          ]
        },
        inspectionType: 1
      }
    },
    {
      $group: {
        _id: '$inspectionType',
        avgDuration: { $avg: '$duration' },
        minDuration: { $min: '$duration' },
        maxDuration: { $max: '$duration' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        inspectionType: '$_id',
        avgDuration: 1,
        minDuration: 1,
        maxDuration: 1,
        count: 1,
        _id: 0
      }
    },
    {
      $sort: { avgDuration: 1 }
    }
  ]);
  
  // Analyze scheduled vs. actual dates
  const scheduledVsActual = await Inspection.aggregate([
    { 
      $match: { 
        ...filters,
        status: 'completed',
        scheduledDate: { $exists: true },
        completionDate: { $exists: true }
      } 
    },
    {
      $project: {
        inspectionNumber: 1,
        scheduledDate: 1,
        completionDate: 1,
        difference: {
          $divide: [
            { $subtract: ['$completionDate', '$scheduledDate'] },
            86400000 // Convert milliseconds to days
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgDifference: { $avg: '$difference' },
        onTimeCount: {
          $sum: {
            $cond: [{ $lte: ['$difference', 0] }, 1, 0]
          }
        },
        delayedCount: {
          $sum: {
            $cond: [{ $gt: ['$difference', 0] }, 1, 0]
          }
        },
        totalCount: { $sum: 1 }
      }
    },
    {
      $project: {
        avgDifference: 1,
        onTimePercentage: {
          $multiply: [
            { $divide: ['$onTimeCount', '$totalCount'] },
            100
          ]
        },
        delayedPercentage: {
          $multiply: [
            { $divide: ['$delayedCount', '$totalCount'] },
            100
          ]
        },
        _id: 0
      }
    }
  ]);
  
  return {
    durations: inspectionDurations,
    scheduledVsActual: scheduledVsActual[0] || {
      avgDifference: 0,
      onTimePercentage: 0,
      delayedPercentage: 0
    }
  };
};

module.exports = exports; 