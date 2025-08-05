// Type definitions for Supplier Risk Assessment

import type { Supplier } from '../../services/mockDataService';

export interface RiskFactor {
  id: string;
  name: string;
  description: string;
  weight: number;
  score: number;
  category: 'operational' | 'financial' | 'compliance' | 'geographic' | 'strategic';
}

export interface RiskAssessment {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  tier?: string;
  assessmentDate: string;
  factors: RiskFactor[];
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  notes: string;
  mitigationPlan?: string;
  assessedBy: string;
}

export interface CategoryInfo {
  [key: string]: {
    label: string;
    color: string;
  };
}

export interface RiskLevelThresholds {
  low: number;
  medium: number;
}

export interface RiskFactorCardProps {
  factor: RiskFactor;
  categoryInfo: CategoryInfo;
  onScoreChange: (id: string, newValue: number | null) => void;
  onWeightChange: (id: string, newWeight: number) => void;
}

export interface AssessmentCardProps {
  assessment: RiskAssessment;
  suppliers: Supplier[];
  onViewDetails: (assessment: RiskAssessment) => void;
}

export interface SaveConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  supplier: Supplier | null;
  riskLevel: 'low' | 'medium' | 'high';
  overallScore: number;
  activeAssessment: RiskAssessment | null;
}

export interface SupplierSelectorProps {
  suppliers: Supplier[];
  selectedSupplier: Supplier | null;
  onSupplierChange: (event: React.SyntheticEvent, newValue: Supplier | null) => void;
}

export interface RiskFactorsListProps {
  riskFactors: RiskFactor[];
  categoryInfo: CategoryInfo;
  onFactorScoreChange: (id: string, newValue: number | null) => void;
  onFactorWeightChange: (id: string, newWeight: number) => void;
} 