import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Button, 
  TextField, 
  FormControlLabel, 
  Switch, 
  Card, 
  CardContent, 
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip,
  Tooltip,
  Grid,
  Link,
  Tabs,
  Tab,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Accessibility as AccessibilityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Help as HelpIcon,
  AriaHidden as AriaHiddenIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { SROnly } from '../../utils/accessibility';

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
      id={`screen-reader-tabpanel-${index}`}
      aria-labelledby={`screen-reader-tab-${index}`}
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
    id: `screen-reader-tab-${index}`,
    'aria-controls': `screen-reader-tabpanel-${index}`,
  };
}

/**
 * ScreenReaderCompatibility component
 * 
 * This component provides tools and examples to test and improve screen reader compatibility
 * in the application. It includes examples of common screen reader patterns and best practices.
 */
const ScreenReaderCompatibility: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [announceMessage, setAnnounceMessage] = useState('');
  const [showLiveRegionMessage, setShowLiveRegionMessage] = useState(false);
  const [liveRegionPoliteness, setLiveRegionPoliteness] = useState<'polite' | 'assertive'>('polite');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAnnounce = () => {
    setShowLiveRegionMessage(true);
    setTimeout(() => {
      setShowLiveRegionMessage(false);
    }, 5000);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Screen Reader Compatibility Testing
      </Typography>
      
      <Typography variant="body1" paragraph>
        This tool helps test and improve screen reader compatibility in the application.
        Use it to ensure that all content is properly accessible to users who rely on screen readers.
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="screen reader compatibility tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Testing Guide" {...a11yProps(0)} />
          <Tab label="Common Patterns" {...a11yProps(1)} />
          <Tab label="Live Regions" {...a11yProps(2)} />
          <Tab label="ARIA Examples" {...a11yProps(3)} />
          <Tab label="Semantic HTML" {...a11yProps(4)} />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h5" gutterBottom>
            Screen Reader Testing Guide
          </Typography>
          
          <Typography variant="body1" paragraph>
            Follow these steps to test your components with screen readers:
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Install a screen reader" 
                secondary="Use NVDA (Windows), VoiceOver (Mac), or JAWS (Windows) for testing"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Navigate with keyboard only" 
                secondary="Use Tab, Shift+Tab, Enter, Space, and arrow keys to navigate"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Check reading order" 
                secondary="Ensure content is read in a logical order"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Verify form labels" 
                secondary="All form controls should have proper labels that are announced"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Test dynamic content" 
                secondary="Updates should be properly announced with live regions"
              />
            </ListItem>
          </List>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Remember that screen reader users rely on keyboard navigation and cannot see visual cues.
              All information must be conveyed through text that can be read by screen readers.
            </Typography>
          </Alert>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h5" gutterBottom>
            Common Screen Reader Patterns
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Hidden Text for Context" />
                <CardContent>
                  <Typography variant="body2" paragraph>
                    Sometimes visual users can infer context that screen reader users cannot.
                    Add hidden text for screen readers in these cases:
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Button variant="contained">
                      Edit
                      <SROnly>user profile</SROnly>
                    </Button>
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary">
                    The button above includes hidden text "user profile" that's only announced to screen readers
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Descriptive Link Text" />
                <CardContent>
                  <Typography variant="body2" paragraph>
                    Screen reader users often navigate by links. Avoid generic "click here" links:
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Bad: <Link href="#">Click here</Link> to view documentation
                    </Typography>
                    
                    <Typography variant="body2">
                      Good: View the <Link href="#">accessibility documentation</Link>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Form Input Labels" />
                <CardContent>
                  <Typography variant="body2" paragraph>
                    All form inputs must have proper labels:
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <TextField
                      id="name-input"
                      label="Full Name"
                      variant="outlined"
                      fullWidth
                      margin="normal"
                    />
                    
                    <TextField
                      id="email-input"
                      label="Email Address"
                      variant="outlined"
                      fullWidth
                      margin="normal"
                      aria-describedby="email-helper-text"
                    />
                    <Typography id="email-helper-text" variant="caption" color="text.secondary">
                      We'll never share your email with anyone else.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Image Alt Text" />
                <CardContent>
                  <Typography variant="body2" paragraph>
                    All meaningful images must have alt text:
                  </Typography>
                  
                  <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Meaningful image with alt text:
                      </Typography>
                      <Box 
                        component="img" 
                        src="https://via.placeholder.com/150" 
                        alt="Company logo" 
                        sx={{ display: 'block', mt: 1 }}
                      />
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Decorative image with empty alt:
                      </Typography>
                      <Box 
                        component="img" 
                        src="https://via.placeholder.com/150" 
                        alt="" 
                        sx={{ display: 'block', mt: 1 }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h5" gutterBottom>
            Live Regions
          </Typography>
          
          <Typography variant="body1" paragraph>
            Live regions announce dynamic content changes to screen reader users.
            They are essential for notifications, alerts, and other dynamic updates.
          </Typography>
          
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardHeader title="Test Live Region Announcements" />
            <CardContent>
              <TextField
                label="Message to announce"
                fullWidth
                margin="normal"
                value={announceMessage}
                onChange={(e) => setAnnounceMessage(e.target.value)}
              />
              
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={liveRegionPoliteness === 'assertive'}
                      onChange={(e) => setLiveRegionPoliteness(e.target.checked ? 'assertive' : 'polite')}
                    />
                  }
                  label="Assertive (interrupt user)"
                />
                
                <Button
                  variant="contained"
                  onClick={handleAnnounce}
                  disabled={!announceMessage}
                >
                  Announce Message
                </Button>
              </Box>
              
              {showLiveRegionMessage && (
                <Box
                  aria-live={liveRegionPoliteness}
                  aria-atomic="true"
                  sx={{ mt: 2, p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}
                >
                  {announceMessage}
                </Box>
              )}
              
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Use "polite" for most updates to avoid interrupting the user.
                  Only use "assertive" for critical information that requires immediate attention.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
          
          <Typography variant="h6" gutterBottom>
            Live Region Implementation Example:
          </Typography>
          
          <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, overflow: 'auto' }}>
            <pre>
              {`// React component with live region
const NotificationSystem = () => {
  const [message, setMessage] = useState('');
  
  // Function to show a notification
  const showNotification = (text) => {
    setMessage(text);
    
    // Clear after 5 seconds
    setTimeout(() => {
      setMessage('');
    }, 5000);
  };
  
  return (
    <>
      {/* Your UI components */}
      
      {/* Live region for announcements */}
      {message && (
        <div 
          aria-live="polite"
          aria-atomic="true"
        >
          {message}
        </div>
      )}
    </>
  );
};`}
            </pre>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h5" gutterBottom>
            ARIA Examples
          </Typography>
          
          <Typography variant="body1" paragraph>
            ARIA (Accessible Rich Internet Applications) attributes provide additional semantics for screen readers.
            Here are common ARIA patterns used in the application:
          </Typography>
          
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="aria-landmarks-content"
              id="aria-landmarks-header"
            >
              <Typography variant="subtitle1">ARIA Landmarks</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                Landmarks help screen reader users navigate between major sections of the page:
              </Typography>
              
              <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, overflow: 'auto' }}>
                <pre>
                  {`// Common ARIA landmarks
<header role="banner">Main Header</header>
<nav role="navigation">Main Navigation</nav>
<main role="main">Main Content</main>
<aside role="complementary">Sidebar Content</aside>
<footer role="contentinfo">Footer</footer>
<form role="search">Search Form</form>`}
                </pre>
              </Box>
              
              <Typography variant="body2" sx={{ mt: 2 }}>
                Note: Modern HTML5 elements like <code>header</code>, <code>nav</code>, <code>main</code>, etc. 
                have implicit landmark roles, so explicit roles are often unnecessary.
              </Typography>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="aria-labels-content"
              id="aria-labels-header"
            >
              <Typography variant="subtitle1">ARIA Labeling</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                ARIA labeling provides accessible names for elements:
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardHeader title="aria-label" />
                    <CardContent>
                      <Button 
                        aria-label="Close dialog"
                        sx={{ minWidth: 'auto', p: 1 }}
                      >
                        ✕
                      </Button>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        The × button has an aria-label="Close dialog"
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardHeader title="aria-labelledby" />
                    <CardContent>
                      <Typography id="slider-label" variant="body2">
                        Volume
                      </Typography>
                      <Box 
                        sx={{ 
                          height: 4, 
                          width: '100%', 
                          bgcolor: 'grey.300', 
                          position: 'relative',
                          mt: 1
                        }}
                        role="slider"
                        aria-labelledby="slider-label"
                        aria-valuenow={50}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        tabIndex={0}
                      >
                        <Box 
                          sx={{ 
                            position: 'absolute', 
                            height: '100%', 
                            width: '50%', 
                            bgcolor: 'primary.main' 
                          }} 
                        />
                      </Box>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        The slider is labeled by the "Volume" text via aria-labelledby
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="aria-states-content"
              id="aria-states-header"
            >
              <Typography variant="subtitle1">ARIA States</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                ARIA states communicate the current condition of elements:
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Chip 
                  label="aria-expanded" 
                  aria-expanded="true"
                  variant="outlined" 
                  onClick={() => {}}
                />
                <Chip 
                  label="aria-selected" 
                  aria-selected="true"
                  variant="outlined" 
                  onClick={() => {}}
                />
                <Chip 
                  label="aria-checked" 
                  aria-checked="true"
                  variant="outlined" 
                  onClick={() => {}}
                />
                <Chip 
                  label="aria-disabled" 
                  aria-disabled="true"
                  variant="outlined" 
                  onClick={() => {}}
                />
                <Chip 
                  label="aria-pressed" 
                  aria-pressed="true"
                  variant="outlined" 
                  onClick={() => {}}
                />
              </Box>
              
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Always keep ARIA states updated with JavaScript when the UI changes.
                  Outdated ARIA states can confuse screen reader users.
                </Typography>
              </Alert>
            </AccordionDetails>
          </Accordion>
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h5" gutterBottom>
            Semantic HTML
          </Typography>
          
          <Typography variant="body1" paragraph>
            Using semantic HTML elements provides built-in accessibility benefits.
            Always prefer semantic HTML over generic divs with ARIA when possible.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Headings Structure" />
                <CardContent>
                  <Typography variant="body2" paragraph>
                    Proper heading structure creates a document outline for screen reader navigation:
                  </Typography>
                  
                  <Box sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'primary.main' }}>
                    <Typography variant="h6" gutterBottom>h1: Page Title</Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>h2: Section Heading</Typography>
                      <Box sx={{ pl: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>h3: Subsection Heading</Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Screen reader users can navigate between headings to quickly understand page structure.
                      Never skip heading levels (e.g., h1 to h3).
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Lists" />
                <CardContent>
                  <Typography variant="body2" paragraph>
                    Use proper list elements for groups of related items:
                  </Typography>
                  
                  <Typography variant="subtitle2">Unordered List:</Typography>
                  <ul>
                    <li>List item 1</li>
                    <li>List item 2</li>
                    <li>List item 3</li>
                  </ul>
                  
                  <Typography variant="subtitle2">Ordered List:</Typography>
                  <ol>
                    <li>First step</li>
                    <li>Second step</li>
                    <li>Third step</li>
                  </ol>
                  
                  <Typography variant="subtitle2">Description List:</Typography>
                  <dl>
                    <dt>Term 1</dt>
                    <dd>Definition 1</dd>
                    <dt>Term 2</dt>
                    <dd>Definition 2</dd>
                  </dl>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Tables" />
                <CardContent>
                  <Typography variant="body2" paragraph>
                    Use proper table markup for tabular data:
                  </Typography>
                  
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <caption>Monthly Sales Data</caption>
                      <thead>
                        <tr>
                          <th scope="col">Month</th>
                          <th scope="col">Sales</th>
                          <th scope="col">Growth</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <th scope="row">January</th>
                          <td>$10,000</td>
                          <td>5%</td>
                        </tr>
                        <tr>
                          <th scope="row">February</th>
                          <td>$12,000</td>
                          <td>20%</td>
                        </tr>
                      </tbody>
                    </table>
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Note the use of caption, thead, tbody, th with scope attributes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Buttons vs. Links" />
                <CardContent>
                  <Typography variant="body2" paragraph>
                    Use the right element for the right job:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Button variant="contained">
                        Save Changes (button)
                      </Button>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Buttons are for actions within the page
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Link href="#">
                        View Documentation (link)
                      </Link>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Links are for navigation to other pages
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
      
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2">
          <strong>Remember:</strong> Screen reader compatibility is an ongoing process. Test regularly with actual screen readers
          and incorporate feedback from users with disabilities to continuously improve accessibility.
        </Typography>
      </Alert>
      
      <Typography variant="h5" gutterBottom>
        Resources
      </Typography>
      
      <List>
        <ListItem>
          <ListItemIcon>
            <InfoIcon />
          </ListItemIcon>
          <ListItemText 
            primary="WebAIM Screen Reader Survey" 
            secondary="Research on screen reader usage patterns"
          />
          <Link href="https://webaim.org/projects/screenreadersurvey9/" target="_blank" rel="noopener">
            Visit
          </Link>
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <InfoIcon />
          </ListItemIcon>
          <ListItemText 
            primary="ARIA Authoring Practices Guide" 
            secondary="Patterns for accessible components"
          />
          <Link href="https://www.w3.org/WAI/ARIA/apg/" target="_blank" rel="noopener">
            Visit
          </Link>
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <InfoIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Screen Reader Keyboard Shortcuts" 
            secondary="Keyboard commands for popular screen readers"
          />
          <Link href="https://dequeuniversity.com/screenreaders/" target="_blank" rel="noopener">
            Visit
          </Link>
        </ListItem>
      </List>
    </Box>
  );
};

export default ScreenReaderCompatibility; 