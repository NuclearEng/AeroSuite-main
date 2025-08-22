import React, { useState } from 'react';
import { 
  Grid, 
  Typography, 
  Box, 
  Divider,
  TextField,
  InputAdornment
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import RiskFactorCard from './RiskFactorCard';
import { RiskFactor } from '../hooks/useRiskAssessment';

interface RiskFactorsListProps {
  riskFactors: RiskFactor[];
  categoryInfo: Record<string, {
    label: string;
    color: string;
    description: string;
  }>;
  onFactorScoreChange: (factorId: string, newScore: number) => void;
  onFactorWeightChange: (factorId: string, newWeight: number) => void;
  disabled?: boolean;
}

const RiskFactorsList: React.FC<RiskFactorsListProps> = ({
  riskFactors,
  categoryInfo,
  onFactorScoreChange,
  onFactorWeightChange,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter factors based on search term
  const filteredFactors = React.useMemo(() => {
    if (!searchTerm.trim()) return riskFactors;
    
    const term = searchTerm.toLowerCase();
    return riskFactors.filter(factor => 
      factor.name.toLowerCase().includes(term) || 
      factor.description.toLowerCase().includes(term) ||
      categoryInfo[factor.category].label.toLowerCase().includes(term)
    );
  }, [riskFactors, searchTerm, categoryInfo]);
  
  // Group factors by category for organized display
  const groupedFactors = React.useMemo(() => {
    const grouped: Record<string, RiskFactor[]> = {};
    
    filteredFactors.forEach(factor => {
      if (!grouped[factor.category]) {
        grouped[factor.category] = [];
      }
      grouped[factor.category].push(factor);
    });
    
    return grouped;
  }, [filteredFactors]);

  // Calculate total weight to show a warning if not 100%
  const totalWeight = React.useMemo(() => {
    return riskFactors.reduce((sum, factor) => sum + factor.weight, 0);
  }, [riskFactors]);

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">
          Risk Factors
        </Typography>
        <Box>
          <Typography 
            variant="body2" 
            color={Math.abs(totalWeight - 1) > 0.01 ? 'warning.main' : 'success.main'}
          >
            Total Weight: {Math.round(totalWeight * 100)}%
            {Math.abs(totalWeight - 1) > 0.01 && ' (Should be 100%)'}
          </Typography>
        </Box>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        size="small"
        placeholder="Search risk factors..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        disabled={disabled}
      />
      
      {Object.keys(groupedFactors).length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          No risk factors found matching "{searchTerm}"
        </Typography>
      ) : (
        Object.entries(groupedFactors).map(([category, factors]) => (
          <Box key={category} sx={{ mb: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 2, 
              p: 1,
              bgcolor: `${categoryInfo[category].color}10`,
              borderRadius: 1
            }}>
              <Box 
                sx={{ 
                  width: 16, 
                  height: 16, 
                  borderRadius: '50%', 
                  bgcolor: categoryInfo[category].color,
                  mr: 2
                }} 
              />
              <Typography variant="subtitle1" fontWeight="medium">
                {categoryInfo[category].label} Risk Factors
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              {factors.map(factor => (
                <Grid item xs={12} md={6} lg={4} key={factor._id || factor.name}>
                  <RiskFactorCard
                    factor={factor}
                    categoryInfo={categoryInfo}
                    onScoreChange={onFactorScoreChange}
                    onWeightChange={onFactorWeightChange}
                    disabled={disabled}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}
    </Box>
  );
};

export default RiskFactorsList; 