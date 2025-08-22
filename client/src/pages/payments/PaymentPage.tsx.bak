import React, { useState } from 'react';
import { Container, Typography, Box, Tabs, Tab, Paper } from '@mui/material';
import PaymentHistory from '../../components/payments/PaymentHistory';
import SEO from '../../utils/seo';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

/**
 * Payment Page
 * 
 * Main page for payment history and management
 * Task: TS367 - Payment gateway integration
 */
const PaymentPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`payment-tabpanel-${index}`}
        aria-labelledby={`payment-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
      </div>
    );
  };

  return (
    <Container maxWidth="lg">
      <SEO
        title="Payments - AeroSuite"
        description="View and manage your payment history"
      />
      
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Payments
        </Typography>
        
        <Paper sx={{ mt: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="payment tabs"
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab label="All Payments" id="payment-tab-0" />
              <Tab label="Completed" id="payment-tab-1" />
              <Tab label="Pending" id="payment-tab-2" />
              <Tab label="Refunded" id="payment-tab-3" />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            <PaymentHistory showTitle={false} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <PaymentHistory showTitle={false} status="completed" />
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <PaymentHistory showTitle={false} status="pending" />
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            <PaymentHistory showTitle={false} status="refunded" />
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};

export default PaymentPage; 