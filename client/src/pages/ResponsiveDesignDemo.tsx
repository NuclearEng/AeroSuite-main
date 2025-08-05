import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Tabs,
  Tab,
  IconButton,
  TextField,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Tablet as TabletIcon,
  Laptop as LaptopIcon,
  TouchApp as TouchAppIcon,
  Fullscreen as FullscreenIcon,
  AspectRatio as AspectRatioIcon,
  GridOn as GridOnIcon,
  ViewQuilt as ViewQuiltIcon,
  ViewList as ViewListIcon
} from '@mui/icons-material';

import useResponsive from '../hooks/useResponsive';
import TouchTargetWrapper from '../components/common/TouchTargetWrapper';
import ResponsiveLayoutAudit from '../components/common/ResponsiveLayoutAudit';
import { ResponsiveGrid, ResponsiveGridItem } from '../components/layout/ResponsiveGrid';

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
      id={`responsive-design-tabpanel-${index}`}
      aria-labelledby={`responsive-design-tab-${index}`}
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
    id: `responsive-design-tab-${index}`,
    'aria-controls': `responsive-design-tabpanel-${index}`,
  };
}

/**
 * Demo page for responsive design improvements
 */
const ResponsiveDesignDemo: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [showAudit, setShowAudit] = useState(true);
  const { 
    isMobile, 
    isTablet, 
    isDesktop, 
    orientation, 
    width, 
    height,
    getCurrentBreakpoint
  } = useResponsive();
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Sample card data for grid examples
  const cardData = [
    { title: 'Card 1', content: 'This is the content for card 1' },
    { title: 'Card 2', content: 'This is the content for card 2' },
    { title: 'Card 3', content: 'This is the content for card 3' },
    { title: 'Card 4', content: 'This is the content for card 4' },
    { title: 'Card 5', content: 'This is the content for card 5' },
    { title: 'Card 6', content: 'This is the content for card 6' }
  ];
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Responsive Design Demo
      </Typography>
      
      <Typography variant="body1" paragraph>
        This page demonstrates the various responsive design improvements and touch target enhancements in AeroSuite.
        These components help ensure a consistent user experience across different devices and screen sizes.
      </Typography>
      
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <FormControlLabel
          control={
            <Switch
              checked={showAudit}
              onChange={(e) => setShowAudit(e.target.checked)}
            />
          }
          label="Show Responsive Audit Tool"
        />
      </Box>
      
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="responsive design tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Touch Targets" {...a11yProps(0)} />
          <Tab label="Responsive Grid" {...a11yProps(1)} />
          <Tab label="Responsive Layout" {...a11yProps(2)} />
          <Tab label="Best Practices" {...a11yProps(3)} />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Touch Target Enhancements
            </Typography>
            <Typography variant="body2" paragraph>
              Touch targets should be at least 48×48 pixels to ensure they are easy to tap on mobile devices.
              The TouchTargetWrapper component helps enhance small interactive elements to meet this requirement.
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Standard Buttons
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button variant="contained" size="small">Small</Button>
                    <Button variant="contained">Medium</Button>
                    <Button variant="contained" size="large">Large</Button>
                    <IconButton size="small">
                      <PhoneIcon fontSize="small" />
                    </IconButton>
                    <IconButton>
                      <TabletIcon />
                    </IconButton>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Enhanced Touch Targets
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <TouchTargetWrapper>
                      <Button variant="contained" size="small">Small</Button>
                    </TouchTargetWrapper>
                    <TouchTargetWrapper>
                      <IconButton size="small">
                        <PhoneIcon fontSize="small" />
                      </IconButton>
                    </TouchTargetWrapper>
                    <TouchTargetWrapper>
                      <IconButton>
                        <TabletIcon />
                      </IconButton>
                    </TouchTargetWrapper>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
            
            <Typography variant="subtitle1" gutterBottom>
              Interactive Demo
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Standard List" />
                  <CardContent>
                    <List>
                      {['Item 1', 'Item 2', 'Item 3'].map((item, index) => (
                        <ListItem key={index} disablePadding>
                          <ListItemButton>
                            <ListItemIcon>
                              <TouchAppIcon />
                            </ListItemIcon>
                            <ListItemText primary={item} />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Enhanced Touch Target List" />
                  <CardContent>
                    <List>
                      {['Item 1', 'Item 2', 'Item 3'].map((item, index) => (
                        <ListItem key={index} disablePadding>
                          <TouchTargetWrapper sx={{ width: '100%' }}>
                            <ListItemButton sx={{ py: isMobile ? 1.5 : 1 }}>
                              <ListItemIcon>
                                <TouchAppIcon />
                              </ListItemIcon>
                              <ListItemText primary={item} />
                            </ListItemButton>
                          </TouchTargetWrapper>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Responsive Grid System
            </Typography>
            <Typography variant="body2" paragraph>
              The ResponsiveGrid component adapts to different screen sizes, automatically adjusting column counts and spacing.
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Standard Grid
              </Typography>
              <Grid container spacing={2}>
                {cardData.map((card, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                    <Card>
                      <CardHeader title={card.title} />
                      <CardContent>
                        <Typography variant="body2">{card.content}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Responsive Grid
              </Typography>
              <ResponsiveGrid spacing={{ xs: 1, sm: 2, md: 3 }}>
                {cardData.map((card, index) => (
                  <ResponsiveGridItem key={index} xs={12} sm={6} md={4} lg={3}>
                    <Card>
                      <CardHeader title={card.title} />
                      <CardContent>
                        <Typography variant="body2">{card.content}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Responsive spacing and column sizing
                        </Typography>
                      </CardContent>
                    </Card>
                  </ResponsiveGridItem>
                ))}
              </ResponsiveGrid>
            </Box>
            
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Direction Changing Grid
              </Typography>
              <ResponsiveGrid 
                spacing={2} 
                mobileDirection="column"
                tabletDirection="row"
                desktopDirection="row"
              >
                {cardData.slice(0, 3).map((card, index) => (
                  <ResponsiveGridItem key={index} xs={12} sm={4} md={4}>
                    <Card>
                      <CardHeader title={card.title} />
                      <CardContent>
                        <Typography variant="body2">{card.content}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Direction changes on mobile
                        </Typography>
                      </CardContent>
                    </Card>
                  </ResponsiveGridItem>
                ))}
              </ResponsiveGrid>
            </Box>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Responsive Layout Techniques
            </Typography>
            <Typography variant="body2" paragraph>
              These techniques ensure that layouts adapt appropriately to different screen sizes and orientations.
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Current Device Information" />
                  <CardContent>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          {isMobile ? <PhoneIcon /> : isTablet ? <TabletIcon /> : <LaptopIcon />}
                        </ListItemIcon>
                        <ListItemText 
                          primary="Device Type" 
                          secondary={isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <FullscreenIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Viewport Size" 
                          secondary={`${width} × ${height} pixels`} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <AspectRatioIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Orientation" 
                          secondary={orientation} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <GridOnIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Breakpoint" 
                          secondary={getCurrentBreakpoint().toUpperCase()} 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Responsive Content Display" />
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Content Adaptation
                      </Typography>
                      {isMobile ? (
                        <Typography variant="body2">
                          This content is optimized for mobile devices with simplified layout and larger touch targets.
                        </Typography>
                      ) : isTablet ? (
                        <Typography variant="body2">
                          This content is optimized for tablet devices with a balanced layout that works well in both portrait and landscape orientations.
                        </Typography>
                      ) : (
                        <Typography variant="body2">
                          This content is optimized for desktop devices with a rich layout that takes advantage of the larger screen real estate.
                        </Typography>
                      )}
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Layout Adaptation
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2 }}>
                        <Box sx={{ flex: 1, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                          <Typography variant="body2">Panel 1</Typography>
                        </Box>
                        <Box sx={{ flex: 1, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                          <Typography variant="body2">Panel 2</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Typography variant="subtitle1" gutterBottom>
              Responsive Component Examples
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardHeader 
                    title="Responsive Card"
                    subheader={isMobile ? "Mobile View" : isTablet ? "Tablet View" : "Desktop View"}
                    action={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {!isMobile && (
                          <Button variant="outlined" size={isMobile ? 'small' : 'medium'}>
                            Secondary Action
                          </Button>
                        )}
                        <Button variant="contained" size={isMobile ? 'small' : 'medium'}>
                          Primary Action
                        </Button>
                      </Box>
                    }
                  />
                  <CardContent>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: 2
                    }}>
                      <Box sx={{ 
                        width: isMobile ? '100%' : '30%',
                        height: isMobile ? 200 : 'auto',
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Typography variant="body2" color="text.secondary">
                          Image Content
                        </Typography>
                      </Box>
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          Content Title
                        </Typography>
                        <Typography variant="body2" paragraph>
                          This content adapts to different screen sizes. On mobile, it stacks vertically to make better use of the available space. On larger screens, it uses a side-by-side layout.
                        </Typography>
                        <Typography variant="body2">
                          Notice how the button layout, spacing, and overall structure change based on the device type. This ensures optimal user experience across all devices.
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Responsive Design Best Practices
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Do's
                </Typography>
                
                <Box component="ul" sx={{ pl: 2 }}>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Design mobile-first</strong>, then enhance for larger screens
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Use relative units</strong> (%, em, rem) instead of fixed pixels
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Ensure touch targets</strong> are at least 48×48 pixels on mobile
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Test on real devices</strong>, not just browser resizing
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Prioritize content</strong> for different screen sizes
                    </Typography>
                  </Box>
                  <Box component="li">
                    <Typography variant="body2">
                      <strong>Optimize images</strong> for different viewport sizes
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
                      <strong>Don't use fixed widths</strong> that prevent content from adapting
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Avoid tiny touch targets</strong> that are difficult to tap on mobile
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Don't hide essential content</strong> on mobile devices
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Avoid horizontal scrolling</strong> on mobile (except for specific UI patterns)
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Don't rely on hover effects</strong> for essential functionality
                    </Typography>
                  </Box>
                  <Box component="li">
                    <Typography variant="body2">
                      <strong>Avoid large, unoptimized images</strong> that slow down mobile loading
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 4 }} />
            
            <Typography variant="h6" gutterBottom>
              Testing Responsive Designs
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Testing Methods" />
                  <CardContent>
                    <Box component="ul" sx={{ pl: 2 }}>
                      <Box component="li" sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          <strong>Browser DevTools:</strong> Use responsive design mode to test different screen sizes
                        </Typography>
                      </Box>
                      <Box component="li" sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          <strong>Real Device Testing:</strong> Test on actual mobile devices, not just emulators
                        </Typography>
                      </Box>
                      <Box component="li" sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          <strong>Responsive Audit Tools:</strong> Use tools like the ResponsiveLayoutAudit component
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography variant="body2">
                          <strong>Automated Testing:</strong> Create tests that verify layouts at different breakpoints
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Common Breakpoints" />
                  <CardContent>
                    <Box sx={{ overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Name</th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Width (px)</th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Device Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                            <td style={{ padding: '8px' }}>xs</td>
                            <td style={{ padding: '8px' }}>0-599</td>
                            <td style={{ padding: '8px' }}>Mobile phones</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                            <td style={{ padding: '8px' }}>sm</td>
                            <td style={{ padding: '8px' }}>600-899</td>
                            <td style={{ padding: '8px' }}>Small tablets</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                            <td style={{ padding: '8px' }}>md</td>
                            <td style={{ padding: '8px' }}>900-1199</td>
                            <td style={{ padding: '8px' }}>Large tablets</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                            <td style={{ padding: '8px' }}>lg</td>
                            <td style={{ padding: '8px' }}>1200-1535</td>
                            <td style={{ padding: '8px' }}>Laptops</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px' }}>xl</td>
                            <td style={{ padding: '8px' }}>1536+</td>
                            <td style={{ padding: '8px' }}>Desktops</td>
                          </tr>
                        </tbody>
                      </table>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>
      
      {showAudit && <ResponsiveLayoutAudit />}
    </Container>
  );
};

export default ResponsiveDesignDemo; 