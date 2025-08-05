// Custom hook for risk assessment logic
import { useState, useEffect } from 'react';
import type { Supplier } from '../../../services/mockDataService';
import MockDataService from '../../../services/mockDataService';
import type { RiskFactor, RiskAssessment } from '../types';
import { DEFAULT_RISK_FACTORS, RISK_LEVEL_THRESHOLDS } from '../constants';

export const useRiskAssessment = () => {
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([...DEFAULT_RISK_FACTORS]);
  const [notes, setNotes] = useState('');
  const [mitigationPlan, setMitigationPlan] = useState('');
  const [assessor, setAssessor] = useState('');
  const [overallScore, setOverallScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [savedAssessments, setSavedAssessments] = useState<RiskAssessment[]>([]);
  const [activeAssessment, setActiveAssessment] = useState<RiskAssessment | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load suppliers and existing assessments
  useEffect(() => {
    const loadData = async () => {
      try {
        MockDataService.initialize();
        const supplierData = MockDataService.getSuppliers();
        setSuppliers(supplierData);
        
        // In a real app, we would load saved assessments from the backend
        // For now, we'll just create some mock data
        const mockAssessments: RiskAssessment[] = supplierData.slice(0, 2).map((supplier, index) => {
          const factors = DEFAULT_RISK_FACTORS.map(factor => ({
            ...factor,
            score: Math.floor(Math.random() * 5) + 1
          }));
          
          const avgScore = factors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0);
          const riskLevel = avgScore > RISK_LEVEL_THRESHOLDS.low ? 'low' : 
                           avgScore > RISK_LEVEL_THRESHOLDS.medium ? 'medium' : 'high';
          
          return {
            id: `assess_${index + 1}`,
            supplierId: supplier._id,
            supplierName: supplier.name,
            supplierCode: supplier.code,
            tier: (supplier as any).tier || 'tier1',
            assessmentDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
            factors: factors,
            overallScore: avgScore,
            riskLevel: riskLevel,
            notes: 'This is a sample risk assessment for demonstration purposes.',
            mitigationPlan: 'Sample mitigation plan: Regular monitoring and quarterly reviews.',
            assessedBy: 'John Doe'
          };
        });
        
        setSavedAssessments(mockAssessments);
        setLoading(false);
      } catch (err) {
        setError('Failed to load data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate overall score and risk level when risk factors change
  useEffect(() => {
    if (riskFactors.every(factor => factor.score > 0)) {
      const weightedScore = riskFactors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0);
      setOverallScore(weightedScore);
      
      let newRiskLevel: 'low' | 'medium' | 'high' = 'medium';
      if (weightedScore > RISK_LEVEL_THRESHOLDS.low) {
        newRiskLevel = 'low';
      } else if (weightedScore < RISK_LEVEL_THRESHOLDS.medium) {
        newRiskLevel = 'high';
      }
      
      setRiskLevel(newRiskLevel);
    }
  }, [riskFactors]);

  // Handle supplier selection change
  const handleSupplierChange = (_: any, newValue: Supplier | null) => {
    setSelectedSupplier(newValue);
    
    // Check if there's an existing assessment for this supplier
    if (newValue) {
      const existingAssessment = savedAssessments.find(a => a.supplierId === newValue._id);
      if (existingAssessment) {
        setActiveAssessment(existingAssessment);
        setRiskFactors([...existingAssessment.factors]);
        setNotes(existingAssessment.notes);
        setMitigationPlan(existingAssessment.mitigationPlan || '');
        setAssessor(existingAssessment.assessedBy);
        setOverallScore(existingAssessment.overallScore);
        setRiskLevel(existingAssessment.riskLevel);
      } else {
        resetAssessment();
      }
    } else {
      resetAssessment();
    }
  };

  // Reset the assessment form
  const resetAssessment = () => {
    setActiveAssessment(null);
    setRiskFactors([...DEFAULT_RISK_FACTORS]);
    setNotes('');
    setMitigationPlan('');
    setAssessor('');
    setOverallScore(0);
    setRiskLevel('medium');
  };

  // Handle score change for a risk factor
  const handleFactorScoreChange = (id: string, newValue: number | null) => {
    if (newValue === null) return;
    
    setRiskFactors(prev => 
      prev.map(factor => 
        factor.id === id ? { ...factor, score: newValue } : factor
      )
    );
  };

  // Handle weight change for a risk factor
  const handleFactorWeightChange = (id: string, newWeight: number) => {
    setRiskFactors(prev => 
      prev.map(factor => 
        factor.id === id ? { ...factor, weight: newWeight / 100 } : factor
      )
    );
  };

  // Handle save button click
  const handleSaveClick = () => {
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
    
    setShowSaveDialog(true);
  };

  // Handle save confirmation
  const handleSaveConfirm = () => {
    if (!selectedSupplier) return;
    
    const newAssessment: RiskAssessment = {
      id: activeAssessment?.id || `assess_${Date.now()}`,
      supplierId: selectedSupplier._id,
      supplierName: selectedSupplier.name,
      supplierCode: selectedSupplier.code,
      tier: (selectedSupplier as any).tier,
      assessmentDate: new Date().toISOString(),
      factors: [...riskFactors],
      overallScore,
      riskLevel,
      notes,
      mitigationPlan,
      assessedBy: assessor
    };
    
    if (activeAssessment) {
      // Update existing assessment
      setSavedAssessments(prev => 
        prev.map(a => a.id === activeAssessment.id ? newAssessment : a)
      );
    } else {
      // Add new assessment
      setSavedAssessments(prev => [...prev, newAssessment]);
    }
    
    setActiveAssessment(newAssessment);
    setShowSaveDialog(false);
    setSuccess('Risk assessment saved successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Handle delete assessment
  const handleDeleteAssessment = () => {
    if (!activeAssessment) return;
    
    setSavedAssessments(prev => prev.filter(a => a.id !== activeAssessment.id));
    resetAssessment();
    setSelectedSupplier(null);
    setSuccess('Risk assessment deleted successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Handle view details of an assessment
  const handleViewDetails = (assessment: RiskAssessment) => {
    const supplier = suppliers.find(s => s._id === assessment.supplierId);
    if (supplier) {
      setSelectedSupplier(supplier);
      setActiveAssessment(assessment);
      setRiskFactors([...assessment.factors]);
      setNotes(assessment.notes);
      setMitigationPlan(assessment.mitigationPlan || '');
      setAssessor(assessment.assessedBy);
      setOverallScore(assessment.overallScore);
      setRiskLevel(assessment.riskLevel);
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
    savedAssessments,
    activeAssessment,
    showSaveDialog,
    error,
    success,
    setNotes,
    setMitigationPlan,
    setAssessor,
    handleSupplierChange,
    handleFactorScoreChange,
    handleFactorWeightChange,
    handleSaveClick,
    handleSaveConfirm,
    handleDeleteAssessment,
    handleViewDetails,
    setShowSaveDialog
  };
};

export default useRiskAssessment; 