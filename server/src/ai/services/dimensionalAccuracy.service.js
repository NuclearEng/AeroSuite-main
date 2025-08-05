/**
 * Dimensional Accuracy Verification Service
 * 
 * This service provides functionality for verifying dimensional accuracy of components
 * by analyzing inspection images and measurements against engineering specifications.
 * 
 * The service integrates with the GD&T symbol recognition model to extract dimensional
 * requirements from engineering drawings and compares them with actual measurements.
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const { getGDTSymbolRecognition } = require('./gdtRecognition.service');

// Models
const Inspection = require('../models/inspection.model');
const Component = require('../models/component.model');

/**
 * Verify dimensional accuracy from an inspection measurement
 * 
 * @param {Object} measurement - The measurement object from an inspection
 * @param {Object} specification - The component specification
 * @returns {Object} Verification result with pass/fail status and deviation analysis
 */
async function verifyDimensionalAccuracy(measurement, specification) {
  try {
    if (!measurement || !specification) {
      throw new Error('Measurement and specification are required');
    }

    // Extract the actual value, expected value, and tolerance from the measurement
    const { parameterName, actualValue, expectedValue, tolerance, unit } = measurement;

    // Parse values as numbers for comparison
    const actual = parseFloat(actualValue);
    const expected = parseFloat(expectedValue);
    const tol = parseTolerance(tolerance);

    // Check if the values are valid numbers
    if (isNaN(actual) || isNaN(expected)) {
      throw new Error('Actual and expected values must be valid numbers');
    }

    // Calculate the deviation
    const deviation = actual - expected;
    const deviationPercent = (deviation / expected) * 100;

    // Determine if the measurement is within tolerance
    const lowerLimit = expected - tol.minus;
    const upperLimit = expected + tol.plus;
    const isWithinTolerance = actual >= lowerLimit && actual <= upperLimit;

    // Format the result
    return {
      parameterName,
      actualValue: actual,
      expectedValue: expected,
      deviation,
      deviationPercent,
      tolerance: {
        minus: tol.minus,
        plus: tol.plus,
        display: tolerance
      },
      unit,
      withinTolerance: isWithinTolerance,
      status: isWithinTolerance ? 'pass' : 'fail',
      message: isWithinTolerance 
        ? `Measurement is within tolerance (${tolerance})`
        : `Measurement is out of tolerance (${tolerance})`
    };
  } catch (error) {
    logger.error(`Error verifying dimensional accuracy: ${error.message}`);
    throw error;
  }
}

/**
 * Verify all measurements in an inspection against component specifications
 * 
 * @param {string} inspectionId - The ID of the inspection to verify
 * @returns {Object} Verification results for all measurements
 */
async function verifyInspectionMeasurements(inspectionId) {
  try {
    // Get the inspection with populated component data
    const inspection = await Inspection.findById(inspectionId)
      .populate('componentId')
      .exec();

    if (!inspection) {
      throw new Error(`Inspection not found: ${inspectionId}`);
    }

    if (!inspection.componentId) {
      throw new Error(`No component associated with inspection: ${inspectionId}`);
    }

    const component = inspection.componentId;
    const verificationResults = [];

    // Process each checklist item with measurements
    for (const item of inspection.checklistItems) {
      if (!item.measurements || item.measurements.length === 0) {
        continue;
      }

      // Find matching specification for this checklist item
      // This would typically come from the component's specifications or critical characteristics
      const specification = component.criticalCharacteristics
        ? component.criticalCharacteristics.find(cc => cc.name === item.name)
        : null;

      // Verify each measurement
      for (const measurement of item.measurements) {
        try {
          const result = await verifyDimensionalAccuracy(measurement, specification);
          verificationResults.push({
            checklistItemId: item._id,
            checklistItemName: item.name,
            measurementResult: result
          });
        } catch (error) {
          logger.error(`Error verifying measurement: ${error.message}`);
          verificationResults.push({
            checklistItemId: item._id,
            checklistItemName: item.name,
            error: error.message
          });
        }
      }
    }

    // Summarize the results
    const totalMeasurements = verificationResults.length;
    const passedMeasurements = verificationResults.filter(r => r.measurementResult && r.measurementResult.withinTolerance).length;
    const failedMeasurements = verificationResults.filter(r => r.measurementResult && !r.measurementResult.withinTolerance).length;
    const errorMeasurements = verificationResults.filter(r => r.error).length;

    return {
      inspectionId,
      componentId: component._id,
      componentName: component.name,
      partNumber: component.partNumber,
      revision: component.revision,
      totalMeasurements,
      passedMeasurements,
      failedMeasurements,
      errorMeasurements,
      passRate: totalMeasurements > 0 ? (passedMeasurements / totalMeasurements) * 100 : 0,
      status: failedMeasurements === 0 ? 'pass' : 'fail',
      results: verificationResults,
      timestamp: new Date()
    };
  } catch (error) {
    logger.error(`Error verifying inspection measurements: ${error.message}`);
    throw error;
  }
}

