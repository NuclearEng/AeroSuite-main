import React, { useRef, useCallback, useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Tooltip,
  IconButton,
  Stack,
  Chip,
  useTheme,
  Divider,
  Grid,
  alpha,
  SelectChangeEvent
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  FilterAlt as FilterIcon,
  Share as ShareIcon
} from '@mui/icons-material';
// @ts-ignore
import ForceGraph2D from 'react-force-graph-2d';
import useComponentRelationships, { ComponentNode, ComponentLink } from '../../hooks/useComponentRelationships';

interface ComponentRelationshipGraphProps {
  componentId?: string;
  showFilters?: boolean;
  height?: number;
  title?: string;
  description?: string;
}

// Define relationship types with colors and descriptions
const relationshipTypes: Record<string, { label: string; description: string; color: string }> = {
  'parent-child': {
    label: 'Parent-Child',
    description: 'Component hierarchical relationship',
    color: '#1976d2' // blue
  },
  'dependency': {
    label: 'Dependency',
    description: 'Component depends on another component',
    color: '#f44336' // red
  },
  'assembly': {
    label: 'Assembly',
    description: 'Components that are assembled together',
    color: '#4caf50' // green
  },
  'variant': {
    label: 'Variant',
    description: 'Alternative versions of the same component',
    color: '#ff9800' // orange
  }
};

// Define component types with colors
const componentTypes: Record<string, { color: string; size: number }> = {
  'system': { color: '#9c27b0', size: 16 }, // purple
  'subsystem': { color: '#673ab7', size: 14 }, // deep purple
  'assembly': { color: '#3f51b5', size: 12 }, // indigo
  'module': { color: '#2196f3', size: 10 }, // blue
  'unit': { color: '#00bcd4', size: 8 } // cyan
};

