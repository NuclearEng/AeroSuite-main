import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Divider,
  Button,
  Stack,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Event as EventIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { RiskAssessment } from '../hooks/useRiskAssessment';

interface AssessmentCardProps {
  assessment: RiskAssessment;
  onViewDetails?: () => void;
  isActive?: boolean;
}

const AssessmentCard: React.FC<AssessmentCardProps> = ({
  assessment,
  onViewDetails,
  isActive = false
}) => {
  // Risk color mapping
  const riskColorMap = {
    low: '#4caf50',
    medium: '#ff9800',
    high: '#f44336'
  };
  
  // Risk icon mapping
  const riskIconMap = {
    low: <CheckCircleIcon fontSize="small" />,
    medium: <WarningIcon fontSize="small" />,
    high: <ErrorIcon fontSize="small" />
  };
  
  // Format date helper
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMM d, yyyy');
  };

  // Calculate progress bar value based on risk score
  const progressValue = (assessment.overallScore / 5) * 100;

  return (
    <Card 
      variant={isActive ? 'elevation' : 'outlined'}
      sx={{ 
        mb: 2,
        borderColor: isActive ? riskColorMap[assessment.riskLevel] : undefined,
        boxShadow: isActive ? `0 0 0 2px ${riskColorMap[assessment.riskLevel]}` : undefined,
        transition: 'all 0.2s'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h6" gutterBottom>
            Assessment Summary
          </Typography>
          <Chip 
            icon={riskIconMap[assessment.riskLevel]}
            label={`${assessment.riskLevel.toUpperCase()} RISK`}
            sx={{ 
              bgcolor: `${riskColorMap[assessment.riskLevel]}15`,
              color: riskColorMap[assessment.riskLevel],
              fontWeight: 'bold'
            }} 
          />
        </Box>
        
        <Box sx={{ mt: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Overall Risk Score
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {assessment.overallScore.toFixed(1)}/5.0
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progressValue} 
            sx={{ 
              height: 8, 
              borderRadius: 1,
              bgcolor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                bgcolor: riskColorMap[assessment.riskLevel]
              }
            }} 
          />
        </Box>
        
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EventIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
            <Typography variant="body2" component="span" color="text.secondary" sx={{ mr: 1 }}>
              Assessment Date:
            </Typography>
            <Typography variant="body2" component="span" fontWeight="medium">
              {formatDate(assessment.assessmentDate)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
            <Typography variant="body2" component="span" color="text.secondary" sx={{ mr: 1 }}>
              Assessed By:
            </Typography>
            <Typography variant="body2" component="span" fontWeight="medium">
              {assessment.assessedBy}
            </Typography>
          </Box>
          
          {assessment.nextReviewDate && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EventIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
              <Typography variant="body2" component="span" color="text.secondary" sx={{ mr: 1 }}>
                Next Review:
              </Typography>
              <Typography variant="body2" component="span" fontWeight="medium">
                {formatDate(assessment.nextReviewDate)}
              </Typography>
            </Box>
          )}
        </Stack>
        
        {assessment.notes && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 1.5 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Notes:
            </Typography>
            <Typography variant="body2" paragraph sx={{ ml: 1 }}>
              {assessment.notes.length > 100 
                ? `${assessment.notes.substring(0, 100)}...` 
                : assessment.notes}
            </Typography>
          </Box>
        )}
      </CardContent>
      
      {onViewDetails && (
        <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
          <Button 
            size="small" 
            onClick={onViewDetails} 
            variant={isActive ? 'contained' : 'text'}
            color={isActive ? 'primary' : 'inherit'}
          >
            {isActive ? 'Currently Viewing' : 'View Details'}
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

export default AssessmentCard; 