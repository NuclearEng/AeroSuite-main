import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Chip,
  useTheme
} from '@mui/material';
import { getContrastCheckResult, ContrastLevel } from '../../../utils/colorContrastChecker';

interface ColorCombination {
  foreground: string;
  background: string;
  name: string;
  ratio: number;
  passesAA_NormalText: boolean;
  passesAA_LargeText: boolean;
  passesAAA_NormalText: boolean;
  passesAAA_LargeText: boolean;
}

/**
 * Component that audits the theme colors for accessibility
 * Checks all color combinations against WCAG contrast guidelines
 */
const ColorContrastAudit: React.FC = () => {
  const theme = useTheme();
  const [colorCombinations, setColorCombinations] = useState<any>([]);
  const [failingCombinations, setFailingCombinations] = useState<any>([]);
  
  // Define the background colors to test against
  const backgroundColors = [
    { name: 'White', value: '#ffffff' },
    { name: 'Light Background', value: theme.palette.background.default },
    { name: 'Paper', value: theme.palette.background.paper },
    { name: 'Primary Light', value: theme.palette.primary.light },
    { name: 'Secondary Light', value: theme.palette.secondary.light },
  ];
  
  // Define the text colors to test
  const textColors = [
    { name: 'Primary', value: theme.palette.primary.main },
    { name: 'Primary Dark', value: theme.palette.primary.dark },
    { name: 'Secondary', value: theme.palette.secondary.main },
    { name: 'Secondary Dark', value: theme.palette.secondary.dark },
    { name: 'Error', value: theme.palette.error.main },
    { name: 'Warning', value: theme.palette.warning.main },
    { name: 'Info', value: theme.palette.info.main },
    { name: 'Success', value: theme.palette.success.main },
    { name: 'Black', value: '#000000' },
    { name: 'Dark Gray', value: '#333333' },
    { name: 'Medium Gray', value: '#666666' },
    { name: 'Light Gray', value: '#999999' },
  ];
  
  useEffect(() => {
    const combinations: ColorCombination[] = [];
    
    // Test each text color against each background color
    textColors.forEach(text => {
      backgroundColors.forEach(bg => {
        const result = getContrastCheckResult(text.value, bg.value);
        combinations.push({
          foreground: text.value,
          background: bg.value,
          name: `${text.name} on ${bg.name}`,
          ratio: result.ratio,
          passesAA_NormalText: result.passesAA_NormalText,
          passesAA_LargeText: result.passesAA_LargeText,
          passesAAA_NormalText: result.passesAAA_NormalText,
          passesAAA_LargeText: result.passesAAA_LargeText,
        });
      });
    });
    
    // Sort by contrast ratio (descending)
    combinations.sort((a, b) => b.ratio - a.ratio);
    setColorCombinations(combinations);
    
    // Filter out failing combinations (those that don't pass AA for normal text)
    const failing = combinations.filter(combo => !combo.passesAA_NormalText);
    setFailingCombinations(failing);
  }, [theme]);
  
  const renderStatusChip = (passes: boolean) => {
    return passes ? (
      <Chip 
        label="Pass" 
        size="small" 
        color="success" 
        sx={{ fontWeight: 'bold' }} 
      />
    ) : (
      <Chip 
        label="Fail" 
        size="small" 
        color="error" 
        sx={{ fontWeight: 'bold' }} 
      />
    );
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Color Contrast Audit
      </Typography>
      
      <Typography variant="body1" paragraph>
        This audit checks all theme color combinations against WCAG 2.1 accessibility guidelines.
        Color combinations should have a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text.
      </Typography>
      
      {failingCombinations.length > 0 && (
        <Box sx={{ mb: 4, p: 2, bgcolor: theme.palette.error.light, borderRadius: 1 }}>
          <Typography variant="h6" sx={{ color: theme.palette.error.contrastText }}>
            ⚠️ {failingCombinations.length} color combinations fail AA guidelines for normal text
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.error.contrastText }}>
            These combinations should be avoided for normal text or adjusted to meet accessibility standards.
          </Typography>
        </Box>
      )}
      
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table aria-label="color contrast audit table">
          <TableHead>
            <TableRow>
              <TableCell>Color Combination</TableCell>
              <TableCell>Example</TableCell>
              <TableCell align="right">Contrast Ratio</TableCell>
              <TableCell align="center">AA Normal Text</TableCell>
              <TableCell align="center">AA Large Text</TableCell>
              <TableCell align="center">AAA Normal Text</TableCell>
              <TableCell align="center">AAA Large Text</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {colorCombinations.map((combo, index: any) => (
              <TableRow key={index}>
                <TableCell>{combo.name}</TableCell>
                <TableCell>
                  <Box
                    sx={{
                      bgcolor: combo.background,
                      color: combo.foreground,
                      p: 1,
                      borderRadius: 1,
                      border: '1px solid #ddd',
                      display: 'inline-block',
                      minWidth: 100,
                      textAlign: 'center',
                    }}
                  >
                    Sample Text
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={combo.ratio < ContrastLevel.AA_NORMAL_TEXT ? 'bold' : 'normal'}>
                    {combo.ratio.toFixed(2)}:1
                  </Typography>
                </TableCell>
                <TableCell align="center">{renderStatusChip(combo.passesAA_NormalText)}</TableCell>
                <TableCell align="center">{renderStatusChip(combo.passesAA_LargeText)}</TableCell>
                <TableCell align="center">{renderStatusChip(combo.passesAAA_NormalText)}</TableCell>
                <TableCell align="center">{renderStatusChip(combo.passesAAA_LargeText)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Typography variant="h5" gutterBottom>
        WCAG 2.1 Contrast Requirements
      </Typography>
      
      <TableContainer component={Paper}>
        <Table aria-label="wcag requirements table" size="small">
          <TableHead>
            <TableRow>
              <TableCell>Conformance Level</TableCell>
              <TableCell>Normal Text</TableCell>
              <TableCell>Large Text</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>AA</TableCell>
              <TableCell>4.5:1</TableCell>
              <TableCell>3:1</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>AAA</TableCell>
              <TableCell>7:1</TableCell>
              <TableCell>4.5:1</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ColorContrastAudit; 