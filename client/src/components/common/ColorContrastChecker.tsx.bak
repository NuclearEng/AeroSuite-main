import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Grid,
  Slider,
  Button,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import {
  checkContrast,
  getWcagLevel,
  getSuggestedColor,
  hexToRgb,
  rgbToHex,
  RGB,
  ContrastResult
} from '../../utils/colorContrastChecker';

interface ColorContrastCheckerProps {
  initialForeground?: string;
  initialBackground?: string;
}

/**
 * Component for checking color contrast according to WCAG guidelines
 */
const ColorContrastChecker: React.FC<ColorContrastCheckerProps> = ({
  initialForeground = '#000000',
  initialBackground = '#FFFFFF'
}) => {
  const [foreground, setForeground] = useState<string>(initialForeground);
  const [background, setBackground] = useState<string>(initialBackground);
  const [contrastResult, setContrastResult] = useState<ContrastResult | null>(null);
  const [suggestedColor, setSuggestedColor] = useState<string | null>(null);
  const [foregroundRgb, setForegroundRgb] = useState<RGB>({ r: 0, g: 0, b: 0 });
  const [backgroundRgb, setBackgroundRgb] = useState<RGB>({ r: 255, g: 255, b: 255 });
  const [error, setError] = useState<string | null>(null);

  // Update contrast result when colors change
  useEffect(() => {
    try {
      const result = checkContrast(foreground, background);
      setContrastResult(result);
      setError(null);

      // Generate suggested color if contrast is insufficient
      if (!result.AA.normal) {
        const suggested = getSuggestedColor(foreground, background);
        setSuggestedColor(suggested);
      } else {
        setSuggestedColor(null);
      }

      // Update RGB values
      setForegroundRgb(hexToRgb(foreground));
      setBackgroundRgb(hexToRgb(background));
    } catch (_err) {
      setError('Invalid color format. Please use valid hex colors (e.g., #FFFFFF).');
    }
  }, [foreground, background]);

  // Handle color input changes
  const handleForegroundChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value.startsWith('#') || value === '') {
      setForeground(value);
    } else {
      setForeground(`#${value}`);
    }
  };

  const handleBackgroundChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value.startsWith('#') || value === '') {
      setBackground(value);
    } else {
      setBackground(`#${value}`);
    }
  };

  // Handle RGB slider changes
  const handleForegroundRgbChange = (color: 'r' | 'g' | 'b') => (event: Event, newValue: number | number[]) => {
    const value = typeof newValue === 'number' ? newValue : newValue[0];
    const newRgb = { ...foregroundRgb, [color]: value };
    setForegroundRgb(newRgb);
    setForeground(rgbToHex(newRgb));
  };

  const handleBackgroundRgbChange = (color: 'r' | 'g' | 'b') => (event: Event, newValue: number | number[]) => {
    const value = typeof newValue === 'number' ? newValue : newValue[0];
    const newRgb = { ...backgroundRgb, [color]: value };
    setBackgroundRgb(newRgb);
    setBackground(rgbToHex(newRgb));
  };

  // Apply suggested color
  const applySuggestedColor = () => {
    if (suggestedColor) {
      setForeground(suggestedColor);
    }
  };

  // Swap foreground and background colors
  const swapColors = () => {
    const tempFg = foreground;
    setForeground(background);
    setBackground(tempFg);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Color Contrast Checker
      </Typography>
      
      <Typography variant="body2" paragraph>
        Check if your text and background colors meet WCAG accessibility guidelines.
        The minimum contrast ratio for AA compliance is 4.5:1 for normal text and 3:1 for large text.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Text Color
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                label="Hex Color"
                value={foreground}
                onChange={handleForegroundChange}
                size="small"
                sx={{ mr: 2 }}
              />
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: foreground,
                  border: '1px solid #ccc',
                  borderRadius: 1
                }}
              />
            </Box>
            
            <Typography variant="body2" gutterBottom>
              Red
            </Typography>
            <Slider
              value={foregroundRgb.r}
              onChange={handleForegroundRgbChange('r')}
              min={0}
              max={255}
              valueLabelDisplay="auto"
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" gutterBottom>
              Green
            </Typography>
            <Slider
              value={foregroundRgb.g}
              onChange={handleForegroundRgbChange('g')}
              min={0}
              max={255}
              valueLabelDisplay="auto"
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" gutterBottom>
              Blue
            </Typography>
            <Slider
              value={foregroundRgb.b}
              onChange={handleForegroundRgbChange('b')}
              min={0}
              max={255}
              valueLabelDisplay="auto"
            />
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Background Color
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                label="Hex Color"
                value={background}
                onChange={handleBackgroundChange}
                size="small"
                sx={{ mr: 2 }}
              />
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: background,
                  border: '1px solid #ccc',
                  borderRadius: 1
                }}
              />
            </Box>
            
            <Typography variant="body2" gutterBottom>
              Red
            </Typography>
            <Slider
              value={backgroundRgb.r}
              onChange={handleBackgroundRgbChange('r')}
              min={0}
              max={255}
              valueLabelDisplay="auto"
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" gutterBottom>
              Green
            </Typography>
            <Slider
              value={backgroundRgb.g}
              onChange={handleBackgroundRgbChange('g')}
              min={0}
              max={255}
              valueLabelDisplay="auto"
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" gutterBottom>
              Blue
            </Typography>
            <Slider
              value={backgroundRgb.b}
              onChange={handleBackgroundRgbChange('b')}
              min={0}
              max={255}
              valueLabelDisplay="auto"
            />
          </Box>
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Button variant="outlined" onClick={swapColors} sx={{ mx: 1 }}>
          Swap Colors
        </Button>
        
        {suggestedColor && (
          <Button 
            variant="contained" 
            onClick={applySuggestedColor} 
            sx={{ mx: 1 }}
          >
            Apply Suggested Color
          </Button>
        )}
      </Box>
      
      <Divider sx={{ my: 3 }} />
      
      <Typography variant="h6" gutterBottom>
        Preview
      </Typography>
      
      <Box
        sx={{
          p: 3,
          bgcolor: background,
          color: foreground,
          borderRadius: 1,
          mb: 3,
          border: '1px solid #ccc'
        }}
      >
        <Typography variant="h4" gutterBottom>
          Heading Text
        </Typography>
        <Typography variant="body1" paragraph>
          This is an example of body text with the selected colors. The text should be readable against the background to meet accessibility standards.
        </Typography>
        <Typography variant="caption">
          Small text is harder to read with low contrast, so it requires a higher contrast ratio.
        </Typography>
      </Box>
      
      {contrastResult && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Contrast Results
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1" sx={{ mr: 1 }}>
                  Contrast Ratio:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {contrastResult.contrast.toFixed(2)}:1
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1" sx={{ mr: 1 }}>
                  WCAG Level:
                </Typography>
                <Chip
                  label={getWcagLevel(contrastResult.contrast)}
                  color={
                    contrastResult.AAA.normal
                      ? 'success'
                      : contrastResult.AA.normal
                      ? 'primary'
                      : contrastResult.AA.large
                      ? 'warning'
                      : 'error'
                  }
                  variant="outlined"
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Compliance:
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip
                    label="AA"
                    size="small"
                    sx={{ mr: 1, width: 45 }}
                  />
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Normal Text:
                  </Typography>
                  <Chip
                    label={contrastResult.AA.normal ? 'Pass' : 'Fail'}
                    color={contrastResult.AA.normal ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip
                    label="AA"
                    size="small"
                    sx={{ mr: 1, width: 45 }}
                  />
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Large Text:
                  </Typography>
                  <Chip
                    label={contrastResult.AA.large ? 'Pass' : 'Fail'}
                    color={contrastResult.AA.large ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip
                    label="AAA"
                    size="small"
                    sx={{ mr: 1, width: 45 }}
                  />
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Normal Text:
                  </Typography>
                  <Chip
                    label={contrastResult.AAA.normal ? 'Pass' : 'Fail'}
                    color={contrastResult.AAA.normal ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip
                    label="AAA"
                    size="small"
                    sx={{ mr: 1, width: 45 }}
                  />
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Large Text:
                  </Typography>
                  <Chip
                    label={contrastResult.AAA.large ? 'Pass' : 'Fail'}
                    color={contrastResult.AAA.large ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
          
          {suggestedColor && (
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                Suggested text color for better contrast: <strong>{suggestedColor}</strong>
              </Typography>
            </Alert>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default ColorContrastChecker; 