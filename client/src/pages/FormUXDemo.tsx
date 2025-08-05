import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider,
  Switch, 
  FormControlLabel,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  useTheme
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Restore as RestoreIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Lightbulb as LightbulbIcon,
  History as HistoryIcon,
  AutoFixHigh as AutoFixHighIcon
} from '@mui/icons-material';
import FormBuilder from '../components/common/FormBuilder';
import { FormSection } from '../components/common/FormBuilder';

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
      id={`form-ux-tabpanel-${index}`}
      aria-labelledby={`form-ux-tab-${index}`}
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
    id: `form-ux-tab-${index}`,
    'aria-controls': `form-ux-tabpanel-${index}`,
  };
}

// Simulated user data for smart suggestions
const userDataSuggestions = {
  companies: [
    { name: 'Acme Corporation', industry: 'manufacturing', website: 'https://acme.example.com' },
    { name: 'TechGlobal Inc.', industry: 'electronics', website: 'https://techglobal.example.com' },
    { name: 'Aerospace Dynamics', industry: 'aerospace', website: 'https://aerodyn.example.com' },
    { name: 'AutoParts Plus', industry: 'automotive', website: 'https://autoparts.example.com' }
  ],
  commonDomains: ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'company.com'],
  phoneFormats: ['+1 (###) ###-####', '###-###-####', '(###) ###-####']
};

