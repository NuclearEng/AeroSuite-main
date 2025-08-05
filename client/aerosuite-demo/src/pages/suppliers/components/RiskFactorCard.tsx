// Component for displaying and editing a risk factor
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Rating,
  Slider
} from '@mui/material';
import type { RiskFactorCardProps } from '../types';

const RiskFactorCard: React.FC<RiskFactorCardProps> = ({ 
  factor, 
  categoryInfo,
  onScoreChange,
  onWeightChange
}) => {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="h6">{factor.name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {factor.description}
            </Typography>
          </Box>
          <Chip 
            label={categoryInfo[factor.category].label} 
            size="small"
            sx={{ 
              backgroundColor: categoryInfo[factor.category].color,
              color: 'white'
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ minWidth: 120 }}>
            Risk Rating (1-5):
          </Typography>
          <Rating
            value={factor.score}
            onChange={(_, newValue) => onScoreChange(factor.id, newValue)}
            max={5}
            size="large"
          />
          <Typography variant="body2" sx={{ ml: 2 }}>
            {factor.score === 0 ? 'Not Rated' :
             factor.score === 1 ? 'Very High Risk' :
             factor.score === 2 ? 'High Risk' :
             factor.score === 3 ? 'Moderate Risk' :
             factor.score === 4 ? 'Low Risk' : 'Very Low Risk'}
          </Typography>
        </Box>
        
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ minWidth: 120 }}>
            Factor Weight:
          </Typography>
          <Slider
            value={factor.weight * 100}
            onChange={(_, newValue) => onWeightChange(factor.id, newValue as number)}
            min={5}
            max={30}
            step={5}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}%`}
            sx={{ maxWidth: 300 }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default RiskFactorCard; 