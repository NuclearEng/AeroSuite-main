import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  Stack,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  useTheme,
  Tooltip,
  IconButton } from
'@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
  Info as InfoIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as RefreshIcon,
  Filter as FilterIcon,
  NetworkCheck as NetworkIcon } from
'@mui/icons-material';
import ForceGraph2D from 'react-force-graph-2d';
import { PageHeader } from '../../../components/common';
import { Supplier } from '../../../services/supplier.service';
import supplierService from '../../../services/supplier.service';

// Define the data structure for the network visualization
interface NetworkNode {
  id: string;
  name: string;
  group: 'supplier' | 'customer' | 'component';
  tier?: string;
  size?: number;
}

interface NetworkLink {
  source: string;
  target: string;
  value?: number;
  type?: string;
}

interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

interface TierDescription {
  title: string;
  description: string;
  color: string;
}

// Define tier descriptions and colors
const tierDescriptions: Record<string, TierDescription> = {
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
  const theme = useTheme();
  const graphRef = useRef<any>(null);

  // State
  const [networkData, setNetworkData] = useState<NetworkData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTiers, setSelectedTiers] = useState<string[]>(['tier1', 'tier2', 'tier3']);
  const [showComponents, setShowComponents] = useState<boolean>(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Load data
  useEffect(() => {
    fetchNetworkData();
  }, []);

  // Regenerate network when filters change
  useEffect(() => {
    if (suppliers.length > 0) {
      generateNetworkData();
    }
  }, [selectedTiers, selectedCustomerId, showComponents, suppliers]);

  // Fetch suppliers and customers data
  const fetchNetworkData = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, we would fetch actual data from the API
      // Here we're creating mock data for demonstration purposes

      // Fetch suppliers
      const suppliersData = await supplierService.getSuppliers();
      const suppliers = suppliersData.suppliers;

      // Mock customer data for demonstration
      const customersData = [
      { _id: 'c1', name: 'Aerospace Corp', industry: 'Aviation' },
      { _id: 'c2', name: 'DefenseTech', industry: 'Defense' },
      { _id: 'c3', name: 'SpaceX', industry: 'Space' }];


      setSuppliers(suppliers);
      setCustomers(customersData);

      // Generate network data
      generateNetworkData(suppliers, customersData);
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || 'Failed to load network data');
    } finally {
      setLoading(false);
    }
  };

  // Generate network data based on suppliers and customers
  const generateNetworkData = (
  suppliersData = suppliers,
  customersData = customers) =>
  {
    // Create nodes and links for the network visualization
    const nodes: NetworkNode[] = [];
    const links: NetworkLink[] = [];

    // Add customer nodes
    customersData.forEach((customer) => {
      if (selectedCustomerId === 'all' || selectedCustomerId === customer._id) {
        nodes.push({
          id: `c-${customer._id}`,
          name: customer.name,
          group: 'customer',
          size: 15
        });
      }
    });

    // Add supplier nodes with tiers
    suppliersData.forEach((supplier, index) => {
      // Assign a tier if not present (for demonstration)
      const tier = supplier.tier || (
      index % 3 === 0 ? 'tier1' : index % 3 === 1 ? 'tier2' : 'tier3');

      // Skip if tier not selected
      if (!selectedTiers.includes(tier)) return;

      // Add supplier node
      nodes.push({
        id: `s-${supplier._id}`,
        name: supplier.name,
        group: 'supplier',
        tier,
        size: tier === 'tier1' ? 10 : tier === 'tier2' ? 8 : 6
      });

      // Add links to customers
      if (supplier.customers && supplier.customers.length > 0) {
        supplier.customers.forEach((customer) => {
          if (selectedCustomerId === 'all' || selectedCustomerId === customer._id) {
            links.push({
              source: `s-${supplier._id}`,
              target: `c-${customer._id}`,
              value: 1,
              type: 'supplier-customer'
            });
          }
        });
      } else {
        // If no specific customers, connect to a random customer for demo
        const randomCustomerId = customersData[Math.floor(Math.random() * customersData.length)]._id;
        if (selectedCustomerId === 'all' || selectedCustomerId === randomCustomerId) {
          links.push({
            source: `s-${supplier._id}`,
            target: `c-${randomCustomerId}`,
            value: 1,
            type: 'supplier-customer'
          });
        }
      }

      // Add links between suppliers (tier dependencies)
      if (tier === 'tier2') {
        // Tier 2 suppliers connect to Tier 1 suppliers
        const tier1Suppliers = suppliersData.filter((s) => (s.tier || '') === 'tier1').
        slice(0, 2); // Limit connections for clarity

        tier1Suppliers.forEach((tier1Supplier) => {
          if (selectedTiers.includes('tier1')) {
            links.push({
              source: `s-${supplier._id}`,
              target: `s-${tier1Supplier._id}`,
              value: 0.7,
              type: 'supplier-supplier'
            });
          }
        });
      } else if (tier === 'tier3') {
        // Tier 3 suppliers connect to Tier 2 suppliers
        const tier2Suppliers = suppliersData.filter((s) => (s.tier || '') === 'tier2').
        slice(0, 2); // Limit connections for clarity

        tier2Suppliers.forEach((tier2Supplier) => {
          if (selectedTiers.includes('tier2')) {
            links.push({
              source: `s-${supplier._id}`,
              target: `s-${tier2Supplier._id}`,
              value: 0.5,
              type: 'supplier-supplier'
            });
          }
        });
      }
    });

    // Add component nodes if enabled
    if (showComponents) {
      // Mock components for demonstration
      const components = [
      { id: 'comp1', name: 'Avionics System', suppliers: suppliers.slice(0, 3) },
      { id: 'comp2', name: 'Landing Gear', suppliers: suppliers.slice(3, 5) },
      { id: 'comp3', name: 'Engine Components', suppliers: suppliers.slice(5, 8) },
      { id: 'comp4', name: 'Hydraulic Systems', suppliers: suppliers.slice(1, 4) }];


      components.forEach((component) => {
        nodes.push({
          id: `cp-${component.id}`,
          name: component.name,
          group: 'component',
          size: 7
        });

        // Connect components to their suppliers
        component.suppliers.forEach((supplier) => {
          const tier = supplier.tier || 'tier1';
          if (selectedTiers.includes(tier)) {
            links.push({
              source: `cp-${component.id}`,
              target: `s-${supplier._id}`,
              value: 0.8,
              type: 'component-supplier'
            });
          }
        });

        // Connect components to customers
        const randomCustomerId = customersData[Math.floor(Math.random() * customersData.length)]._id;
        if (selectedCustomerId === 'all' || selectedCustomerId === randomCustomerId) {
          links.push({
            source: `cp-${component.id}`,
            target: `c-${randomCustomerId}`,
            value: 1,
            type: 'component-customer'
          });
        }
      });
    }

    setNetworkData({ nodes, links });
  };

  // Handle tier filter change
  const handleTierChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedTiers(typeof value === 'string' ? value.split(',') : value);
  };

  // Handle customer filter change
  const handleCustomerChange = (event: SelectChangeEvent<string>) => {
    setSelectedCustomerId(event.target.value);
  };

  // Handle component visibility toggle
  const handleComponentToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowComponents(event.target.checked);
  };

  // Handle zoom to fit
  const handleZoomToFit = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400);
    }
  };

  // Handle node color based on type and tier
  const getNodeColor = useCallback((node: NetworkNode) => {
    if (node.group === 'customer') {
      return theme.palette.error.main; // Red for customers
    } else if (node.group === 'component') {
      return theme.palette.secondary.main; // Purple for components
    } else if (node.tier && tierDescriptions[node.tier]) {
      return tierDescriptions[node.tier].color; // Tier-specific color for suppliers
    }
    return theme.palette.primary.main; // Default color
  }, [theme]);

  // Node label with custom styling
  const getNodeLabel = useCallback((node: NetworkNode) => {
    return `<div style="
      font-family: Arial;
      font-size: 12px;
      padding: 2px 5px;
      border-radius: 4px;
      background-color: rgba(255, 255, 255, 0.8);
      border: 1px solid #ccc;
      pointer-events: none;
    ">${node.name}</div>`;
  }, []);

  return (
    <Box>
      <PageHeader
        title="Supplier Network Visualization"
        subtitle="Visualize and analyze supplier relationships and supply chain networks"
        breadcrumbs={[
        { label: 'Suppliers', href: '/suppliers' },
        { label: 'Network Visualization' }]
        } />

      
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Network Visualization Controls
        </Typography>
        
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="customer-select-label">Customer</InputLabel>
              <Select
                labelId="customer-select-label"
                id="customer-select"
                value={selectedCustomerId}
                onChange={handleCustomerChange}
                label="Customer">

                <MenuItem value="all">All Customers</MenuItem>
                {customers.map((customer) =>
                <MenuItem key={customer._id} value={customer._id}>
                    {customer.name}
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="tier-select-label">Supplier Tiers</InputLabel>
              <Select
                labelId="tier-select-label"
                id="tier-select"
                multiple
                value={selectedTiers}
                onChange={handleTierChange}
                label="Supplier Tiers"
                renderValue={(selected) =>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((tier) =>
                  <Chip
                    key={tier}
                    label={tier.replace('tier', 'Tier ')}
                    size="small" />

                  )}
                  </Box>
                }>

                <MenuItem value="tier1">Tier 1 (Direct)</MenuItem>
                <MenuItem value="tier2">Tier 2 (Secondary)</MenuItem>
                <MenuItem value="tier3">Tier 3 (Tertiary)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FormControlLabel
              control={
              <Switch
                checked={showComponents}
                onChange={handleComponentToggle}
                name="showComponents" />

              }
              label="Show Components" />

          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchNetworkData}
                disabled={loading}>

                Refresh
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleZoomToFit}
                startIcon={<ZoomInIcon />}>

                Fit View
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
      
      
      <Paper sx={{ p: 3, mb: 3, height: 600, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom>
          Supplier Network Map
        </Typography>
        
        {error &&
        <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        }
        
        {loading ?
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>

            <CircularProgress />
          </Box> :

        <Box sx={{ flex: 1, position: 'relative' }}>
            {networkData.nodes.length > 0 ?
          <ForceGraph2D
            ref={graphRef}
            graphData={networkData}
            nodeId="id"
            nodeVal={(node) => (node as NetworkNode).size || 5}
            nodeLabel={(node) => (node as NetworkNode).name}
            nodeColor={(node) => getNodeColor(node as NetworkNode)}
            linkColor={() => theme.palette.divider}
            linkWidth={(link) => (link as NetworkLink).value || 1}
            linkDirectionalParticles={3}
            linkDirectionalParticleSpeed={0.005}
            nodeCanvasObjectMode={() => 'after'}
            nodeCanvasObject={(node, ctx, globalScale) => {
              if (globalScale < 1.5) return; // Don't show labels when zoomed out too far

              const label = (node as NetworkNode).name;
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
              ctx.fillRect(
                node.x! - ctx.measureText(label).width / 2 - 2,
                node.y! - fontSize / 2 - 2,
                ctx.measureText(label).width + 4,
                fontSize + 4
              );
              ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
              ctx.fillText(label, node.x!, node.y!);
            }}
            cooldownTicks={100}
            onEngineStop={() => graphRef.current?.zoomToFit(400)} /> :


          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>

                <Typography variant="body1" color="text.secondary">
                  No network data available for the selected filters.
                </Typography>
                <Button
              variant="contained"
              onClick={fetchNetworkData}
              sx={{ mt: 2 }}>

                  Refresh Data
                </Button>
              </Box>
          }
          </Box>
        }
        
        
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: theme.palette.error.main,
                mr: 1
              }} />

            <Typography variant="body2">Customers</Typography>
          </Box>
          
          {showComponents &&
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: theme.palette.secondary.main,
                mr: 1
              }} />

              <Typography variant="body2">Components</Typography>
            </Box>
          }
          
          {selectedTiers.map((tier) =>
          <Box key={tier} sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: tierDescriptions[tier].color,
                mr: 1
              }} />

              <Typography variant="body2">{tierDescriptions[tier].title}</Typography>
            </Box>
          )}
        </Box>
      </Paper>
      
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Understanding Supplier Tiers
        </Typography>
        
        <Typography variant="body2" paragraph>
          The aerospace supply chain is organized into multiple tiers, each representing a different level of relationship with the end customer.
        </Typography>
        
        <Grid container spacing={3}>
          {Object.entries(tierDescriptions).map(([tier, info]) =>
          <Grid item key={tier} xs={12} md={4}>
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
      </Paper>
      
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Supply Chain Risk Analysis
        </Typography>
        
        <Typography variant="body2" paragraph>
          Analyzing your supplier network helps identify potential risks and optimize your supply chain for efficiency and resilience.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Geographical Concentration Risk
                </Typography>
                <Typography variant="body2">
                  Having multiple suppliers concentrated in a single geographical region can create vulnerabilities to regional disruptions like natural disasters, political instability, or infrastructure failures.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Single-Source Dependencies
                </Typography>
                <Typography variant="body2">
                  Critical components sourced from a single supplier create high-risk dependencies. Identifying these bottlenecks allows for developing alternative sourcing strategies or strategic partnerships.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Tier Visibility
                </Typography>
                <Typography variant="body2">
                  Many organizations have limited visibility beyond Tier 1 suppliers. Extending visibility into Tier 2 and Tier 3 relationships improves risk management and enables more effective supplier development programs.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>);

};

export default SupplierNetwork;