import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Checkbox,
  ListItemText,
  CircularProgress,
  Alert } from
'@mui/material';
import MockDataService from '../services/mockDataService';
import type { Customer, Supplier } from '../services/mockDataService';

// In a production environment, this would be loaded from environment variables
// For demo purposes, we'll use a placeholder and show a message if the map can't load
const GOOGLE_MAPS_API_KEY = 'AIzaSyA3qlqoHZJzltrdOrw99Rfa-DV4QWA60O0';

// Extend window with Google Maps types
declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options: any) => any;
        Marker: new (options: any) => any;
        InfoWindow: new (options: any) => any;
        LatLngBounds: new () => any;
        Polyline: new (options: any) => any;
        MapTypeId: {
          ROADMAP: string;
        };
        SymbolPath: {
          CIRCLE: number;
        };
        event: {
          addListener: (instance: any, event: string, handler: () => void) => any;
          removeListener: (listener: any) => void;
        };
      };
    };
    initMap?: () => void; // Add initMap callback to window
  }
}

// Extended interfaces with coordinates
interface ExtendedCustomer extends Customer {
  coordinates?: {
    lat: number;
    lng: number;
  };
  industry?: string;
  location?: string;
}

interface ExtendedSupplier extends Supplier {
  tier?: 'tier1' | 'tier2' | 'tier3';
  category?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  customers?: {_id: string;name: string;code: string;}[];
}

interface SupplierMapProps {
  height?: string | number;
}

const tierColors = {
  tier1: '#4caf50', // Green
  tier2: '#2196f3', // Blue
  tier3: '#ff9800' // Orange
};