const FormUXDemo: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [instantValidation, setInstantValidation] = useState(true);
  const [smartSuggestions, setSmartSuggestions] = useState(true);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [savedValues, setSavedValues] = useState<Record<string, any>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveSnackbarOpen, setSaveSnackbarOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | 'info'>('success');
  const [suggestions, setSuggestions] = useState<Record<string, any[]>>({});
  const [showSuggestionFor, setShowSuggestionFor] = useState<string | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [formHistory, setFormHistory] = useState<Array<{timestamp: Date, values: Record<string, any>}>>([]);
  
  // Define form sections with validation rules
  const formSections: FormSection[] = [
    {
      title: 'Company Information',
      description: 'Enter the company details',
      columns: 2,
      fields: [
        {
          name: 'companyName',
          label: 'Company Name',
          type: 'text',
          required: true,
          validation: [
            {
              type: 'required',
              message: 'Company name is required',
            },
            {
              type: 'minLength',
              value: 3,
              message: 'Name must be at least 3 characters',
            }
          ],
          placeholder: 'Enter company name',
          helperText: 'Full legal name of the company',
          tooltip: 'Enter the registered business name',
          endAdornment: smartSuggestions ? (
            <InputAdornment position="end">
              <IconButton 
                size="small" 
                onClick={() => handleShowSuggestions('companyName')}
                edge="end"
              >
                <LightbulbIcon fontSize="small" color="action" />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        },
        {
          name: 'industry',
          label: 'Industry',
          type: 'select',
          options: [
            { value: 'aerospace', label: 'Aerospace' },
            { value: 'automotive', label: 'Automotive' },
            { value: 'electronics', label: 'Electronics' },
            { value: 'manufacturing', label: 'Manufacturing' },
            { value: 'other', label: 'Other' },
          ],
          validation: [
            {
              type: 'required',
              message: 'Please select an industry',
            }
          ],
        },
        {
          name: 'website',
          label: 'Website',
          type: 'text',
          validation: [
            {
              type: 'pattern',
              value: '^(https?:\\/\\/)?([\\da-z.-]+)\\.([a-z.]{2,6})([\\/\\w.-]*)*\\/?$',
              message: 'Please enter a valid website URL',
              severity: 'warning',
            }
          ],
          placeholder: 'https://example.com',
          helperText: 'Company website address',
          onChange: (value) => {
            if (smartSuggestions && value && !value.startsWith('http')) {
              return `https://${value}`;
            }
            return value;
          },
        },
        {
          name: 'foundedYear',
          label: 'Founded Year',
          type: 'number',
          validation: [
            {
              type: 'min',
              value: 1900,
              message: 'Year must be after 1900',
              severity: 'warning',
            },
            {
              type: 'max',
              value: new Date().getFullYear(),
              message: 'Year cannot be in the future',
            }
          ],
          placeholder: 'YYYY',
        },
      ],
    },
    {
      title: 'Contact Information',
      description: 'Enter the primary contact details',
      columns: 2,
      fields: [
        {
          name: 'contactName',
          label: 'Contact Name',
          type: 'text',
          required: true,
          validation: [
            {
              type: 'required',
              message: 'Contact name is required',
            }
          ],
          placeholder: 'Full name of primary contact',
        },
        {
          name: 'contactTitle',
          label: 'Job Title',
          type: 'text',
          placeholder: 'e.g. CEO, Manager, Director',
        },
        {
          name: 'email',
          label: 'Email Address',
          type: 'email',
          required: true,
          validation: [
            {
              type: 'required',
              message: 'Email is required',
            },
            {
              type: 'email',
              message: 'Please enter a valid email address',
            }
          ],
          placeholder: 'email@example.com',
          endAdornment: smartSuggestions ? (
            <InputAdornment position="end">
              <IconButton 
                size="small" 
                onClick={() => handleShowSuggestions('email')}
                edge="end"
              >
                <LightbulbIcon fontSize="small" color="action" />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        },
        {
          name: 'phone',
          label: 'Phone Number',
          type: 'text',
          validation: [
            {
              type: 'pattern',
              value: '^[0-9+\\-\\s()]{8,20}$',
              message: 'Please enter a valid phone number',
              severity: 'warning',
            }
          ],
          placeholder: '+1 (555) 123-4567',
          endAdornment: smartSuggestions ? (
            <InputAdornment position="end">
              <IconButton 
                size="small" 
                onClick={() => handleShowSuggestions('phone')}
                edge="end"
              >
                <LightbulbIcon fontSize="small" color="action" />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        },
      ],
    },
    {
      title: 'Account Settings',
      description: 'Set up your account preferences',
      columns: 1,
      fields: [
        {
          name: 'username',
          label: 'Username',
          type: 'text',
          required: true,
          validation: [
            {
              type: 'required',
              message: 'Username is required',
            },
            {
              type: 'pattern',
              value: '^[a-zA-Z0-9_]{3,20}$',
              message: 'Username must be 3-20 characters and can only contain letters, numbers, and underscores',
            }
          ],
          placeholder: 'Choose a username',
          helperText: 'Used for logging into your account',
        },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          required: true,
          validation: [
            {
              type: 'required',
              message: 'Password is required',
            },
            {
              type: 'minLength',
              value: 8,
              message: 'Password must be at least 8 characters',
            },
            {
              type: 'pattern',
              value: '(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])',
              message: 'Password must include uppercase, lowercase, and numbers',
            }
          ],
          helperText: 'Create a strong password',
        },
        {
          name: 'confirmPassword',
          label: 'Confirm Password',
          type: 'password',
          required: true,
          validation: [
            {
              type: 'required',
              message: 'Please confirm your password',
            },
            {
              type: 'match',
              value: 'password',
              message: 'Passwords must match',
            }
          ],
        },
        {
          name: 'receiveUpdates',
          label: 'Receive product updates and newsletters',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
  ];

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || Object.keys(formValues).length === 0) return;
    
    // Clear previous timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    // Set new timer to save after 2 seconds of inactivity
    const timer = setTimeout(() => {
      handleAutoSave();
    }, 2000);
    
    setAutoSaveTimer(timer);
    
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [formValues, autoSaveEnabled]);

  // Handle auto-save
  const handleAutoSave = () => {
    // Don't save if form is empty or unchanged
    if (Object.keys(formValues).length === 0 || 
        JSON.stringify(formValues) === JSON.stringify(savedValues)) {
      return;
    }
    
    // Simulate saving to server
    setTimeout(() => {
      setSavedValues(formValues);
      const now = new Date();
      setLastSaved(now);
      
      // Add to history
      setFormHistory(prev => [
        { timestamp: now, values: { ...formValues } },
        ...prev.slice(0, 9) // Keep only last 10 entries
      ]);
      
      setSaveMessage('Form auto-saved');
      setSaveStatus('success');
      setSaveSnackbarOpen(true);
    }, 500);
  };

  // Handle manual save
  const handleManualSave = () => {
    // Simulate saving to server
    setSavedValues(formValues);
    const now = new Date();
    setLastSaved(now);
    
    // Add to history
    setFormHistory(prev => [
      { timestamp: now, values: { ...formValues } },
      ...prev.slice(0, 9) // Keep only last 10 entries
    ]);
    
    setSaveMessage('Form saved successfully');
    setSaveStatus('success');
    setSaveSnackbarOpen(true);
  };

  // Handle restore from history
  const handleRestore = (index: number) => {
    if (formHistory[index]) {
      setFormValues(formHistory[index].values);
      setSaveMessage('Form restored from history');
      setSaveStatus('info');
      setSaveSnackbarOpen(true);
    }
  };

  // Handle showing suggestions
  const handleShowSuggestions = (fieldName: string) => {
    if (fieldName === showSuggestionFor) {
      setShowSuggestionFor(null);
      return;
    }
    
    let fieldSuggestions: any[] = [];
    
    switch (fieldName) {
      case 'companyName':
        fieldSuggestions = userDataSuggestions.companies.map(company => company.name);
        break;
      case 'email':
        // Generate email suggestions based on contact name if available
        if (formValues.contactName) {
          const name = formValues.contactName.toLowerCase().replace(/\s+/g, '.');
          fieldSuggestions = userDataSuggestions.commonDomains.map(domain => `${name}@${domain}`);
        } else {
          fieldSuggestions = ['example@gmail.com', 'example@company.com'];
        }
        break;
      case 'phone':
        fieldSuggestions = userDataSuggestions.phoneFormats.map(format => 
          format.replace(/#+/g, (match) => {
            return Array(match.length).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
          })
        );
        break;
      default:
        fieldSuggestions = [];
    }
    
    setSuggestions({ ...suggestions, [fieldName]: fieldSuggestions });
    setShowSuggestionFor(fieldName);
  };

  // Handle applying a suggestion
  const handleApplySuggestion = (fieldName: string, value: any) => {
    setFormValues({ ...formValues, [fieldName]: value });
    setShowSuggestionFor(null);
  };

  // Handle form submission
  const handleSubmit = (values: Record<string, any>, isValid: boolean) => {
    setFormValues(values);
    
    if (isValid) {
      // Simulate form submission
      setTimeout(() => {
        setSaveMessage('Form submitted successfully');
        setSaveStatus('success');
        setSaveSnackbarOpen(true);
      }, 1000);
    } else {
      setSaveMessage('Please correct the errors before submitting');
      setSaveStatus('error');
      setSaveSnackbarOpen(true);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render suggestions
  const renderSuggestions = (fieldName: string) => {
    if (fieldName !== showSuggestionFor || !suggestions[fieldName] || suggestions[fieldName].length === 0) {
      return null;
    }
    
    return (
      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {suggestions[fieldName].map((suggestion, index) => (
          <Chip
            key={index}
            label={suggestion}
            size="small"
            color="primary"
            variant="outlined"
            onClick={() => handleApplySuggestion(fieldName, suggestion)}
            icon={<AutoFixHighIcon fontSize="small" />}
          />
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Enhanced Form UX Demo
      </Typography>
      
      <Typography variant="body1" paragraph>
        This demo showcases advanced form UX features including inline validation, auto-save functionality, and smart defaults/suggestions.
      </Typography>
      
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="form ux tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Interactive Form" {...a11yProps(0)} />
          <Tab label="Form History" {...a11yProps(1)} />
          <Tab label="Settings" {...a11yProps(2)} />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2 }}>
            {lastSaved && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <HistoryIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  Last saved: {lastSaved.toLocaleTimeString()}
                </Typography>
              </Box>
            )}
            
            <FormBuilder
              sections={formSections}
              onSubmit={handleSubmit}
              initialValues={formValues}
              validateOnChange={instantValidation}
              validateOnBlur={true}
              showProgressIndicator={true}
              instantValidation={instantValidation}
              submitButtonText="Submit Form"
              actions={
                <Button
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  onClick={handleManualSave}
                  sx={{ mr: 2 }}
                >
                  Save Progress
                </Button>
              }
            />
            
            {showSuggestionFor && renderSuggestions(showSuggestionFor)}
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Form History
          </Typography>
          
          {formHistory.length === 0 ? (
            <Alert severity="info">
              No form history available yet. Save the form to create history entries.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {formHistory.map((entry, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card variant="outlined">
                    <CardHeader
                      title={`Version ${formHistory.length - index}`}
                      subheader={entry.timestamp.toLocaleString()}
                      action={
                        <IconButton 
                          aria-label="restore" 
                          onClick={() => handleRestore(index)}
                          size="small"
                        >
                          <RestoreIcon />
                        </IconButton>
                      }
                    />
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Company: {entry.values.companyName || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Contact: {entry.values.contactName || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Email: {entry.values.email || 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Form Settings
          </Typography>
          
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Validation Settings
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={instantValidation}
                    onChange={(e) => setInstantValidation(e.target.checked)}
                  />
                }
                label="Instant Validation Feedback"
              />
              <Typography variant="body2" color="text.secondary">
                When enabled, validation feedback is shown immediately as you type.
              </Typography>
            </CardContent>
          </Card>
          
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Auto-Save Settings
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoSaveEnabled}
                    onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                  />
                }
                label="Enable Auto-Save"
              />
              <Typography variant="body2" color="text.secondary">
                When enabled, form progress is automatically saved after 2 seconds of inactivity.
              </Typography>
            </CardContent>
          </Card>
          
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Smart Suggestions
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={smartSuggestions}
                    onChange={(e) => setSmartSuggestions(e.target.checked)}
                  />
                }
                label="Enable Smart Suggestions"
              />
              <Typography variant="body2" color="text.secondary">
                When enabled, smart suggestions are provided for certain fields.
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>
      
      <Card>
        <CardHeader title="Form UX Best Practices" />
        <CardContent>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Inline Validation
              </Typography>
              <Typography variant="body2" paragraph>
                • Validate input as users type or when they leave a field<br />
                • Show clear error messages that explain how to fix the problem<br />
                • Use different severity levels (error, warning, info)<br />
                • Validate related fields together (e.g., password confirmation)
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                Auto-Save
              </Typography>
              <Typography variant="body2" paragraph>
                • Save form progress automatically after a period of inactivity<br />
                • Provide visual confirmation when auto-save occurs<br />
                • Allow users to manually save their progress<br />
                • Maintain form history for recovery
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Smart Defaults & Suggestions
              </Typography>
              <Typography variant="body2" paragraph>
                • Offer intelligent suggestions based on user input<br />
                • Pre-fill fields based on related information<br />
                • Format input automatically (e.g., phone numbers, URLs)<br />
                • Remember previous entries for returning users
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                Accessibility Considerations
              </Typography>
              <Typography variant="body2">
                • Ensure all validation messages are accessible to screen readers<br />
                • Maintain keyboard navigation throughout the form<br />
                • Use proper ARIA attributes for custom form controls<br />
                • Provide sufficient color contrast for all form elements
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      <Snackbar
        open={saveSnackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSaveSnackbarOpen(false)}
        message={saveMessage}
      >
        <Alert 
          onClose={() => setSaveSnackbarOpen(false)} 
          severity={saveStatus}
          sx={{ width: '100%' }}
        >
          {saveMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FormUXDemo; 