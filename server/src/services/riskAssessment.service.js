/**
 * Risk Assessment Service
 * Provides business logic for supplier risk assessments
 */
const RiskAssessment = require('../models/RiskAssessment');
const Supplier = require('../models/supplier.model');
const { NotFoundError, BadRequestError } = require('../utils/errors');

// Default risk factors for new assessments
const DEFAULT_RISK_FACTORS = [
  {
    name: 'On-time Delivery',
    description: 'Evaluate the supplier\'s ability to deliver products or services according to agreed schedules',
    weight: 0.15,
    score: 3,
    category: 'operational'
  },
  {
    name: 'Quality Consistency',
    description: 'Evaluate the supplier\'s ability to consistently meet quality standards',
    weight: 0.20,
    score: 3,
    category: 'operational'
  },
  {
    name: 'Financial Stability',
    description: 'Evaluate the supplier\'s financial health and stability',
    weight: 0.15,
    score: 3,
    category: 'financial'
  },
  {
    name: 'Regulatory Compliance',
    description: 'Evaluate the supplier\'s compliance with relevant regulations and standards',
    weight: 0.10,
    score: 3,
    category: 'compliance'
  },
  {
    name: 'Geographic Risk',
    description: 'Evaluate risks associated with the supplier\'s location (natural disasters, political instability, etc.)',
    weight: 0.10,
    score: 3,
    category: 'geographic'
  },
  {
    name: 'Capacity & Scalability',
    description: 'Evaluate the supplier\'s ability to scale production to meet changing demands',
    weight: 0.10,
    score: 3,
    category: 'operational'
  },
  {
    name: 'Business Continuity',
    description: 'Evaluate the supplier\'s business continuity and disaster recovery plans',
    weight: 0.10,
    score: 3,
    category: 'strategic'
  },
  {
    name: 'Communication & Responsiveness',
    description: 'Evaluate the supplier\'s communication effectiveness and responsiveness to issues',
    weight: 0.10,
    score: 3,
    category: 'operational'
  }
];

/**
 * Create a new risk assessment
 * @param {Object} assessmentData Risk assessment data
 * @returns {Promise<Object>} Created risk assessment
 */
exports.createRiskAssessment = async (assessmentData) => {
  // Validate supplier exists
  const supplier = await Supplier.findById(assessmentData.supplierId);
  if (!supplier) {
    throw new NotFoundError(`Supplier not found with id ${assessmentData.supplierId}`);
  }

  // If no factors provided, use defaults
  if (!assessmentData.factors || assessmentData.factors.length === 0) {
    assessmentData.factors = DEFAULT_RISK_FACTORS;
  }
  
  // Create assessment
  const assessment = new RiskAssessment(assessmentData);
  await assessment.save();
  
  return assessment;
};

/**
 * Get a risk assessment by ID
 * @param {string} id Risk assessment ID
 * @returns {Promise<Object>} Risk assessment
 */
exports.getRiskAssessmentById = async (id) => {
  const assessment = await RiskAssessment.findById(id).populate('supplier');
  if (!assessment) {
    throw new NotFoundError(`Risk assessment not found with id ${id}`);
  }
  return assessment;
};

/**
 * Update a risk assessment
 * @param {string} id Risk assessment ID
 * @param {Object} updateData Updated risk assessment data
 * @returns {Promise<Object>} Updated risk assessment
 */
exports.updateRiskAssessment = async (id, updateData) => {
  const assessment = await RiskAssessment.findById(id);
  if (!assessment) {
    throw new NotFoundError(`Risk assessment not found with id ${id}`);
  }
  
  // Update assessment
  Object.keys(updateData).forEach(key => {
    assessment[key] = updateData[key];
  });
  
  await assessment.save();
  return assessment;
};

/**
 * Delete a risk assessment
 * @param {string} id Risk assessment ID
 * @returns {Promise<boolean>} True if deleted
 */
exports.deleteRiskAssessment = async (id) => {
  const result = await RiskAssessment.findByIdAndDelete(id);
  if (!result) {
    throw new NotFoundError(`Risk assessment not found with id ${id}`);
  }
  return true;
};

/**
 * Get all risk assessments for a supplier
 * @param {string} supplierId Supplier ID
 * @returns {Promise<Array>} List of risk assessments
 */
exports.getSupplierRiskAssessments = async (supplierId) => {
  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    throw new NotFoundError(`Supplier not found with id ${supplierId}`);
  }
  
  return RiskAssessment.find({ supplierId }).sort({ assessmentDate: -1 });
};

/**
 * Get default risk factors
 * @returns {Array} Default risk factors
 */
exports.getDefaultRiskFactors = () => {
  return DEFAULT_RISK_FACTORS;
};

/**
 * Get risk assessment summary statistics
 * @returns {Promise<Object>} Risk assessment statistics
 */
exports.getRiskAssessmentStats = async () => {
  const stats = await RiskAssessment.aggregate([
    {
      $group: {
        _id: '$riskLevel',
        count: { $sum: 1 },
        avgScore: { $avg: '$overallScore' }
      }
    }
  ]);
  
  const total = await RiskAssessment.countDocuments();
  
  return {
    total,
    byRiskLevel: stats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        percentage: (stat.count / total) * 100,
        avgScore: parseFloat(stat.avgScore.toFixed(2))
      };
      return acc;
    }, {})
  };
}; 