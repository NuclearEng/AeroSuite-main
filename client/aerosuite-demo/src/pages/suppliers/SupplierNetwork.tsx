import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip } from
'@mui/material';
import SupplierMap from '../../components/SupplierMap';

const tierDescriptions = {
  tier1: {
    title: "Tier 1 Suppliers",
    description: "Direct suppliers who provide products and services directly to the customer. These suppliers have direct contractual relationships and are typically integrated closely with customer operations.",
    color: "#4caf50" // Green
  },
  tier2: {
    title: "Tier 2 Suppliers",
    description: "Secondary suppliers who provide products and services to Tier 1 suppliers. These suppliers typically don't have direct contractual relationships with the end customer.",
    color: "#2196f3" // Blue
  },
  tier3: {
    title: "Tier 3 Suppliers",
    description: "Tertiary suppliers who provide raw materials, components, or services to Tier 2 suppliers. These are foundational suppliers in the supply chain.",
    color: "#ff9800" // Orange
  }
};

const SupplierNetwork: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Supplier Network
      </Typography>
      
      <Typography variant="body1" paragraph>
        View and analyze your supplier network across different tiers. The map shows geographical distribution of suppliers and their relationships with customers.
      </Typography>
      
      <Grid container spacing={3}>
        
        <Grid sx={{ gridColumn: 'span 12' }}>
          <SupplierMap height={550} />
        </Grid>
        
        
        <Grid sx={{ gridColumn: 'span 12', mt: 2 }}>
          <Typography variant="h5" gutterBottom>
            Understanding Supplier Tiers
          </Typography>
          
          <Typography variant="body1" paragraph>
            The aerospace supply chain is organized into multiple tiers, each representing a different level of relationship with the end customer.
          </Typography>
          
          <Grid container spacing={3}>
            {Object.entries(tierDescriptions).map(([tier, info]) =>
            <Grid key={tier} sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: info.color,
                        mr: 1
                      }} />

                      <Typography variant="h6">{info.title}</Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body2">
                      {info.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Grid>
        
        
        <Grid sx={{ gridColumn: 'span 12', mt: 2 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Supply Chain Risk Management
            </Typography>
            
            <Typography variant="body1" paragraph>
              Monitoring your supplier network across all tiers helps identify potential risks and dependencies. Use this map to:
            </Typography>
            
            <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
              <Chip label="Identify geographic clusters" />
              <Chip label="Monitor tier dependencies" />
              <Chip label="Analyze customer-supplier relationships" />
              <Chip label="Identify single points of failure" />
              <Chip label="Plan for supply chain disruptions" />
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              For a more detailed risk analysis, use the reporting section to generate supplier risk reports based on inspection history and performance metrics.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>);

};

export default SupplierNetwork;