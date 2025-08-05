import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Chip,
  Divider,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';

const SupplierDetails = () => {
  const { id } = useParams();
  
  // Mock data for supplier details
  const supplier = {
    id: parseInt(id),
    name: 'Aerospace Components Inc.',
    code: 'ACI-001',
    type: 'Manufacturer',
    location: 'Seattle, WA',
    address: '123 Aviation Way, Seattle, WA 98101',
    phone: '+1 (206) 555-1234',
    email: 'info@aerospacecomponents.com',
    website: 'www.aerospacecomponents.com',
    rating: 4.8,
    status: 'Active',
    createdAt: '2022-05-15',
    description: 'Leading manufacturer of precision components for commercial aircraft with over 25 years of experience in the aerospace industry.',
    contacts: [
      { name: 'John Smith', position: 'Account Manager', phone: '+1 (206) 555-2345', email: 'john.smith@aerospacecomponents.com' },
      { name: 'Sarah Johnson', position: 'Technical Support', phone: '+1 (206) 555-3456', email: 'sarah.johnson@aerospacecomponents.com' }
    ],
    certifications: ['AS9100D', 'ISO 9001:2015', 'NADCAP'],
    products: ['Fasteners', 'Brackets', 'Structural Components', 'Interior Components']
  };

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              component={Link} 
              to="/suppliers" 
              startIcon={<ArrowBackIcon />}
              sx={{ mr: 2 }}
            >
              Back
            </Button>
            <Typography variant="h4" component="h1">
              {supplier.name}
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<EditIcon />}
            component={Link}
            to={`/suppliers/${id}/edit`}
          >
            Edit
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Company Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Company Type
                      </Typography>
                      <Typography variant="body1">
                        {supplier.type}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body1">
                        {supplier.address}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1">
                        {supplier.phone}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">
                        {supplier.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Description
              </Typography>
              <Typography variant="body1" paragraph>
                {supplier.description}
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Products & Services
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {supplier.products.map((product, index) => (
                  <Chip key={index} label={product} />
                ))}
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardHeader title="Status" />
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body1">
                    Current Status
                  </Typography>
                  <Chip 
                    label={supplier.status} 
                    color={supplier.status === 'Active' ? 'success' : 'default'}
                  />
                </Box>
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body1">
                    Rating
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {supplier.rating}/5.0
                  </Typography>
                </Box>
              </CardContent>
            </Card>
            
            <Card sx={{ mb: 3 }}>
              <CardHeader title="Certifications" />
              <CardContent>
                <List dense>
                  {supplier.certifications.map((cert, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={cert} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader title="Key Contacts" />
              <CardContent>
                {supplier.contacts.map((contact, index) => (
                  <Box key={index} sx={{ mb: index < supplier.contacts.length - 1 ? 2 : 0 }}>
                    <Typography variant="subtitle2">{contact.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{contact.position}</Typography>
                    <Typography variant="body2">{contact.phone}</Typography>
                    <Typography variant="body2">{contact.email}</Typography>
                    {index < supplier.contacts.length - 1 && <Divider sx={{ mt: 1, mb: 1 }} />}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default SupplierDetails; 