/**
 * Analyze measurement patterns across multiple inspections for a component
 * 
 * @param {string} componentId - The ID of the component to analyze
 * @param {Object} options - Analysis options (timeframe, etc.)
 * @returns {Object} Analysis results with trends and recommendations
 */
async function analyzeMeasurementTrends(componentId, options = {}) {
  try {
    const { startDate, endDate } = options;
    
    // Define date range for the query
    const dateFilter = {};
    if (startDate) {
      dateFilter['$gte'] = new Date(startDate);
    }
    if (endDate) {
      dateFilter['$lte'] = new Date(endDate);
    }

    // Find completed inspections for this component
    const query = { 
      componentId,
      status: 'completed'
    };
    
    if (Object.keys(dateFilter).length > 0) {
      query.completionDate = dateFilter;
    }

    const inspections = await Inspection.find(query).sort({ completionDate: 1 }).exec();

    // Extract measurements from inspections
    const measurementData = [];
    
    for (const inspection of inspections) {
      // Process each checklist item with measurements
      for (const item of inspection.checklistItems) {
        if (!item.measurements || item.measurements.length === 0) {
          continue;
        }

        // Add each measurement to the data set with its timestamp
        for (const measurement of item.measurements) {
          measurementData.push({
            inspectionId: inspection._id,
            inspectionDate: inspection.completionDate,
            checklistItemName: item.name,
            parameterName: measurement.parameterName,
            actualValue: parseFloat(measurement.actualValue),
            expectedValue: parseFloat(measurement.expectedValue),
            tolerance: measurement.tolerance,
            unit: measurement.unit,
            result: measurement.result
          });
        }
      }
    }

    // Group measurements by parameter name for trend analysis
    const measurementsByParameter = {};
    
    for (const data of measurementData) {
      if (!measurementsByParameter[data.parameterName]) {
        measurementsByParameter[data.parameterName] = [];
      }
      measurementsByParameter[data.parameterName].push(data);
    }

    // Analyze trends for each parameter
    const trends = [];
    
    for (const [parameterName, measurements] of Object.entries(measurementsByParameter)) {
      // Sort by inspection date
      measurements.sort((a, b) => new Date(a.inspectionDate) - new Date(b.inspectionDate));
      
      // Calculate trend metrics
      const values = measurements.map(m => m.actualValue);
      const average = values.reduce((sum, value) => sum + value, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      // Calculate standard deviation
      const variance = values.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      // Calculate trend direction (are values increasing, decreasing, or stable)
      let trendDirection = 'stable';
      if (measurements.length > 1) {
        const firstHalf = measurements.slice(0, Math.floor(measurements.length / 2));
        const secondHalf = measurements.slice(Math.floor(measurements.length / 2));
        
        const firstHalfAvg = firstHalf.reduce((sum, m) => sum + m.actualValue, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, m) => sum + m.actualValue, 0) / secondHalf.length;
        
        const percentChange = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
        
        // Define threshold for significant change (e.g., 2%)
        if (percentChange > 2) {
          trendDirection = 'increasing';
        } else if (percentChange < -2) {
          trendDirection = 'decreasing';
        }
      }
      
      // Sample reference value (expected)
      const expectedValue = measurements[0].expectedValue;
      const unit = measurements[0].unit;
      
      // Determine if there's a potential issue based on trend
      let potentialIssue = false;
      let recommendation = null;
      
      // If trending toward tolerance limits
      if (trendDirection !== 'stable') {
        const lastValue = measurements[measurements.length - 1].actualValue;
        const tolerance = parseTolerance(measurements[0].tolerance);
        
        const upperLimit = expectedValue + tolerance.plus;
        const lowerLimit = expectedValue - tolerance.minus;
        
        // If trending up toward upper limit
        if (trendDirection === 'increasing' && lastValue > (upperLimit - (tolerance.plus * 0.2))) {
          potentialIssue = true;
          recommendation = `Parameter ${parameterName} is trending upward and approaching upper tolerance limit. Consider adjustment.`;
        }
        
        // If trending down toward lower limit
        if (trendDirection === 'decreasing' && lastValue < (lowerLimit + (tolerance.minus * 0.2))) {
          potentialIssue = true;
          recommendation = `Parameter ${parameterName} is trending downward and approaching lower tolerance limit. Consider adjustment.`;
        }
      }
      
      // High variability might indicate process issues
      if (stdDev > 0.1 * average) { // If std dev is more than 10% of the mean
        potentialIssue = true;
        recommendation = recommendation || `High variability detected in ${parameterName}. Process may need stabilization.`;
      }
      
      trends.push({
        parameterName,
        measurements: measurements.length,
        average,
        min,
        max,
        stdDev,
        unit,
        expectedValue,
        trendDirection,
        potentialIssue,
        recommendation,
        timeRange: {
          start: measurements[0].inspectionDate,
          end: measurements[measurements.length - 1].inspectionDate
        },
        data: measurements.map(m => ({
          date: m.inspectionDate,
          value: m.actualValue
        }))
      });
    }

    return {
      componentId,
      totalInspections: inspections.length,
      timeRange: {
        start: inspections.length > 0 ? inspections[0].completionDate : null,
        end: inspections.length > 0 ? inspections[inspections.length - 1].completionDate : null
      },
      trends,
      timestamp: new Date()
    };
  } catch (error) {
    logger.error(`Error analyzing measurement trends: ${error.message}`);
    throw error;
  }
}

