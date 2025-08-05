/**
 * Data Processing Worker Thread
 * 
 * This worker handles CPU-intensive data operations such as:
 * - Supplier risk scoring
 * - Performance metrics calculation
 * - Data aggregation and transformation
 */
const { parentPort } = require('worker_threads');

// Worker initialization
console.log('Data processing worker initialized');

// Handle messages from main thread
parentPort.on('message', (data) => {
  console.log(`Processing ${data.items?.length || 0} items with operation: ${data.operation}`);
  
  let result;
  try {
    switch (data.operation) {
      case 'processSuppliers':
        result = processSupplierData(data.items);
        break;
      case 'calculateRisk':
        result = calculateSupplierRisk(data.items);
        break;
      case 'aggregateInspections':
        result = aggregateInspectionData(data.items);
        break;
      default:
        throw new Error(`Unknown operation: ${data.operation}`);
    }
    
    // Send successful result back to main thread
    parentPort.postMessage({
      success: true,
      result,
      operation: data.operation,
      processingTime: Date.now() - data.timestamp
    });
  } catch (error) {
    // Send error back to main thread
    parentPort.postMessage({
      success: false,
      error: error.message,
      operation: data.operation
    });
  }
});

/**
 * Process supplier data for analytics
 * CPU-intensive task that analyzes and transforms supplier data
 */
function processSupplierData(suppliers = []) {
  // Simulate complex computation
  return suppliers.map(supplier => {
    const riskScore = calculateRiskScore(supplier);
    const performanceIndex = computePerformanceMetrics(supplier);
    
    return {
      id: supplier.id || supplier._id,
      name: supplier.name,
      riskScore,
      performanceIndex,
      lastInspectionDate: supplier.lastInspectionDate || null,
      complianceStatus: determineComplianceStatus(riskScore, performanceIndex)
    };
  });
}

/**
 * Calculate risk score for a supplier
 * Uses multiple factors to determine overall risk
 */
function calculateRiskScore(supplier) {
  // Complex algorithm for risk calculation
  let score = 50; // Base score
  
  // Factor 1: Inspection history
  const inspectionHistory = supplier.inspections || [];
  if (inspectionHistory.length > 0) {
    // Calculate average inspection score
    const avgScore = inspectionHistory.reduce((sum, insp) => sum + (insp.score || 0), 0) / inspectionHistory.length;
    score += avgScore * 0.3; // 30% weight
  } else {
    score -= 10; // Penalty for no inspections
  }
  
  // Factor 2: Quality metrics
  const quality = supplier.quality || {};
  if (quality.defectRate != null) {
    score -= quality.defectRate * 20; // Defect rate negatively impacts score
  }
  
  // Factor 3: Delivery performance
  const delivery = supplier.delivery || {};
  if (delivery.onTimeRate != null) {
    score += delivery.onTimeRate * 0.2; // 20% weight for on-time delivery
  }
  
  // Normalize score between 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Compute performance metrics for a supplier
 */
function computePerformanceMetrics(supplier) {
  // CPU-intensive metrics calculation
  const metrics = {
    qualityIndex: 0,
    deliveryIndex: 0,
    communicationIndex: 0,
    overallIndex: 0
  };
  
  // Calculate quality index
  const quality = supplier.quality || {};
  metrics.qualityIndex = 100 - ((quality.defectRate || 0) * 100);
  
  // Calculate delivery index
  const delivery = supplier.delivery || {};
  metrics.deliveryIndex = (delivery.onTimeRate || 0.5) * 100;
  
  // Calculate communication index
  metrics.communicationIndex = (supplier.responsiveness || 0.7) * 100;
  
  // Calculate overall index (weighted average)
  metrics.overallIndex = (
    (metrics.qualityIndex * 0.5) + 
    (metrics.deliveryIndex * 0.3) + 
    (metrics.communicationIndex * 0.2)
  );
  
  return metrics;
}

/**
 * Determine compliance status based on risk and performance
 */
function determineComplianceStatus(riskScore, performanceMetrics) {
  const overallPerformance = performanceMetrics.overallIndex;
  
  if (riskScore < 30 && overallPerformance > 70) {
    return 'compliant';
  } else if (riskScore > 70) {
    return 'non-compliant';
  } else {
    return 'review-required';
  }
}

/**
 * Aggregate inspection data for reporting
 */
function aggregateInspectionData(inspections = []) {
  // Group inspections by month and supplier
  const groupedByMonth = {};
  const groupedBySupplier = {};
  
  inspections.forEach(inspection => {
    // Group by month
    const date = new Date(inspection.date || inspection.createdAt);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!groupedByMonth[monthKey]) {
      groupedByMonth[monthKey] = [];
    }
    groupedByMonth[monthKey].push(inspection);
    
    // Group by supplier
    const supplierId = inspection.supplierId || (inspection.supplier && inspection.supplier._id);
    if (supplierId) {
      if (!groupedBySupplier[supplierId]) {
        groupedBySupplier[supplierId] = [];
      }
      groupedBySupplier[supplierId].push(inspection);
    }
  });
  
  // Calculate statistics for each group
  const monthlyStats = calculateGroupStats(groupedByMonth);
  const supplierStats = calculateGroupStats(groupedBySupplier);
  
  return {
    monthlyStats,
    supplierStats,
    totalInspections: inspections.length,
    averageScore: inspections.reduce((sum, insp) => sum + (insp.score || 0), 0) / (inspections.length || 1)
  };
}

/**
 * Calculate statistics for grouped data
 */
function calculateGroupStats(groupedData) {
  const stats = {};
  
  Object.entries(groupedData).forEach(([key, items]) => {
    const scores = items.map(item => item.score || 0);
    stats[key] = {
      count: items.length,
      averageScore: scores.reduce((sum, score) => sum + score, 0) / (scores.length || 1),
      passRate: items.filter(item => (item.status === 'pass' || item.score > 70)).length / items.length,
      highRiskCount: items.filter(item => item.riskLevel === 'high' || item.score < 50).length
    };
  });
  
  return stats;
}

// Signal ready state to parent
parentPort.postMessage({ ready: true }); 