const SupplierMap: React.FC<SupplierMapProps> = ({ height = 500 }) => {
  const [customers, setCustomers] = useState<ExtendedCustomer[]>([]);
  const [suppliers, setSuppliers] = useState<ExtendedSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [selectedTiers, setSelectedTiers] = useState<string[]>(['tier1', 'tier2', 'tier3']);

  // Reference to the map div and Google Maps instances
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // We'll create a utility function to better handle map errors
  const handleMapError = (error: any) => {
    console.error('Map error:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('ApiNotActivatedMapError')) {
      setError('Google Maps API Key Error: The Maps JavaScript API is not enabled for this API key. You need to enable it in the Google Cloud Console.');
    } else if (errorMessage.includes('RefererNotAllowedMapError')) {
      setError('Google Maps API Key Error: The current URL is not allowed to use this API key. You need to add this domain to the allowed referrers.');
    } else if (errorMessage.includes('InvalidKeyMapError')) {
      setError('Google Maps API Key Error: The provided API key is invalid or has expired.');
    } else {
      setError('Failed to initialize map: ' + errorMessage);
    }

    setLoading(false);
  };

  // Load script dynamically
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      // Skip if API key is not provided
      if (!GOOGLE_MAPS_API_KEY) {
        setLoading(false);
        return;
      }

      // Define callback for Google Maps to call when loaded
      window.initMap = () => {
        console.log('Google Maps initialized via callback');
        // Small delay to ensure all objects are registered
        setTimeout(() => {
          try {
            initializeMap();
          } catch (err) {
            handleMapError(err);
          }
        }, 100);
      };

      // Check if the script is already being loaded
      if (document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`)) {
        console.log('Google Maps script already loading or loaded');
        return;
      }

      // Skip if Google Maps is already loaded
      if (window.google && window.google.maps) {
        console.log('Google Maps already loaded');
        try {
          initializeMap();
        } catch (err) {
          handleMapError(err);
        }
        return;
      }

      try {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
        script.async = true;
        script.defer = true;

        script.addEventListener('error', (e) => {
          console.error('Error loading Google Maps script:', e);
          setError('Failed to load Google Maps API. Please check your API key.');
          setLoading(false);
        });

        document.head.appendChild(script);

        return () => {
          // Clean up script if component unmounts during loading
          if (document.head.contains(script)) {
            document.head.removeChild(script);
          }
          // Clean up global callback
          delete window.initMap;
        };
      } catch (err) {
        handleMapError(err);
      }
    };

    // Initialize mock data service and load data
    const loadData = async () => {
      try {
        MockDataService.initialize();
        setCustomers(MockDataService.getCustomers() as ExtendedCustomer[]);
        setSuppliers(MockDataService.getSuppliers() as ExtendedSupplier[]);
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data: ' + (err instanceof Error ? err.message : String(err)));
        setLoading(false);
      }
    };

    loadData();
    loadGoogleMapsScript();
  }, []);

  // Initialize map when data is loaded
  useEffect(() => {
    if (!loading && !error && mapRef.current && window.google && window.google.maps) {
      initializeMap();
    }
  }, [loading, error, suppliers, customers]);

  // Update markers when filters change
  useEffect(() => {
    if (googleMapRef.current) {
      updateMarkers();
    }
  }, [selectedCustomerId, selectedTiers]);

  const initializeMap = () => {
    // Make sure all required Google Maps objects are available
    if (!mapRef.current ||
    !window.google ||
    !window.google.maps ||
    !window.google.maps.Map ||
    !window.google.maps.MapTypeId) {
      console.log('Map reference or Google Maps objects not fully available');
      setLoading(false);
      return;
    }

    try {
      // Clear existing map
      if (googleMapRef.current) {
        // Clear existing markers
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];
      }

      // Create new map with safer defaults
      const mapOptions = {
        center: { lat: 39.8283, lng: -98.5795 }, // Center of US
        zoom: 4,
        mapTypeId: 'roadmap', // Use string instead of enum
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: false,
        fullscreenControl: true
      };

      googleMapRef.current = new window.google.maps.Map(mapRef.current, mapOptions);

      // Add markers
      updateMarkers();
    } catch (err) {
      console.error('Error initializing map:', err);

      // Check for common API errors
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('ApiNotActivatedMapError') || errorMessage.includes('RefererNotAllowedMapError')) {
        setError('Google Maps API key issue: The API key is not activated for Maps JavaScript API or has incorrect restrictions. Please check your Google Cloud Console settings.');
      } else {
        setError('Failed to initialize map: ' + errorMessage);
      }
      setLoading(false);
    }
  };

  const updateMarkers = () => {
    // Check if all required objects are available
    if (!googleMapRef.current ||
    !window.google ||
    !window.google.maps ||
    !window.google.maps.Marker ||
    !window.google.maps.InfoWindow ||
    !window.google.maps.LatLngBounds) {
      console.log('Map not properly initialized, cannot update markers');
      return;
    }

    try {
      // Clear existing markers
      markersRef.current.forEach((marker) => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
      markersRef.current = [];

      console.log('Updating markers - Customers:', customers.length, 'Suppliers:', suppliers.length);
      console.log('Selected customer ID:', selectedCustomerId);
      console.log('Selected tiers:', selectedTiers);

      const bounds = new window.google.maps.LatLngBounds();
      let markersAdded = 0;

      // Add customer markers
      customers.forEach((customer) => {
        // Skip if no coordinates
        if (!customer.coordinates) {
          console.log('Customer missing coordinates:', customer.name);
          return;
        }

        // If filtering by customer, skip others
        if (selectedCustomerId !== 'all' && customer._id !== selectedCustomerId) return;

        try {
          console.log('Adding customer marker:', customer.name, customer.coordinates);

          const marker = new window.google.maps.Marker({
            position: {
              lat: customer.coordinates.lat,
              lng: customer.coordinates.lng
            },
            map: googleMapRef.current,
            title: customer.name,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#f44336', // Red for customers
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#ffffff'
            }
          });

          // Info window
          const infoContent = `
            <div style="min-width: 200px;">
              <h3>${customer.name}</h3>
              <p><strong>Location:</strong> ${customer.location || 'N/A'}</p>
              <p><strong>Industry:</strong> ${customer.industry || 'N/A'}</p>
            </div>
          `;

          const infoWindow = new window.google.maps.InfoWindow({
            content: infoContent
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMapRef.current, marker);
          });

          markersRef.current.push(marker);
          bounds.extend(marker.getPosition());
          markersAdded++;
        } catch (err) {
          console.error('Error adding customer marker:', err);
        }
      });

      // Add supplier markers
      suppliers.forEach((supplier) => {
        // Skip if no coordinates
        if (!supplier.coordinates) {
          console.log('Supplier missing coordinates:', supplier.name);
          return;
        }

        // Skip if tier not selected
        if (supplier.tier && !selectedTiers.includes(supplier.tier)) {
          console.log('Supplier tier not selected:', supplier.name, supplier.tier);
          return;
        }

        // Skip if filtering by customer and not related
        if (selectedCustomerId !== 'all') {
          const isRelatedToCustomer = supplier.customers?.some((c) => c._id === selectedCustomerId);
          if (!isRelatedToCustomer) {
            console.log('Supplier not related to selected customer:', supplier.name);
            return;
          }
        }

        console.log('Adding supplier marker:', supplier.name, supplier.coordinates, supplier.tier);

        const tierColor = supplier.tier ? tierColors[supplier.tier] : '#9e9e9e';

        const marker = new window.google.maps.Marker({
          position: {
            lat: supplier.coordinates.lat,
            lng: supplier.coordinates.lng
          },
          map: googleMapRef.current,
          title: supplier.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: tierColor,
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#ffffff'
          }
        });

        // Info window
        const infoContent = `
          <div style="min-width: 200px;">
            <h3>${supplier.name}</h3>
            <p><strong>Location:</strong> ${supplier.location || 'N/A'}</p>
            <p><strong>Category:</strong> ${supplier.category || 'N/A'}</p>
            <p><strong>Tier:</strong> ${
        supplier.tier === 'tier1' ? 'Tier 1 (Direct)' :
        supplier.tier === 'tier2' ? 'Tier 2 (Secondary)' :
        supplier.tier === 'tier3' ? 'Tier 3 (Tertiary)' : 'Not specified'}</p>
          </div>
        `;


        const infoWindow = new window.google.maps.InfoWindow({
          content: infoContent
        });

        marker.addListener('click', () => {
          infoWindow.open(googleMapRef.current, marker);
        });

        markersRef.current.push(marker);
        bounds.extend(marker.getPosition());
        markersAdded++;

        // If customer is selected, draw line between customer and supplier
        if (selectedCustomerId !== 'all') {
          const selectedCustomer = customers.find((c) => c._id === selectedCustomerId);
          if (selectedCustomer?.coordinates) {
            const line = new window.google.maps.Polyline({
              path: [
              {
                lat: selectedCustomer.coordinates.lat,
                lng: selectedCustomer.coordinates.lng
              },
              {
                lat: supplier.coordinates.lat,
                lng: supplier.coordinates.lng
              }],

              geodesic: true,
              strokeColor: tierColor,
              strokeOpacity: 0.8,
              strokeWeight: 3
            });

            line.setMap(googleMapRef.current);
            markersRef.current.push(line);

            console.log('Added connection line from', selectedCustomer.name, 'to', supplier.name);
          }
        }
      });

      // Adjust map bounds if we have markers
      if (markersAdded > 0) {
        console.log('Adjusting bounds to fit', markersAdded, 'markers');
        try {
          googleMapRef.current.fitBounds(bounds);

          // Ensure a reasonable zoom level
          const listener = window.google.maps.event.addListener(googleMapRef.current, 'idle', () => {
            if (googleMapRef.current.getZoom() > 12) {
              googleMapRef.current.setZoom(12);
            }
            window.google.maps.event.removeListener(listener);
          });
        } catch (err) {
          console.error('Error adjusting map bounds:', err);
        }
      }
    } catch (err) {
      console.error('Error updating markers:', err);
      setError('Error updating map: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleCustomerChange = (event: any) => {
    setSelectedCustomerId(event.target.value);
  };

  const handleTierChange = (event: any) => {
    const {
      target: { value }
    } = event;
    setSelectedTiers(typeof value === 'string' ? value.split(',') : value);
  };

  const RenderMapContent = () => {
    if (error) {
      const isApiKeyError = error.includes('API Key Error');

      return (
        <Alert
          severity="error"
          sx={{ my: 2 }}
          action={
          isApiKeyError &&
          <Chip
            label="Demo Mode"
            color="primary"
            size="small"
            sx={{ mt: 1 }} />


          }>

          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            {error}
          </Typography>
          
          {isApiKeyError &&
          <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                To enable the Maps JavaScript API:
              </Typography>
              <ol style={{ paddingLeft: '1.5rem', margin: 0 }}>
                <li>Go to the <a href="https://console.cloud.google.com/apis/dashboard" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
                <li>Select your project or create a new one</li>
                <li>Navigate to "APIs & Services" → "Library"</li>
                <li>Search for "Maps JavaScript API" and enable it</li>
                <li>Go to "APIs & Services" → "Credentials"</li>
                <li>Check that your API key has appropriate restrictions (should allow localhost for development)</li>
              </ol>
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                Note: For this demo, you can continue using the fallback map display below.
              </Typography>
            </Box>
          }
        </Alert>);

    }

    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height={height}>
          <CircularProgress />
        </Box>);

    }

    if (!GOOGLE_MAPS_API_KEY || error) {
      // Fallback map visualization
      return (
        <Box
          sx={{
            height,
            width: '100%',
            borderRadius: 1,
            bgcolor: '#f5f5f5',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            border: '1px dashed #ccc',
            position: 'relative',
            overflow: 'hidden',
            p: 2
          }}>

          <Typography variant="h6" sx={{ mb: 1, zIndex: 1 }}>
            Network Visualization (Demo Mode)
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 3, zIndex: 1, textAlign: 'center' }}>
            The interactive map is not available, but you can still explore supplier relationships below
          </Typography>
          
          
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
          
          
          <Box sx={{
            width: '90%',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            zIndex: 1
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2">
                Customers:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {customers.length === 0 ?
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>Loading customer data...</Typography> :
                selectedCustomerId !== 'all' ?
                customers.
                filter((c) => c._id === selectedCustomerId).
                map((customer) =>
                <Chip
                  key={customer._id}
                  label={customer.name}
                  color="error"
                  size="small" />

                ) :

                customers.map((customer) =>
                <Chip
                  key={customer._id}
                  label={customer.name}
                  color="error"
                  size="small" />

                )
                }
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2">
                {selectedCustomerId !== 'all' ? 'Related ' : ''}Suppliers:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {suppliers.length === 0 ?
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>Loading supplier data...</Typography> :

                suppliers.
                filter((s) => selectedTiers.includes(s.tier || 'tier1')).
                filter((s) => selectedCustomerId === 'all' ||
                s.customers?.some((c) => c._id === selectedCustomerId)).
                map((supplier) =>
                <Chip
                  key={supplier._id}
                  label={`${supplier.name} (${supplier.tier?.replace('tier', 'T') || 'T1'})`}
                  size="small"
                  sx={{
                    bgcolor: supplier.tier ? tierColors[supplier.tier as keyof typeof tierColors] : '#9e9e9e',
                    color: 'white'
                  }} />

                )
                }
              </Box>
            </Box>
            
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Supply Chain Details
              </Typography>
              {selectedCustomerId !== 'all' ?
              <Box>
                  <Typography variant="body2">
                    {(() => {
                    const customer = customers.find((c) => c._id === selectedCustomerId);
                    const relatedSuppliers = suppliers.filter((s) =>
                    s.customers?.some((c) => c._id === selectedCustomerId) &&
                    selectedTiers.includes(s.tier || 'tier1')
                    );

                    if (!customer) return 'Select a customer to see details';

                    return `${customer.name} works with ${relatedSuppliers.length} supplier${relatedSuppliers.length !== 1 ? 's' : ''} in the selected tiers.`;
                  })()}
                  </Typography>
                </Box> :

              <Typography variant="body2">
                  Select a specific customer from the dropdown to see their supply chain relationships.
                </Typography>
              }
            </Paper>
          </Box>
        </Box>);

    }

    return (
      <Box ref={mapRef} sx={{ height, width: '100%', borderRadius: 1 }} />);

  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Supplier Network Map
      </Typography>

      <Box sx={{ mb: 2 }}>
        <FormControl sx={{ width: 200, mr: 2 }}>
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

        <FormControl sx={{ width: 200 }}>
          <InputLabel id="tier-select-label">Supplier Tiers</InputLabel>
          <Select
            labelId="tier-select-label"
            id="tier-select"
            multiple
            value={selectedTiers}
            onChange={handleTierChange}
            input={<OutlinedInput label="Supplier Tiers" />}
            renderValue={(selected) =>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) =>
              <Chip
                key={value}
                label={value.replace('tier', 'Tier ')}
                size="small"
                sx={{
                  backgroundColor: tierColors[value as keyof typeof tierColors],
                  color: 'white'
                }} />

              )}
              </Box>
            }>

            {['tier1', 'tier2', 'tier3'].map((tier) =>
            <MenuItem key={tier} value={tier}>
                <Checkbox checked={selectedTiers.indexOf(tier) > -1} />
                <ListItemText
                primary={tier.replace('tier', 'Tier ')}
                secondary={`${tier === 'tier1' ? 'Direct' : tier === 'tier2' ? 'Secondary' : 'Tertiary'} suppliers`} />

              </MenuItem>
            )}
          </Select>
        </FormControl>
      </Box>

      {RenderMapContent()}

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          The map shows the geographical distribution of suppliers and their relationships with customers.
          {selectedCustomerId !== 'all' && ' Lines indicate direct supply relationships.'}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#f44336',
                mr: 1
              }} />

            <Typography variant="body2">Customers</Typography>
          </Box>

          {['tier1', 'tier2', 'tier3'].map((tier) =>
          <Box key={tier} sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: tierColors[tier as keyof typeof tierColors],
                mr: 1
              }} />

              <Typography variant="body2">{tier.replace('tier', 'Tier ')} Suppliers</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>);

};

export default SupplierMap;