/**
 * Parse a tolerance string into numeric values
 * 
 * @param {string} tolerance - Tolerance string (e.g., "±0.1", "+0.2/-0.1")
 * @returns {Object} Parsed tolerance values
 */
function parseTolerance(tolerance) {
  try {
    if (!tolerance) {
      return { plus: 0, minus: 0 };
    }

    // Handle ± format
    if (tolerance.includes('±')) {
      const value = parseFloat(tolerance.replace('±', ''));
      return { plus: value, minus: value };
    }

    // Handle +x/-y format
    if (tolerance.includes('/')) {
      const parts = tolerance.split('/');
      const plus = parseFloat(parts[0].replace('+', ''));
      const minus = Math.abs(parseFloat(parts[1]));
      return { plus, minus };
    }

    // Default to symmetric tolerance if just a number
    if (!isNaN(parseFloat(tolerance))) {
      const value = parseFloat(tolerance);
      return { plus: value, minus: value };
    }

    // Default fallback
    return { plus: 0, minus: 0 };
  } catch (error) {
    logger.error(`Error parsing tolerance: ${error.message}`);
    return { plus: 0, minus: 0 };
  }
}

module.exports = {
  verifyDimensionalAccuracy,
  verifyInspectionMeasurements,
  analyzeMeasurementTrends
}; 