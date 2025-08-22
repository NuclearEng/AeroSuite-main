import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Divider,
  Card,
  CardContent,
  CardHeader,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Star as StarIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useAnimation, useStaggeredAnimation, useHoverAnimation } from '../hooks/useAnimation';
import { animationPresets, prefersReducedMotion } from '../utils/animationUtils';
import AnimatedButton from '../components/common/AnimatedButton';
import AnimatedFeedback from '../components/common/AnimatedFeedback';

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
      id={`micro-interactions-tabpanel-${index}`}
      aria-labelledby={`micro-interactions-tab-${index}`}
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
    id: `micro-interactions-tab-${index}`,
    'aria-controls': `micro-interactions-tabpanel-${index}`,
  };
}

/**
 * Demo page for micro-interactions
 */
const MicroInteractionsDemo: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [likedItems, setLikedItems] = useState<number[]>([]);
  const [showReducedMotion, setShowReducedMotion] = useState(prefersReducedMotion());
  
  // Animation hooks
  const fadeIn = useAnimation('fadeIn', { duration: 500 });
  const slideIn = useAnimation('slideInBottom', { duration: 500 });
  const listAnimations = useStaggeredAnimation('fadeIn', 5, { duration: 400 });
  const hoverStyles = useHoverAnimation({
    transform: 'scale(1.05)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  });
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle button click
  const handleButtonClick = (type: 'success' | 'error' | 'loading') => {
    if (type === 'loading') {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 1500);
      }, 1500);
    } else if (type === 'success') {
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 1500);
    } else {
      setIsError(true);
      setTimeout(() => setIsError(false), 1500);
    }
  };
  
  // Handle feedback click
  const handleFeedbackClick = (type: 'success' | 'error' | 'info' | 'warning') => {
    setFeedbackType(type);
    setShowFeedback(true);
  };
  
  // Handle like toggle
  const handleLikeToggle = (index: number) => {
    if (likedItems.includes(index)) {
      setLikedItems(likedItems.filter(item => item !== index));
    } else {
      setLikedItems([...likedItems, index]);
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={fadeIn.style}>
        <Typography variant="h4" component="h1" gutterBottom>
          Micro-Interactions Demo
        </Typography>
        
        <Typography variant="body1" paragraph>
          This page demonstrates the various micro-interactions and animations available in AeroSuite.
          These subtle animations and feedback effects enhance the user experience by providing visual cues
          and making the interface feel more responsive and engaging.
        </Typography>
      </Box>
      
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <FormControlLabel
          control={
            <Switch
              checked={showReducedMotion}
              onChange={(e) => setShowReducedMotion(e.target.checked)}
            />
          }
          label="Simulate Reduced Motion"
        />
      </Box>
      
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="micro-interactions tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Button Interactions" {...a11yProps(0)} />
          <Tab label="Feedback Animations" {...a11yProps(1)} />
          <Tab label="List & Card Animations" {...a11yProps(2)} />
          <Tab label="Form Interactions" {...a11yProps(3)} />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Animated Buttons
            </Typography>
            <Typography variant="body2" paragraph>
              Buttons with various hover, click, and state animations, using MUI theme transitions for consistency.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Hover Effects" />
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <AnimatedButton 
                        variant="contained" 
                        hoverEffect="scale"
                      >
                        Scale
                      </AnimatedButton>
                      
                      <AnimatedButton 
                        variant="contained" 
                        hoverEffect="glow"
                      >
                        Glow
                      </AnimatedButton>
                      
                      <AnimatedButton 
                        variant="contained" 
                        hoverEffect="lift"
                      >
                        Lift
                      </AnimatedButton>
                      
                      <AnimatedButton 
                        variant="contained" 
                        hoverEffect="none"
                      >
                        No Effect
                      </AnimatedButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Click Effects" />
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <AnimatedButton 
                        variant="contained" 
                        clickEffect="ripple"
                      >
                        Ripple
                      </AnimatedButton>
                      
                      <AnimatedButton 
                        variant="contained" 
                        clickEffect="pulse"
                      >
                        Pulse
                      </AnimatedButton>
                      
                      <AnimatedButton 
                        variant="contained" 
                        clickEffect="none"
                      >
                        No Effect
                      </AnimatedButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="State Animations" />
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <AnimatedButton 
                        variant="contained" 
                        loading={isLoading}
                        onClick={() => handleButtonClick('loading')}
                      >
                        Loading
                      </AnimatedButton>
                      
                      <AnimatedButton 
                        variant="contained" 
                        success={isSuccess}
                        showSuccessAnimation
                        onClick={() => handleButtonClick('success')}
                      >
                        Success
                      </AnimatedButton>
                      
                      <AnimatedButton 
                        variant="contained" 
                        error={isError}
                        onClick={() => handleButtonClick('error')}
                      >
                        Error
                      </AnimatedButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Combined Effects" />
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <AnimatedButton 
                        variant="contained" 
                        hoverEffect="scale"
                        clickEffect="ripple"
                        color="primary"
                      >
                        Primary
                      </AnimatedButton>
                      
                      <AnimatedButton 
                        variant="contained" 
                        hoverEffect="glow"
                        clickEffect="pulse"
                        color="secondary"
                      >
                        Secondary
                      </AnimatedButton>
                      
                      <AnimatedButton 
                        variant="outlined" 
                        hoverEffect="lift"
                        clickEffect="ripple"
                      >
                        Outlined
                      </AnimatedButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Animated Feedback
            </Typography>
            <Typography variant="body2" paragraph>
              Animated feedback messages for different states and actions.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Feedback Types" />
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                      <Button 
                        variant="contained" 
                        color="success"
                        onClick={() => handleFeedbackClick('success')}
                      >
                        Success
                      </Button>
                      
                      <Button 
                        variant="contained" 
                        color="error"
                        onClick={() => handleFeedbackClick('error')}
                      >
                        Error
                      </Button>
                      
                      <Button 
                        variant="contained" 
                        color="info"
                        onClick={() => handleFeedbackClick('info')}
                      >
                        Info
                      </Button>
                      
                      <Button 
                        variant="contained" 
                        color="warning"
                        onClick={() => handleFeedbackClick('warning')}
                      >
                        Warning
                      </Button>
                    </Box>
                    
                    <Box sx={{ height: 80 }}>
                      {showFeedback && (
                        <AnimatedFeedback
                          type={feedbackType}
                          message={`This is a ${feedbackType} message with animation.`}
                          onComplete={() => setShowFeedback(false)}
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Minimal Feedback" />
                  <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <AnimatedFeedback
                        type="success"
                        message="Operation completed successfully."
                        minimal
                        animationType="fadeIn"
                      />
                      
                      <AnimatedFeedback
                        type="error"
                        message="An error occurred. Please try again."
                        minimal
                        animationType="slideInLeft"
                      />
                      
                      <AnimatedFeedback
                        type="info"
                        message="Your data is being processed."
                        minimal
                        animationType="slideInRight"
                      />
                      
                      <AnimatedFeedback
                        type="warning"
                        message="This action cannot be undone."
                        minimal
                        animationType="scaleIn"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Animation Types" />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="subtitle2">Fade In</Typography>
                        </Box>
                        <Box sx={{ ...animationPresets.fadeIn(), p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                          <Typography>Fade In Animation</Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="subtitle2">Slide In (Bottom)</Typography>
                        </Box>
                        <Box sx={{ ...animationPresets.slideInBottom(), p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                          <Typography>Slide In Animation</Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="subtitle2">Scale In</Typography>
                        </Box>
                        <Box sx={{ ...animationPresets.scaleIn(), p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                          <Typography>Scale In Animation</Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="subtitle2">Bounce</Typography>
                        </Box>
                        <Box sx={{ ...animationPresets.bounce(), p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                          <Typography>Bounce Animation</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              List & Card Animations
            </Typography>
            <Typography variant="body2" paragraph>
              Staggered animations for lists and interactive card elements.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Staggered List Animation" />
                  <CardContent>
                    <List>
                      {['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'].map((item, index) => (
                        <ListItem
                          key={index}
                          sx={listAnimations[index]}
                          secondaryAction={
                            <IconButton 
                              edge="end" 
                              aria-label="like"
                              color={likedItems.includes(index) ? 'primary' : 'default'}
                              onClick={() => handleLikeToggle(index)}
                              sx={{
                                transition: 'transform 0.2s ease',
                                ...(likedItems.includes(index) ? {
                                  transform: 'scale(1.2)',
                                } : {})
                              }}
                            >
                              <FavoriteIcon />
                            </IconButton>
                          }
                        >
                          <ListItemIcon>
                            <StarIcon />
                          </ListItemIcon>
                          <ListItemText primary={item} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Interactive Cards" />
                  <CardContent>
                    <Grid container spacing={2}>
                      {[1, 2, 3, 4].map((item, index) => (
                        <Grid item xs={6} key={index}>
                          <Card 
                            sx={{
                              ...hoverStyles,
                              height: '100%',
                              cursor: 'pointer'
                            }}
                          >
                            <CardContent>
                              <Typography variant="h6">Card {item}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Interactive card with hover animation
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Form Interactions
            </Typography>
            <Typography variant="body2" paragraph>
              Interactive form elements with micro-animations, aligned with theme.transitions.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Input Animations" />
                  <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField 
                        label="Animated Input"
                        variant="outlined"
                        fullWidth
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            transition: 'all 0.3s ease',
                            '&:hover, &.Mui-focused': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                                boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)',
                              },
                            },
                          },
                        }}
                      />
                      
                      <TextField 
                        label="Scale on Focus"
                        variant="outlined"
                        fullWidth
                        sx={{
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            transform: 'translate(14px, -9px) scale(0.9)',
                          },
                        }}
                      />
                      
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <FormControlLabel
                          control={
                            <Switch 
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  transform: 'translateX(16px)',
                                  '& + .MuiSwitch-track': {
                                    opacity: 1,
                                  },
                                  '&.Mui-checked': {
                                    transform: 'translateX(16px)',
                                  },
                                },
                              }}
                            />
                          }
                          label="Animated Switch"
                        />
                        
                        <FormControlLabel
                          control={
                            <Switch 
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  transform: 'translateX(16px) rotate(360deg)',
                                  transition: 'transform 0.5s ease',
                                },
                              }}
                            />
                          }
                          label="Rotating Switch"
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Form Submission" />
                  <CardContent>
                    <Box 
                      component="form" 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 2 
                      }}
                      onSubmit={(e) => {
                        e.preventDefault();
                        setIsLoading(true);
                        setTimeout(() => {
                          setIsLoading(false);
                          setIsSuccess(true);
                          handleFeedbackClick('success');
                          setTimeout(() => setIsSuccess(false), 1500);
                        }, 1500);
                      }}
                    >
                      <TextField 
                        label="Name"
                        variant="outlined"
                        fullWidth
                        required
                      />
                      
                      <TextField 
                        label="Email"
                        variant="outlined"
                        fullWidth
                        required
                        type="email"
                      />
                      
                      <TextField 
                        label="Message"
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={3}
                      />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <AnimatedButton 
                          type="submit"
                          variant="contained" 
                          loading={isLoading}
                          success={isSuccess}
                          showSuccessAnimation
                          hoverEffect="lift"
                          clickEffect="ripple"
                        >
                          Submit Form
                        </AnimatedButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>
      
      <Box sx={slideIn.style}>
        <Typography variant="h6" gutterBottom>
          Best Practices for Micro-Interactions
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Do's
            </Typography>
            
            <Box component="ul" sx={{ pl: 2 }}>
              <Box component="li" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  <strong>Keep animations subtle</strong> - Micro-interactions should enhance, not distract
                </Typography>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  <strong>Use animations purposefully</strong> - Each animation should serve a specific purpose
                </Typography>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  <strong>Maintain consistency</strong> - Use similar animations for similar actions
                </Typography>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  <strong>Respect reduced motion preferences</strong> - Always provide alternatives for users who prefer reduced motion
                </Typography>
              </Box>
              <Box component="li">
                <Typography variant="body2">
                  <strong>Provide visual feedback</strong> - Use animations to confirm user actions
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Don'ts
            </Typography>
            
            <Box component="ul" sx={{ pl: 2 }}>
              <Box component="li" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  <strong>Don't overuse animations</strong> - Too many animations can be overwhelming
                </Typography>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  <strong>Avoid long animations</strong> - Keep animations short and snappy (under 500ms)
                </Typography>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  <strong>Don't use animations that block interaction</strong> - Users should be able to continue using the app
                </Typography>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  <strong>Avoid jarring or unexpected animations</strong> - Animations should feel natural and intuitive
                </Typography>
              </Box>
              <Box component="li">
                <Typography variant="body2">
                  <strong>Don't ignore performance</strong> - Ensure animations run smoothly across devices
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default MicroInteractionsDemo; 