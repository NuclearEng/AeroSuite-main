import React from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Breadcrumbs,
  Link as MuiLink,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardHeader,
  Tab,
  Tabs,
  List,
  ListItem,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { Link } from 'react-router-dom';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  AssessmentOutlined as AssessmentIcon,
  History as HistoryIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Import custom components
import { PageHeader } from '../../components/common';
import useRiskAssessment, { CATEGORY_INFO } from './hooks/useRiskAssessment';
import RiskFactorsList from './components/RiskFactorsList';
import SupplierSelector from './components/SupplierSelector';
import AssessmentCard from './components/AssessmentCard';
import SaveConfirmationDialog from './components/SaveConfirmationDialog';

const SupplierRiskAssessment: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState(0);
  
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
    nextReviewDate,
    savedAssessments,
    activeAssessment,
    showSaveDialog,
    error,
    setNotes,
    setMitigationPlan,
    setAssessor,
    setNextReviewDate,
    handleSupplierChange,
    handleFactorScoreChange,
    handleFactorWeightChange,
    handleSaveClick,
    handleSaveConfirm,
    handleDeleteAssessment,
    handleViewAssessment,
    setShowSaveDialog,
    resetAssessment
  } = useRiskAssessment();

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading && suppliers.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl">
        <PageHeader
          title="Supplier Risk Assessment"
          subtitle="Evaluate and track risk factors for your suppliers"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Suppliers', href: '/suppliers' },
            { label: 'Risk Assessment' }
          ]}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Column - Assessment Form */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <SupplierSelector
                    suppliers={suppliers}
                    selectedSupplier={selectedSupplier}
                    onSupplierChange={handleSupplierChange}
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Assessor Name"
                    value={assessor}
                    onChange={(e) => setAssessor(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Next Review Date"
                    value={nextReviewDate}
                    onChange={(date: Date | null) => setNextReviewDate(date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: 'outlined'
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{ mb: 2 }}
              variant="fullWidth"
            >
              <Tab 
                label="Risk Factors" 
                icon={<AssessmentIcon />} 
                iconPosition="start"
              />
              <Tab 
                label="Notes & Mitigation" 
                icon={<HistoryIcon />} 
                iconPosition="start"
              />
            </Tabs>

            {activeTab === 0 && (
              <Paper sx={{ p: 3 }}>
                <RiskFactorsList
                  riskFactors={riskFactors}
                  categoryInfo={CATEGORY_INFO}
                  onFactorScoreChange={handleFactorScoreChange}
                  onFactorWeightChange={handleFactorWeightChange}
                  disabled={loading || !selectedSupplier}
                />
              </Paper>
            )}

            {activeTab === 1 && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Assessment Notes & Mitigation Plan
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Assessment Notes"
                      multiline
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={loading || !selectedSupplier}
                      placeholder="Enter any notes about this risk assessment..."
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Mitigation Plan"
                      multiline
                      rows={6}
                      value={mitigationPlan}
                      onChange={(e) => setMitigationPlan(e.target.value)}
                      disabled={loading || !selectedSupplier}
                      placeholder="Describe actions to mitigate identified risks..."
                    />
                  </Grid>
                </Grid>
              </Paper>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={resetAssessment}
                sx={{ mr: 2 }}
                disabled={loading || !selectedSupplier}
                startIcon={<RefreshIcon />}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveClick}
                disabled={loading || !selectedSupplier || riskFactors.some(f => f.score === 0) || !assessor}
                startIcon={<SaveIcon />}
              >
                {activeAssessment ? 'Update Assessment' : 'Save Assessment'}
              </Button>
            </Box>
          </Grid>

          {/* Right Column - Assessment Summary & History */}
          <Grid item xs={12} md={4}>
            {/* Current Assessment Summary */}
            {(selectedSupplier && overallScore > 0) && (
              <Card sx={{ mb: 3 }}>
                <CardHeader 
                  title="Current Assessment" 
                  subheader={selectedSupplier ? selectedSupplier.name : ''} 
                />
                <CardContent>
                  <AssessmentCard
                    assessment={{
                      _id: activeAssessment?._id,
                      supplierId: selectedSupplier._id,
                      assessmentDate: new Date(),
                      assessedBy: assessor,
                      factors: riskFactors,
                      overallScore,
                      riskLevel,
                      notes,
                      mitigationPlan,
                      nextReviewDate: nextReviewDate || undefined,
                      status: 'draft'
                    }}
                    isActive={true}
                  />
                </CardContent>
              </Card>
            )}

            {/* Assessment History */}
            <Card>
              <CardHeader 
                title="Assessment History" 
                subheader={
                  selectedSupplier 
                    ? `${savedAssessments.length} assessment${savedAssessments.length !== 1 ? 's' : ''} for ${selectedSupplier.name}`
                    : 'Select a supplier to view history'
                } 
              />
              <CardContent>
                {savedAssessments.length > 0 ? (
                  savedAssessments.map((assessment) => (
                    <AssessmentCard
                      key={assessment._id}
                      assessment={assessment}
                      onViewDetails={() => handleViewAssessment(assessment)}
                      isActive={activeAssessment?._id === assessment._id}
                    />
                  ))
                ) : selectedSupplier ? (
                  <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    No risk assessments found for this supplier
                  </Typography>
                ) : (
                  <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    Select a supplier to view assessment history
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Save Confirmation Dialog */}
        <SaveConfirmationDialog
          open={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          onConfirm={handleSaveConfirm}
          overallScore={overallScore}
          riskLevel={riskLevel}
          isUpdate={!!activeAssessment}
        />
      </Container>
    </LocalizationProvider>
  );
};

export default SupplierRiskAssessment; 