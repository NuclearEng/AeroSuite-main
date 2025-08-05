import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Grid,
  Divider
} from '@mui/material';
import AccessibilityAudit from '../../components/common/AccessibilityAudit';
import ColorContrastChecker from '../../components/common/ColorContrastChecker';
import AccessibilityThemeDemo from '../../components/common/AccessibilityThemeDemo';
import KeyboardNavigableDemo from '../../components/common/KeyboardNavigableDemo';
import ScreenReaderCompatibility from '../../components/common/ScreenReaderCompatibility';
import { 
  AccessibilityAuditResult, 
  AccessibilitySeverity,
  getAccessibilityIssuesByType,
  getFocusManagementIssues,
  getScreenReaderIssues
} from '../../utils/accessibilityAudit';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`accessibility-tabpanel-${index}`}
      aria-labelledby={`accessibility-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `accessibility-tab-${index}`,
    'aria-controls': `accessibility-tabpanel-${index}`,
  };
}

/**
 * Page for conducting accessibility audits and viewing results
 */
const AccessibilityAuditPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [targetSelector, setTargetSelector] = useState('');
  const [auditResults, setAuditResults] = useState<AccessibilityAuditResult | null>(null);
  const [focusIssues, setFocusIssues] = useState<any[] | null>(null);
  const [screenReaderIssues, setScreenReaderIssues] = useState<any[] | null>(null);
  const [selectedSeverities, setSelectedSeverities] = useState<AccessibilitySeverity[]>([
    AccessibilitySeverity.CRITICAL,
    AccessibilitySeverity.SERIOUS
  ]);
  const [selectedStandards, setSelectedStandards] = useState<string[]>([
    'wcag2a',
    'wcag2aa'
  ]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAuditComplete = (results: AccessibilityAuditResult) => {
    setAuditResults(results);
    
    // Get focus management issues
    getFocusManagementIssues().then(issues => {
      setFocusIssues(issues);
    });
    
    // Get screen reader issues
    getScreenReaderIssues().then(issues => {
      setScreenReaderIssues(issues);
    });
  };

  const handleSeverityChange = (severity: AccessibilitySeverity) => {
    setSelectedSeverities(prev => {
      if (prev.includes(severity)) {
        return prev.filter(s => s !== severity);
      } else {
        return [...prev, severity];
      }
    });
  };

  const handleStandardChange = (standard: string) => {
    setSelectedStandards(prev => {
      if (prev.includes(standard)) {
        return prev.filter(s => s !== standard);
      } else {
        return [...prev, standard];
      }
    });
  };

  // Function to run a focused audit
  const runFocusedAudit = async () => {
    const issues = await getFocusManagementIssues();
    setFocusIssues(issues);
    setTabValue(1); // Switch to Focus Management tab
  };

  // Function to run a screen reader audit
  const runScreenReaderAudit = async () => {
    const issues = await getScreenReaderIssues();
    setScreenReaderIssues(issues);
    setTabValue(2); // Switch to Screen Reader tab
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Accessibility Audit
      </Typography>
      
      <Typography variant="body1" paragraph>
        Run accessibility audits on your application to identify and fix accessibility issues.
        These audits check for compliance with WCAG 2.1 standards and provide suggestions for improvements.
      </Typography>
      
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="accessibility audit tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="General Audit" {...a11yProps(0)} />
          <Tab label="Focus Management" {...a11yProps(1)} />
          <Tab label="Screen Reader" {...a11yProps(2)} />
          <Tab label="Color Contrast" {...a11yProps(3)} />
          <Tab label="Theme Accessibility" {...a11yProps(4)} />
          <Tab label="Settings" {...a11yProps(5)} />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              General Accessibility Audit
            </Typography>
            <Typography variant="body2" paragraph>
              This audit checks for common accessibility issues across the entire page or a specific element.
            </Typography>
            
            <TextField
              label="Target Selector (optional)"
              placeholder="e.g., #main-content, .dashboard"
              helperText="Leave empty to audit the entire page"
              value={targetSelector}
              onChange={(e) => setTargetSelector(e.target.value)}
              fullWidth
              margin="normal"
              sx={{ mb: 2 }}
            />
            
            <AccessibilityAudit 
              targetSelector={targetSelector || undefined}
              onAuditComplete={handleAuditComplete}
            />
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Focus Management Audit
            </Typography>
            <Typography variant="body2" paragraph>
              This audit focuses on keyboard navigation and focus management issues.
            </Typography>
            
            <Button 
              variant="contained" 
              onClick={runFocusedAudit}
              sx={{ mb: 3 }}
            >
              Run Focus Management Audit
            </Button>
            
            {focusIssues && focusIssues.length > 0 ? (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Found {focusIssues.length} focus management {focusIssues.length === 1 ? 'issue' : 'issues'}
                </Typography>
                
                {/* Display focus issues */}
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {focusIssues.map((issue, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">
                        {issue.id}: {issue.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {issue.help}
                      </Typography>
                      <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                        Affected elements: {issue.nodes.length}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                    </Box>
                  ))}
                </Paper>
              </Box>
            ) : focusIssues === null ? (
              <Typography>Run the audit to see focus management issues</Typography>
            ) : (
              <Typography>No focus management issues found!</Typography>
            )}
            
            <Divider sx={{ my: 4 }} />
            
            <Typography variant="h6" gutterBottom>
              Keyboard Navigation Demo
            </Typography>
            <Typography variant="body2" paragraph>
              This demo shows how to implement keyboard navigation for different types of UI components.
              Try using the keyboard to navigate the components below.
            </Typography>
            
            <KeyboardNavigableDemo />
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Screen Reader Compatibility Audit
            </Typography>
            <Typography variant="body2" paragraph>
              This audit checks for issues that affect screen reader compatibility, such as missing ARIA attributes and improper semantic HTML.
            </Typography>
            
            <Button 
              variant="contained" 
              onClick={runScreenReaderAudit}
              sx={{ mb: 3 }}
            >
              Run Screen Reader Audit
            </Button>
            
            {screenReaderIssues && screenReaderIssues.length > 0 ? (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Found {screenReaderIssues.length} screen reader compatibility {screenReaderIssues.length === 1 ? 'issue' : 'issues'}
                </Typography>
                
                {/* Display screen reader issues */}
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {screenReaderIssues.map((issue, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">
                        {issue.id}: {issue.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {issue.help}
                      </Typography>
                      <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                        Affected elements: {issue.nodes.length}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                    </Box>
                  ))}
                </Paper>
              </Box>
            ) : screenReaderIssues === null ? (
              <Typography>Run the audit to see screen reader compatibility issues</Typography>
            ) : (
              <Typography>No screen reader compatibility issues found!</Typography>
            )}
            
            <Divider sx={{ my: 4 }} />
            
            <Typography variant="h6" gutterBottom>
              Screen Reader Compatibility Tools and Examples
            </Typography>
            
            <ScreenReaderCompatibility />
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Color Contrast Audit
            </Typography>
            <Typography variant="body2" paragraph>
              This audit checks for color contrast issues that may affect users with visual impairments.
              The WCAG guidelines require a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text.
            </Typography>
            
            <ColorContrastChecker />
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Theme Accessibility
            </Typography>
            <Typography variant="body2" paragraph>
              This tool demonstrates how the application theme has been optimized for accessibility.
              Toggle between the original and accessible theme to see the improvements in color contrast.
            </Typography>
            
            <AccessibilityThemeDemo />
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={5}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Audit Settings
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Severity Levels
                </Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={selectedSeverities.includes(AccessibilitySeverity.CRITICAL)}
                        onChange={() => handleSeverityChange(AccessibilitySeverity.CRITICAL)}
                      />
                    }
                    label="Critical"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={selectedSeverities.includes(AccessibilitySeverity.SERIOUS)}
                        onChange={() => handleSeverityChange(AccessibilitySeverity.SERIOUS)}
                      />
                    }
                    label="Serious"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={selectedSeverities.includes(AccessibilitySeverity.MODERATE)}
                        onChange={() => handleSeverityChange(AccessibilitySeverity.MODERATE)}
                      />
                    }
                    label="Moderate"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={selectedSeverities.includes(AccessibilitySeverity.MINOR)}
                        onChange={() => handleSeverityChange(AccessibilitySeverity.MINOR)}
                      />
                    }
                    label="Minor"
                  />
                </FormGroup>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Standards
                </Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={selectedStandards.includes('wcag2a')}
                        onChange={() => handleStandardChange('wcag2a')}
                      />
                    }
                    label="WCAG 2.1 A"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={selectedStandards.includes('wcag2aa')}
                        onChange={() => handleStandardChange('wcag2aa')}
                      />
                    }
                    label="WCAG 2.1 AA"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={selectedStandards.includes('wcag2aaa')}
                        onChange={() => handleStandardChange('wcag2aaa')}
                      />
                    }
                    label="WCAG 2.1 AAA"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={selectedStandards.includes('section508')}
                        onChange={() => handleStandardChange('section508')}
                      />
                    }
                    label="Section 508"
                  />
                </FormGroup>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Accessibility Resources
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom>
              WCAG Guidelines
            </Typography>
            <Typography variant="body2" paragraph>
              The Web Content Accessibility Guidelines (WCAG) provide a wide range of recommendations for making web content more accessible.
            </Typography>
            <Button 
              variant="outlined" 
              href="https://www.w3.org/WAI/standards-guidelines/wcag/" 
              target="_blank"
              rel="noopener noreferrer"
            >
              View WCAG Guidelines
            </Button>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom>
              Accessibility Testing Tools
            </Typography>
            <Typography variant="body2" paragraph>
              Learn about various tools available for testing web accessibility, including automated and manual testing methods.
            </Typography>
            <Button 
              variant="outlined" 
              href="https://www.w3.org/WAI/test-evaluate/" 
              target="_blank"
              rel="noopener noreferrer"
            >
              Explore Testing Tools
            </Button>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom>
              Accessibility Tutorials
            </Typography>
            <Typography variant="body2" paragraph>
              Access tutorials and training materials to learn how to implement accessible web design and development practices.
            </Typography>
            <Button 
              variant="outlined" 
              href="https://www.w3.org/WAI/tutorials/" 
              target="_blank"
              rel="noopener noreferrer"
            >
              View Tutorials
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default AccessibilityAuditPage; 