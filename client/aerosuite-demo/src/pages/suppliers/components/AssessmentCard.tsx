// Component for displaying a saved assessment card
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
  Button
} from '@mui/material';
import { Assessment as AssessmentIcon } from '@mui/icons-material';
import type { AssessmentCardProps } from '../types';

const AssessmentCard: React.FC<AssessmentCardProps> = ({
  assessment,
  onViewDetails
}) => {
  return (
    <Card variant="outlined" sx={{
      borderColor: assessment.riskLevel === 'high' ? '#f44336' : 
                   assessment.riskLevel === 'medium' ? '#ff9800' : '#4caf50'
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6">{assessment.supplierName}</Typography>
          <Chip 
            label={assessment.riskLevel.toUpperCase()} 
            color={assessment.riskLevel === 'low' ? 'success' : 
                  assessment.riskLevel === 'medium' ? 'warning' : 'error'}
            size="small"
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {assessment.supplierCode}
          </Typography>
          {assessment.tier && (
            <Chip 
              label={assessment.tier === 'tier1' ? 'Tier 1' : 
                    assessment.tier === 'tier2' ? 'Tier 2' : 'Tier 3'} 
              size="small" 
              sx={{ ml: 1 }}
            />
          )}
        </Box>
        
        <Divider sx={{ my: 1 }} />
        
        <Typography variant="body2">
          <strong>Score:</strong> {assessment.overallScore.toFixed(2)}
        </Typography>
        
        <Typography variant="body2">
          <strong>Date:</strong> {new Date(assessment.assessmentDate).toLocaleDateString()}
        </Typography>
        
        <Typography variant="body2">
          <strong>Assessed by:</strong> {assessment.assessedBy}
        </Typography>
        
        <Button
          variant="outlined"
          size="small"
          startIcon={<AssessmentIcon />}
          sx={{ mt: 2 }}
          onClick={() => onViewDetails(assessment)}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

export default AssessmentCard; 