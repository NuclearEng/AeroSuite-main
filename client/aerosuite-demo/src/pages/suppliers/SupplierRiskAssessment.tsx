import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip } from
'@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon } from
'@mui/icons-material';

// Import custom components and hooks
import useRiskAssessment from './hooks/useRiskAssessment';
import { CATEGORY_INFO } from './constants';
import SupplierSelector from './components/SupplierSelector';
import RiskFactorsList from './components/RiskFactorsList';
import AssessmentCard from './components/AssessmentCard';
import SaveConfirmationDialog from './components/SaveConfirmationDialog';

const SupplierRiskAssessment: React.FC = () => {
  const {
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
  } = useRiskAssessment();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <CircularProgress />
      </Box>);

  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Supplier Risk Assessment
      </Typography>
      
      <Typography variant="body1" paragraph>
        Evaluate supplier risks across multiple factors to identify potential vulnerabilities in your supply chain.
      </Typography>
      
      {error &&
      <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      }
      
      {success &&
      <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      }
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          
          <Grid sx={{ gridColumn: 'span 12' }}>
            <SupplierSelector
              suppliers={suppliers}
              selectedSupplier={selectedSupplier}
              onSupplierChange={handleSupplierChange} />

          </Grid>
          
          
          <Grid sx={{ gridColumn: 'span 12' }}>
            <TextField
              label="Assessor Name"
              value={assessor}
              onChange={(e) => setAssessor(e.target.value)}
              fullWidth
              required />

          </Grid>
          
          
          <RiskFactorsList
            riskFactors={riskFactors}
            categoryInfo={CATEGORY_INFO}
            onFactorScoreChange={handleFactorScoreChange}
            onFactorWeightChange={handleFactorWeightChange} />

          
          
          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
            <TextField
              label="Assessment Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={4}
              fullWidth />

          </Grid>
          
          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
            <TextField
              label="Risk Mitigation Plan"
              value={mitigationPlan}
              onChange={(e) => setMitigationPlan(e.target.value)}
              multiline
              rows={4}
              fullWidth />

          </Grid>
          
          
          <Grid sx={{ gridColumn: 'span 12', mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6">
                  Overall Risk Score: 
                  <Typography component="span" variant="h6" fontWeight="bold" sx={{ ml: 1 }}>
                    {overallScore.toFixed(2)}
                  </Typography>
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography variant="body1">Risk Level:</Typography>
                  <Chip
                    label={riskLevel.toUpperCase()}
                    color={riskLevel === 'low' ? 'success' :
                    riskLevel === 'medium' ? 'warning' : 'error'}
                    sx={{ ml: 1 }} />

                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                {activeAssessment &&
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteAssessment}>

                    Delete Assessment
                  </Button>
                }
                
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveClick}
                  disabled={
                  !selectedSupplier ||
                  riskFactors.some((factor) => factor.score === 0) ||
                  !assessor.trim()
                  }>

                  Save Assessment
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Recent Risk Assessments
        </Typography>
        
        <Grid container spacing={2}>
          {savedAssessments.length === 0 ?
          <Grid sx={{ gridColumn: 'span 12' }}>
              <Alert severity="info">
                No risk assessments have been saved yet.
              </Alert>
            </Grid> :

          savedAssessments.map((assessment) =>
          <Grid key={assessment.id} sx={{ gridColumn: { xs: 'span 12', md: 'span 6', lg: 'span 4' } }}>
                <AssessmentCard
              assessment={assessment}
              suppliers={suppliers}
              onViewDetails={handleViewDetails} />

              </Grid>
          )
          }
        </Grid>
      </Paper>
      
      
      <SaveConfirmationDialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onConfirm={handleSaveConfirm}
        supplier={selectedSupplier}
        riskLevel={riskLevel}
        overallScore={overallScore}
        activeAssessment={activeAssessment} />

    </Box>);

};

export default SupplierRiskAssessment;