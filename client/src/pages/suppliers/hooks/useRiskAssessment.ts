import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import supplierService, { Supplier } from '../../../services/supplier.service';

// Risk assessment types
export interface RiskFactor {
  _id?: string;
  name: string;
  description: string;
  weight: number;
  score: number;
  category: 'operational' | 'financial' | 'compliance' | 'geographic' | 'strategic';
}

export interface RiskAssessment {
  _id?: string;
  supplierId: string;
  assessmentDate: Date;
  assessedBy: string;
  factors: RiskFactor[];
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  notes?: string;
  mitigationPlan?: string;
  nextReviewDate?: Date;
  status: 'draft' | 'completed' | 'reviewed' | 'archived';
}

// Category information for UI display
export const CATEGORY_INFO = {
  operational: { 
    label: 'Operational', 
    color: '#2196f3',
    description: 'Day-to-day operations and processes' 
  },
  financial: { 
    label: 'Financial', 
    color: '#4caf50',
    description: 'Financial stability and payment reliability' 
  },
  compliance: { 
    label: 'Compliance', 
    color: '#ff9800',
    description: 'Regulatory and standards compliance' 
  },
  geographic: { 
    label: 'Geographic', 
    color: '#9c27b0',
    description: 'Location-based risks' 
  },
  strategic: { 
    label: 'Strategic', 
    color: '#f44336',
    description: 'Long-term planning and business continuity' 
  }
};

// Risk level thresholds
export const RISK_LEVEL_THRESHOLDS = {
  low: 4.0,    // >= 4.0 is low risk
  medium: 2.5  // >= 2.5 is medium risk, below is high risk
};

