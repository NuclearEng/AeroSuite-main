import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  formatDate, 
  formatDateTime, 
  formatLocalizedDate, 
  formatLocalizedDateTime,
  formatCurrency,
  formatLocalizedCurrency,
  formatPercentage,
  formatLocalizedPercentage,
  formatLocalizedNumber
} from '../../utils/formatters';

/**
 * A component that demonstrates the use of locale-specific formatting
 */
const LocalizationDemo: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  
  // Sample data
  const now = new Date();
  const amount = 1234.56;
  const percentage = 75.5;
  const largeNumber = 1234567.89;
  
  return (
    <Card>
      <CardHeader 
        title={t('localization.demo.title')} 
        subheader={t('localization.demo.description')}
      />
      <Divider />
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('localization.demo.currentLanguage')}: {currentLanguage}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('localization.demo.changeLanguage')}
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {t('localization.demo.dateFormatting')}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('localization.demo.format')}</TableCell>
                      <TableCell>{t('localization.demo.result')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{t('localization.demo.standardDate')}</TableCell>
                      <TableCell>{formatDate(now.toISOString())}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{t('localization.demo.standardDateTime')}</TableCell>
                      <TableCell>{formatDateTime(now.toISOString())}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{t('localization.demo.localizedDate')}</TableCell>
                      <TableCell>{formatLocalizedDate(now.toISOString())}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{t('localization.demo.localizedDateTime')}</TableCell>
                      <TableCell>{formatLocalizedDateTime(now.toISOString())}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {t('localization.demo.numberFormatting')}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('localization.demo.format')}</TableCell>
                      <TableCell>{t('localization.demo.result')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{t('localization.demo.standardCurrency')}</TableCell>
                      <TableCell>{formatCurrency(amount)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{t('localization.demo.localizedCurrency')}</TableCell>
                      <TableCell>{formatLocalizedCurrency(amount)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{t('localization.demo.standardPercentage')}</TableCell>
                      <TableCell>{formatPercentage(percentage)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{t('localization.demo.localizedPercentage')}</TableCell>
                      <TableCell>{formatLocalizedPercentage(percentage)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{t('localization.demo.localizedNumber')}</TableCell>
                      <TableCell>{formatLocalizedNumber(largeNumber)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {t('localization.demo.note')}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LocalizationDemo; 