import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Rating,
  Box,
  Slider,
  Chip,
  Tooltip,
  Stack,
  Divider
} from '@mui/material';
import { InfoOutlined as InfoIcon } from '@mui/icons-material';
import { RiskFactor } from '../hooks/useRiskAssessment';

interface RiskFactorCardProps {
  factor: RiskFactor;
  categoryInfo: Record<string, {
    label: string;
    color: string;
    description: string;
  }>;
  onScoreChange: (factorId: string, newScore: number) => void;
  onWeightChange: (factorId: string, newWeight: number) => void;
  disabled?: boolean;
}

const RiskFactorCard: React.FC<RiskFactorCardProps> = ({
  factor,
  categoryInfo,
  onScoreChange,
  onWeightChange,
  disabled = false
}) => {
  const factorId = factor._id || factor.name;
  const category = categoryInfo[factor.category];
  
  // Convert weight from decimal to percentage for the slider
  const weightPercentage = Math.round(factor.weight * 100);

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 2,
        borderLeft: `4px solid ${category.color}`,
        opacity: disabled ? 0.7 : 1,
        transition: 'all 0.2s',
        '&:hover': !disabled ? {
          boxShadow: 2,
          transform: 'translateY(-2px)'
        } : {}
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="h6" component="div" gutterBottom>
            {factor.name}
          </Typography>
          <Chip 
            label={category.label} 
            size="small" 
            sx={{ 
              bgcolor: `${category.color}20`, 
              color: category.color,
              fontWeight: 'medium'
            }} 
          />
        </Stack>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1, mr: 1 }}>
            {factor.description}
          </Typography>
          <Tooltip title={category.description} arrow>
            <InfoIcon fontSize="small" color="action" />
          </Tooltip>
        </Box>
        
        <Divider sx={{ my: 1.5 }} />
        
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Risk Rating
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {factor.score === 0 ? 'Not rated' : `${factor.score}/5`}
            </Typography>
          </Box>
          <Rating
            name={`rating-${factorId}`}
            value={factor.score}
            precision={1}
            onChange={(_, newValue) => {
              if (newValue !== null) {
                onScoreChange(factorId, newValue);
              }
            }}
            disabled={disabled}
          />
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            {factor.score >= 4 ? 'Low risk' : 
             factor.score >= 3 ? 'Moderate risk' : 
             factor.score >= 2 ? 'Medium risk' : 
             factor.score >= 1 ? 'High risk' : 'Not rated'}
          </Typography>
        </Box>
        
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Factor Weight
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {weightPercentage}%
            </Typography>
          </Box>
          <Slider
            size="small"
            value={weightPercentage}
            min={5}
            max={30}
            step={5}
            onChange={(_, newValue) => {
              onWeightChange(factorId, newValue as number);
            }}
            disabled={disabled}
            marks={[
              { value: 5, label: '5%' },
              { value: 15, label: '15%' },
              { value: 30, label: '30%' }
            ]}
          />
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            {weightPercentage <= 10 ? 'Low impact' : 
             weightPercentage <= 20 ? 'Medium impact' : 
             'High impact'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RiskFactorCard; 