import React, { useState } from 'react';
import { Box, Typography, Container, Divider, Paper, Tabs, Tab } from '@mui/material';
import ColorContrastAudit from '../../components/ui-library/organisms/ColorContrastAudit';
import ScreenReaderCompatibility from '../../components/common/ScreenReaderCompatibility';

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
      id={`accessibility-audit-tabpanel-${index}`}
      aria-labelledby={`accessibility-audit-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `accessibility-audit-tab-${index}`,
    'aria-controls': `accessibility-audit-tabpanel-${index}`,
  };
}

/**
 * Page for displaying accessibility audit tools
 */
const AccessibilityAudit: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Accessibility Audit Tools
        </Typography>
        
        <Typography variant="body1" paragraph>
          These tools help identify and fix accessibility issues in the application.
          Use them to ensure compliance with WCAG 2.1 accessibility guidelines.
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Paper elevation={2} sx={{ mb: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="accessibility audit tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Color Contrast" {...a11yProps(0)} />
              <Tab label="Screen Reader Compatibility" {...a11yProps(1)} />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            <ColorContrastAudit />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <ScreenReaderCompatibility />
          </TabPanel>
        </Paper>
        
        <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
          About Accessibility Auditing
        </Typography>
        
        <Typography variant="body1" paragraph>
          Regular accessibility audits are essential to ensure that all users, including those with disabilities,
          can effectively use the application. These tools check for common accessibility issues and provide
          recommendations for improvements.
        </Typography>
        
        <Typography variant="body1" paragraph>
          The color contrast audit checks that text colors have sufficient contrast against their background
          colors according to WCAG 2.1 guidelines. This ensures that text is readable for users with visual
          impairments or color blindness.
        </Typography>
        
        <Typography variant="body1" paragraph>
          The screen reader compatibility tools help test and improve how screen readers interpret your content,
          ensuring that users with visual impairments can navigate and understand your application effectively.
        </Typography>
        
        <Typography variant="body1" paragraph>
          For more comprehensive accessibility testing, consider using:
        </Typography>
        
        <ul>
          <li>
            <Typography variant="body1">
              Screen readers like NVDA, JAWS, or VoiceOver to test screen reader compatibility
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Keyboard-only navigation testing to ensure all functionality is accessible without a mouse
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Automated tools like axe-core (already integrated in our testing suite)
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Browser extensions like Wave or Lighthouse for additional accessibility checks
            </Typography>
          </li>
        </ul>
      </Box>
    </Container>
  );
};

export default AccessibilityAudit; 