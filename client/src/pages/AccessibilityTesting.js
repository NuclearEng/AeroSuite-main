import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Link
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  AccessibilityNew as AccessibilityIcon
} from '@mui/icons-material';
import { runA11yTests, logA11yViolations } from '../utils/a11yTesting';
import useResponsive from '../hooks/useResponsive';

const AccessibilityTesting = () => {
  const [testResults, setTestResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState('current-page');
  const [customSelector, setCustomSelector] = useState('');
  const { isMobile } = useResponsive();
  const testAreaRef = useRef(null);

  const components = [
    { id: 'current-page', name: 'Current Page', selector: 'body' },
    { id: 'main-content', name: 'Main Content', selector: '#main-content' },
    { id: 'navigation', name: 'Navigation', selector: 'nav' },
    { id: 'dashboard', name: 'Dashboard', selector: '[aria-label="Dashboard heading"]' },
    { id: 'custom', name: 'Custom Selector', selector: '' }
  ];

  const runTest = async () => {
    setIsLoading(true);
    setTestResults(null);

    try {
      let elementToTest = null;

      if (selectedComponent === 'custom' && customSelector) {
        elementToTest = document.querySelector(customSelector);
        if (!elementToTest) {
          throw new Error(`No element found matching selector: ${customSelector}`);
        }
      } else {
        const component = components.find(c => c.id === selectedComponent);
        if (component) {
          elementToTest = document.querySelector(component.selector);
        }
      }

      const results = await runA11yTests(elementToTest);
      setTestResults(results);
      logA11yViolations(results);
    } catch (_error) {
      console.error('Error running accessibility test:', error);
      setTestResults({
        error: true,
        message: error.message,
        violations: [],
        passes: [],
        incomplete: [],
        inapplicable: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'critical':
        return 'error.dark';
      case 'serious':
        return 'error.main';
      case 'moderate':
        return 'warning.main';
      case 'minor':
        return 'info.main';
      default:
        return 'text.secondary';
    }
  };

  const getImpactIcon = (impact) => {
    switch (impact) {
      case 'critical':
      case 'serious':
        return <ErrorIcon color="error" />;
      case 'moderate':
        return <WarningIcon color="warning" />;
      case 'minor':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon color="disabled" />;
    }
  };

  const renderViolations = () => {
    if (!testResults || testResults.error) return null;

    if (testResults.violations.length === 0) {
      return (
        <Alert severity="success" sx={{ mt: 2 }}>
          No accessibility violations found!
        </Alert>
      );
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Violations ({testResults.violations.length})
        </Typography>
        {testResults.violations.map((violation, index) => (
          <Accordion key={`${violation.id}-${index}`}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`violation-${violation.id}-content`}
              id={`violation-${violation.id}-header`}
              sx={{ backgroundColor: `${getImpactColor(violation.impact)}15` }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {getImpactIcon(violation.impact)}
                <Typography sx={{ ml: 1, flexGrow: 1 }}>
                  {violation.help}
                </Typography>
                <Chip 
                  label={violation.impact} 
                  size="small" 
                  sx={{ 
                    backgroundColor: getImpactColor(violation.impact),
                    color: 'white',
                    ml: 1
                  }} 
                />
                <Chip 
                  label={`${violation.nodes.length} ${violation.nodes.length === 1 ? 'instance' : 'instances'}`} 
                  size="small" 
                  sx={{ ml: 1 }} 
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                {violation.description}
              </Typography>
              <Link 
                href={violation.helpUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                variant="body2"
              >
                Learn more about this issue
              </Link>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Affected Elements:
              </Typography>
              <List dense>
                {violation.nodes.map((node, nodeIndex) => (
                  <ListItem 
                    key={`node-${nodeIndex}`}
                    sx={{ 
                      backgroundColor: nodeIndex % 2 === 0 ? 'background.paper' : 'action.hover',
                      borderRadius: 1
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box component="pre" sx={{ 
                          overflow: 'auto', 
                          maxWidth: '100%',
                          p: 1,
                          backgroundColor: 'background.paper',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          fontSize: '0.75rem'
                        }}>
                          {node.html}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" component="div" color="error">
                            {node.failureSummary}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  const renderSummary = () => {
    if (!testResults || testResults.error) return null;

    const criticalCount = testResults.violations.filter(v => v.impact === 'critical').length;
    const seriousCount = testResults.violations.filter(v => v.impact === 'serious').length;
    const moderateCount = testResults.violations.filter(v => v.impact === 'moderate').length;
    const minorCount = testResults.violations.filter(v => v.impact === 'minor').length;

    return (
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: criticalCount > 0 ? 'error.dark' : 'success.light' }}>
            <Typography variant="h6" sx={{ color: 'white' }}>{criticalCount}</Typography>
            <Typography variant="body2" sx={{ color: 'white' }}>Critical</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: seriousCount > 0 ? 'error.main' : 'success.light' }}>
            <Typography variant="h6" sx={{ color: 'white' }}>{seriousCount}</Typography>
            <Typography variant="body2" sx={{ color: 'white' }}>Serious</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: moderateCount > 0 ? 'warning.main' : 'success.light' }}>
            <Typography variant="h6" sx={{ color: 'white' }}>{moderateCount}</Typography>
            <Typography variant="body2" sx={{ color: 'white' }}>Moderate</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: minorCount > 0 ? 'info.main' : 'success.light' }}>
            <Typography variant="h6" sx={{ color: 'white' }}>{minorCount}</Typography>
            <Typography variant="body2" sx={{ color: 'white' }}>Minor</Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AccessibilityIcon sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Accessibility Testing
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Configuration
        </Typography>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="component-select-label">Component to Test</InputLabel>
              <Select
                labelId="component-select-label"
                id="component-select"
                value={selectedComponent}
                label="Component to Test"
                onChange={(e) => setSelectedComponent(e.target.value)}
              >
                {components.map((component) => (
                  <MenuItem key={component.id} value={component.id}>
                    {component.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {selectedComponent === 'custom' && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CSS Selector"
                value={customSelector}
                onChange={(e) => setCustomSelector(e.target.value)}
                placeholder="e.g., #dashboard, .card, [role='navigation']"
                helperText="Enter a valid CSS selector"
              />
            </Grid>
          )}
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={runTest}
              disabled={isLoading || (selectedComponent === 'custom' && !customSelector)}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AccessibilityIcon />}
            >
              {isLoading ? 'Running Test...' : 'Run Accessibility Test'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {testResults && testResults.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {testResults.message || 'An error occurred while running the accessibility test.'}
        </Alert>
      )}

      {testResults && !testResults.error && (
        <Paper sx={{ p: 3 }} ref={testAreaRef}>
          <Typography variant="h6" gutterBottom>
            Test Results
          </Typography>
          {renderSummary()}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Chip 
              icon={<CheckCircleIcon />} 
              label={`${testResults.passes.length} Passes`} 
              color="success" 
              sx={{ mb: 1, mr: 1 }}
            />
            <Chip 
              icon={<InfoIcon />} 
              label={`${testResults.incomplete.length} Incomplete`} 
              color="info" 
              sx={{ mb: 1, mr: 1 }}
            />
            <Chip 
              icon={<InfoIcon />} 
              label={`${testResults.inapplicable.length} Not Applicable`} 
              color="default" 
              sx={{ mb: 1 }}
            />
          </Box>
          {renderViolations()}
        </Paper>
      )}
    </Box>
  );
};

export default AccessibilityTesting; 