const useRiskAssessment = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);
  const [notes, setNotes] = useState('');
  const [mitigationPlan, setMitigationPlan] = useState('');
  const [assessor, setAssessor] = useState('');
  const [overallScore, setOverallScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [savedAssessments, setSavedAssessments] = useState<RiskAssessment[]>([]);
  const [activeAssessment, setActiveAssessment] = useState<RiskAssessment | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextReviewDate, setNextReviewDate] = useState<Date | null>(null);

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const response = await supplierService.getSuppliers();
        setSuppliers(response.data);
      } catch (_err) {
        console.error('Error fetching suppliers:', err);
        enqueueSnackbar('Failed to load suppliers', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, [enqueueSnackbar]);

  // Fetch default risk factors
  useEffect(() => {
    const fetchDefaultFactors = async () => {
      try {
        const response = await axios.get('/api/risk-assessments/factors/default');
        setRiskFactors(response.data.data);
      } catch (_err) {
        console.error('Error fetching default risk factors:', err);
        // Set some basic default factors if the API call fails
        setRiskFactors([
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
          }
        ]);
      }
    };

    fetchDefaultFactors();
  }, []);

  // Calculate overall score and risk level when risk factors change
  useEffect(() => {
    if (riskFactors.length === 0 || riskFactors.some(factor => factor.score === 0)) {
      return;
    }

    let totalWeight = 0;
    let weightedScore = 0;
    
    riskFactors.forEach(factor => {
      totalWeight += factor.weight;
      weightedScore += factor.weight * factor.score;
    });
    
    // Normalize weights if they don't sum to 1
    if (totalWeight > 0 && totalWeight !== 1) {
      weightedScore = weightedScore / totalWeight;
    }
    
    setOverallScore(parseFloat(weightedScore.toFixed(2)));
    
    // Determine risk level based on score
    if (weightedScore >= RISK_LEVEL_THRESHOLDS.low) {
      setRiskLevel('low');
    } else if (weightedScore >= RISK_LEVEL_THRESHOLDS.medium) {
      setRiskLevel('medium');
    } else {
      setRiskLevel('high');
    }
  }, [riskFactors]);

  // Fetch assessments for a supplier
  const fetchSupplierAssessments = useCallback(async (supplierId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/suppliers/${supplierId}/risk-assessments`);
      setSavedAssessments(response.data.data);
      return response.data.data;
    } catch (_err) {
      console.error('Error fetching supplier assessments:', err);
      enqueueSnackbar('Failed to load risk assessments', { variant: 'error' });
      return [];
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  // Handle supplier selection change
  const handleSupplierChange = useCallback(async (supplier: Supplier | null) => {
    setSelectedSupplier(supplier);
    
    if (!supplier) {
      resetAssessment();
      setSavedAssessments([]);
      return;
    }
    
    // Fetch assessments for this supplier
    const assessments = await fetchSupplierAssessments(supplier._id);
    
    // If there are assessments, use the most recent one as active
    if (assessments.length > 0) {
      const latestAssessment = assessments.sort((a, b) => 
        new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime()
      )[0];
      
      setActiveAssessment(latestAssessment);
      setRiskFactors(latestAssessment.factors);
      setNotes(latestAssessment.notes || '');
      setMitigationPlan(latestAssessment.mitigationPlan || '');
      setAssessor(latestAssessment.assessedBy);
      setOverallScore(latestAssessment.overallScore);
      setRiskLevel(latestAssessment.riskLevel);
      setNextReviewDate(latestAssessment.nextReviewDate ? new Date(latestAssessment.nextReviewDate) : null);
    } else {
      resetAssessment();
    }
  }, [fetchSupplierAssessments]);

  // Reset the assessment form
  const resetAssessment = useCallback(() => {
    setActiveAssessment(null);
    // Don't reset risk factors since we want to keep the default factors
    setNotes('');
    setMitigationPlan('');
    setAssessor('');
    setOverallScore(0);
    setRiskLevel('medium');
    setNextReviewDate(null);
  }, []);

  // Handle factor score change
  const handleFactorScoreChange = useCallback((factorId: string, newScore: number) => {
    setRiskFactors(prev => 
      prev.map(factor => 
        (factor._id === factorId || factor.name === factorId) 
          ? { ...factor, score: newScore } 
          : factor
      )
    );
  }, []);

  // Handle factor weight change
  const handleFactorWeightChange = useCallback((factorId: string, newWeight: number) => {
    // Convert percentage to decimal (e.g., 15% -> 0.15)
    const weightDecimal = newWeight / 100;
    
    setRiskFactors(prev => 
      prev.map(factor => 
        (factor._id === factorId || factor.name === factorId) 
          ? { ...factor, weight: weightDecimal } 
          : factor
      )
    );
  }, []);

  // Save assessment
  const saveAssessment = useCallback(async () => {
    if (!selectedSupplier) {
      setError('Please select a supplier');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    if (riskFactors.some(factor => factor.score === 0)) {
      setError('Please rate all risk factors');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    if (!assessor.trim()) {
      setError('Please enter assessor name');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    try {
      setLoading(true);
      
      const assessmentData: Partial<RiskAssessment> = {
        supplierId: selectedSupplier._id,
        assessmentDate: new Date(),
        assessedBy: assessor,
        factors: riskFactors,
        overallScore,
        riskLevel,
        notes,
        mitigationPlan,
        nextReviewDate: nextReviewDate || undefined,
        status: 'completed'
      };
      
      let response;
      
      if (activeAssessment?._id) {
        // Update existing assessment
        response = await axios.put(`/api/risk-assessments/${activeAssessment._id}`, assessmentData);
      } else {
        // Create new assessment
        response = await axios.post('/api/risk-assessments', assessmentData);
      }
      
      const savedAssessment = response.data.data;
      
      // Update the active assessment and saved assessments list
      setActiveAssessment(savedAssessment);
      setSavedAssessments(prev => {
        const filtered = prev.filter(a => a._id !== savedAssessment._id);
        return [savedAssessment, ...filtered];
      });
      
      enqueueSnackbar('Risk assessment saved successfully', { variant: 'success' });
      setShowSaveDialog(false);
      
      return savedAssessment;
    } catch (_err) {
      console.error('Error saving risk assessment:', err);
      enqueueSnackbar('Failed to save risk assessment', { variant: 'error' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [
    selectedSupplier, 
    riskFactors, 
    assessor, 
    overallScore, 
    riskLevel, 
    notes, 
    mitigationPlan, 
    nextReviewDate, 
    activeAssessment, 
    enqueueSnackbar
  ]);

  // Handle save button click
  const handleSaveClick = () => {
    setShowSaveDialog(true);
  };

  // Handle save confirmation
  const handleSaveConfirm = async () => {
    await saveAssessment();
  };

  // Handle delete assessment
  const handleDeleteAssessment = useCallback(async (assessmentId: string) => {
    try {
      setLoading(true);
      await axios.delete(`/api/risk-assessments/${assessmentId}`);
      
      // Remove from saved assessments
      setSavedAssessments(prev => prev.filter(a => a._id !== assessmentId));
      
      // If this was the active assessment, reset the form
      if (activeAssessment?._id === assessmentId) {
        resetAssessment();
      }
      
      enqueueSnackbar('Risk assessment deleted successfully', { variant: 'success' });
    } catch (_err) {
      console.error('Error deleting risk assessment:', err);
      enqueueSnackbar('Failed to delete risk assessment', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [activeAssessment, resetAssessment, enqueueSnackbar]);

  // Set an assessment as active
  const handleViewAssessment = useCallback((assessment: RiskAssessment) => {
    setActiveAssessment(assessment);
    setRiskFactors(assessment.factors);
    setNotes(assessment.notes || '');
    setMitigationPlan(assessment.mitigationPlan || '');
    setAssessor(assessment.assessedBy);
    setOverallScore(assessment.overallScore);
    setRiskLevel(assessment.riskLevel);
    setNextReviewDate(assessment.nextReviewDate ? new Date(assessment.nextReviewDate) : null);
  }, []);

  return {
    loading,
    suppliers,
    selectedSupplier,
    riskFactors,
    notes,
    mitigationPlan,
    assessor,
    overallScore,
    riskLevel,
    nextReviewDate,
    savedAssessments,
    activeAssessment,
    showSaveDialog,
    error,
    setNotes,
    setMitigationPlan,
    setAssessor,
    setNextReviewDate,
    handleSupplierChange,
    handleFactorScoreChange,
    handleFactorWeightChange,
    handleSaveClick,
    handleSaveConfirm,
    handleDeleteAssessment,
    handleViewAssessment,
    setShowSaveDialog,
    resetAssessment
  };
};

export default useRiskAssessment; 