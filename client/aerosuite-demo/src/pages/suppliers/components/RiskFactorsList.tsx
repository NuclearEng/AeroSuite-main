// Component for displaying a list of risk factors
import React from 'react';
import { Grid, Divider, Typography } from '@mui/material';
import type { RiskFactorsListProps } from '../types';
import RiskFactorCard from './RiskFactorCard';

const RiskFactorsList: React.FC<RiskFactorsListProps> = ({
  riskFactors,
  categoryInfo,
  onFactorScoreChange,
  onFactorWeightChange
}) => {
  return (
    <>
      <Grid sx={{ gridColumn: 'span 12' }}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>
          Risk Factor Assessment
        </Typography>
      </Grid>
      
      {riskFactors.map((factor) => (
        <Grid key={factor.id} sx={{ gridColumn: 'span 12' }}>
          <RiskFactorCard
            factor={factor}
            categoryInfo={categoryInfo}
            onScoreChange={onFactorScoreChange}
            onWeightChange={onFactorWeightChange}
          />
        </Grid>
      ))}
      
      <Grid sx={{ gridColumn: 'span 12' }}>
        <Divider sx={{ my: 2 }} />
      </Grid>
    </>
  );
};

export default RiskFactorsList; 