// Constants for Supplier Risk Assessment

import type { CategoryInfo, RiskFactor, RiskLevelThresholds } from './types';

// Default risk factors
export const DEFAULT_RISK_FACTORS: RiskFactor[] = [
  {
    id: '1',
    name: 'On-time Delivery',
    description: 'Evaluate the supplier\'s ability to deliver products or services according to agreed schedules',
    weight: 0.15,
    score: 0,
    category: 'operational'
  },
  {
    id: '2',
    name: 'Quality Consistency',
    description: 'Evaluate the supplier\'s ability to consistently meet quality standards',
    weight: 0.2,
    score: 0,
    category: 'operational'
  },
  {
    id: '3',
    name: 'Financial Stability',
    description: 'Evaluate the supplier\'s financial health and stability',
    weight: 0.15,
    score: 0,
    category: 'financial'
  },
  {
    id: '4',
    name: 'Regulatory Compliance',
    description: 'Evaluate the supplier\'s compliance with relevant regulations and standards',
    weight: 0.1,
    score: 0,
    category: 'compliance'
  },
  {
    id: '5',
    name: 'Geographic Risk',
    description: 'Evaluate risks associated with the supplier\'s location (natural disasters, political instability, etc.)',
    weight: 0.1,
    score: 0,
    category: 'geographic'
  },
  {
    id: '6',
    name: 'Capacity & Scalability',
    description: 'Evaluate the supplier\'s ability to scale production to meet changing demands',
    weight: 0.1,
    score: 0,
    category: 'operational'
  },
  {
    id: '7',
    name: 'Business Continuity',
    description: 'Evaluate the supplier\'s business continuity and disaster recovery plans',
    weight: 0.1,
    score: 0,
    category: 'strategic'
  },
  {
    id: '8',
    name: 'Communication & Responsiveness',
    description: 'Evaluate the supplier\'s communication effectiveness and responsiveness to issues',
    weight: 0.1,
    score: 0,
    category: 'operational'
  }
];

// Category labels and colors
export const CATEGORY_INFO: CategoryInfo = {
  operational: { label: 'Operational', color: '#2196f3' },
  financial: { label: 'Financial', color: '#4caf50' },
  compliance: { label: 'Compliance', color: '#ff9800' },
  geographic: { label: 'Geographic', color: '#9c27b0' },
  strategic: { label: 'Strategic', color: '#f44336' }
};

// Risk level thresholds
export const RISK_LEVEL_THRESHOLDS: RiskLevelThresholds = {
  low: 3.5,
  medium: 2.5
}; 