const ComponentRelationshipGraph: React.FC<ComponentRelationshipGraphProps> = ({
  componentId,
  showFilters = true,
  height = 600,
  title = 'Component Relationship Visualization',
  description = 'Interactive visualization of component relationships and dependencies'
}) => {
  const theme = useTheme();
  const graphRef = useRef<any>();
  
  // State for filters
  const [showLabels, setShowLabels] = useState(true);
  const [selectedRelationshipTypes, setSelectedRelationshipTypes] = useState<string[]>(
    Object.keys(relationshipTypes)
  );
  const [selectedComponentTypes, setSelectedComponentTypes] = useState<string[]>(
    Object.keys(componentTypes)
  );
  
  // Fetch component relationships data
  const { 
    data, 
    loading, 
    error, 
    refetch 
  } = useComponentRelationships({ 
    componentId, 
    includeIndirect: true 
  });
  
  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    if (!data) return null;
    
    // Filter nodes by component type
    const filteredNodes = data.nodes.filter(node => 
      selectedComponentTypes.includes(node.type)
    );
    
    // Get filtered node IDs for link filtering
    const filteredNodeIds = new Set(filteredNodes.map(node => node.id));
    
    // Filter links by relationship type and ensure both source/target nodes exist after filtering
    const filteredLinks = data.links.filter(link => 
      selectedRelationshipTypes.includes(link.relationshipType) &&
      filteredNodeIds.has(link.source) &&
      filteredNodeIds.has(link.target)
    );
    
    return {
      nodes: filteredNodes,
      links: filteredLinks
    };
  }, [data, selectedRelationshipTypes, selectedComponentTypes]);
  
  // Handle component type filter change
  const handleComponentTypeChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedComponentTypes(typeof value === 'string' ? value.split(',') : value);
  };
  
  // Handle relationship type filter change
  const handleRelationshipTypeChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedRelationshipTypes(typeof value === 'string' ? value.split(',') : value);
  };
  
  // Handle label visibility toggle
  const handleLabelsToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowLabels(event.target.checked);
  };
  
  // Handle zoom to fit
  const handleZoomToFit = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400);
    }
  };
  
  // Node color accessor function
  const getNodeColor = useCallback((node: ComponentNode) => {
    return componentTypes[node.type]?.color || theme.palette.grey[500];
  }, [theme]);
  
  // Node size accessor function
  const getNodeSize = useCallback((node: ComponentNode) => {
    return componentTypes[node.type]?.size || 10;
  }, []);
  
  // Link color accessor function
  const getLinkColor = useCallback((link: ComponentLink) => {
    return relationshipTypes[link.relationshipType]?.color || theme.palette.grey[400];
  }, [theme]);
  
  // Link width accessor function
  const getLinkWidth = useCallback((link: ComponentLink) => {
    return (link.strength || 0.5) * 3;
  }, []);
  
  // Node label accessor function
  const getNodeLabel = useCallback((node: ComponentNode) => {
    if (!showLabels) return '';
    
    return `
      <div style="
        font-family: Arial;
        font-size: 12px;
        padding: 2px 5px;
        border-radius: 4px;
        background-color: rgba(255, 255, 255, 0.8);
        border: 1px solid #ccc;
        pointer-events: none;
      ">
        <strong>${node.name}</strong><br>
        <span style="color: #666;">${node.type}</span>
      </div>
    `;
  }, [showLabels]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <IconButton color="inherit" size="small" onClick={() => refetch()}>
            <RefreshIcon />
          </IconButton>
        }
      >
        {error}
      </Alert>
    );
  }
  
  if (!filteredData || filteredData.nodes.length === 0) {
    return (
      <Alert severity="info">
        No component relationships match the selected filters.
      </Alert>
    );
  }
  
  return (
    <Paper sx={{ p: 2, height: height + 100 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
        
        <Stack direction="row" spacing={1}>
          <Tooltip title="Zoom to fit">
            <IconButton onClick={handleZoomToFit}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh data">
            <IconButton onClick={() => refetch()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
      
      {showFilters && (
        <>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <FormControl size="small" fullWidth>
                <InputLabel id="component-type-label">Component Types</InputLabel>
                <Select
                  labelId="component-type-label"
                  id="component-type-select"
                  multiple
                  value={selectedComponentTypes}
                  onChange={handleComponentTypeChange}
                  label="Component Types"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip 
                          key={value} 
                          label={value} 
                          size="small"
                          sx={{ 
                            bgcolor: alpha(componentTypes[value]?.color || '#ccc', 0.2),
                            borderColor: componentTypes[value]?.color || '#ccc',
                            borderWidth: 1,
                            borderStyle: 'solid'
                          }}
                        />
                      ))}
                    </Box>
                  )}
                >
                  {Object.entries(componentTypes).map(([type, config]) => (
                    <MenuItem key={type} value={type}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            bgcolor: config.color,
                            mr: 1 
                          }} 
                        />
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl size="small" fullWidth>
                <InputLabel id="relationship-type-label">Relationship Types</InputLabel>
                <Select
                  labelId="relationship-type-label"
                  id="relationship-type-select"
                  multiple
                  value={selectedRelationshipTypes}
                  onChange={handleRelationshipTypeChange}
                  label="Relationship Types"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip 
                          key={value} 
                          label={relationshipTypes[value]?.label || value} 
                          size="small"
                          sx={{ 
                            bgcolor: alpha(relationshipTypes[value]?.color || '#ccc', 0.2),
                            borderColor: relationshipTypes[value]?.color || '#ccc',
                            borderWidth: 1,
                            borderStyle: 'solid'
                          }}
                        />
                      ))}
                    </Box>
                  )}
                >
                  {Object.entries(relationshipTypes).map(([type, config]) => (
                    <MenuItem key={type} value={type}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            bgcolor: config.color,
                            mr: 1 
                          }} 
                        />
                        {config.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showLabels}
                      onChange={handleLabelsToggle}
                      color="primary"
                    />
                  }
                  label="Show labels"
                />
              </Box>
            </Grid>
          </Grid>
        </>
      )}
      
      <Box sx={{ height: height, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
        {filteredData && (
          <ForceGraph2D
            ref={graphRef}
            graphData={filteredData}
            nodeId="id"
            nodeLabel="name"
            nodeColor={getNodeColor}
            nodeVal={getNodeSize}
            linkSource="source"
            linkTarget="target"
            linkColor={getLinkColor}
            linkWidth={getLinkWidth}
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const { id, name, x, y } = node;
              const size = getNodeSize(node as ComponentNode);
              const color = getNodeColor(node as ComponentNode);
              
              // Draw node circle
              ctx.beginPath();
              ctx.arc(x, y, size, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();
              ctx.strokeStyle = theme.palette.background.paper;
              ctx.lineWidth = 1.5;
              ctx.stroke();
              
              // Add node tooltip/label
              if (showLabels && globalScale >= 1) {
                const label = name;
                const fontSize = 12 / globalScale;
                ctx.font = `${fontSize}px Arial`;
                const textWidth = ctx.measureText(label).width;
                const backgroundHeight = fontSize + 4;
                const backgroundWidth = textWidth + 8;
                
                // Draw label background
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fillRect(
                  x - backgroundWidth / 2, 
                  y + size + 2, 
                  backgroundWidth, 
                  backgroundHeight
                );
                
                // Draw label text
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = theme.palette.text.primary;
                ctx.fillText(
                  label, 
                  x, 
                  y + size + 2 + backgroundHeight / 2
                );
              }
            }}
            nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
              const size = getNodeSize(node as ComponentNode) + 5;
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
              ctx.fill();
            }}
            linkDirectionalParticles={3}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleSpeed={0.01}
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            onNodeClick={(node: any) => {
              // Implement node click behavior if needed
              console.log('Clicked node:', node);
            }}
            cooldownTicks={100}
            onEngineStop={() => handleZoomToFit()}
          />
        )}
      </Box>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          * Hover over nodes to see details. Drag nodes to adjust the layout.
        </Typography>
      </Box>
    </Paper>
  );
};

export default ComponentRelationshipGraph; 