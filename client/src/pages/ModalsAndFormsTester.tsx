import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  TextField,
  Alert,
  Snackbar,
  useTheme,
} from '@mui/material';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import SearchModal from '../components/common/SearchModal';
import NotificationModal from '../components/notifications/NotificationModal';
import EditProfileModal from '../components/user/EditProfileModal';
import FilterModal, { FilterOption } from '../components/common/FilterModal';
import FileUploadModal from '../components/common/FileUploadModal';
import { PageHeader } from '../components/common';

// Sample data for testing
const sampleProfile = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phoneNumber: '+1 (555) 123-4567',
  position: 'Quality Inspector',
  department: 'Quality Assurance',
  company: 'AeroSuite Inc.',
  location: 'New York, NY',
  bio: 'Experienced quality inspector with 10+ years in aerospace manufacturing.',
  avatar: 'https://i.pravatar.cc/300?img=8',
};

const sampleNotifications = [
  {
    id: '1',
    title: 'New Inspection Scheduled',
    message: 'A new inspection has been scheduled for Supplier ABC on June 15, 2025',
    timestamp: new Date(2025, 5, 10, 10, 30),
    read: false,
    type: 'info',
    category: 'inspection',
  },
  {
    id: '2',
    title: 'Inspection Overdue',
    message: 'Inspection #1234 is overdue for completion',
    timestamp: new Date(2025, 5, 9, 14, 45),
    read: false,
    type: 'warning',
    category: 'overdue',
  },
  {
    id: '3',
    title: 'New Report Available',
    message: 'Monthly compliance report is now available for review',
    timestamp: new Date(2025, 5, 8, 9, 15),
    read: true,
    type: 'success',
    category: 'report',
  },
  {
    id: '4',
    title: 'System Maintenance',
    message: 'The system will be down for maintenance on Sunday from 2AM to 4AM',
    timestamp: new Date(2025, 5, 7, 16, 0),
    read: true,
    type: 'info',
    category: 'system',
  },
  {
    id: '5',
    title: 'Login from New Device',
    message: 'Your account was accessed from a new device in Chicago, IL',
    timestamp: new Date(2025, 5, 6, 8, 30),
    read: true,
    type: 'warning',
    category: 'security',
  },
];

const filterOptions: FilterOption[] = [
  {
    id: 'status',
    label: 'Status',
    type: 'checkbox',
    section: 'Inspection',
    options: [
      { value: 'scheduled', label: 'Scheduled' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
    defaultValue: [],
  },
  {
    id: 'priority',
    label: 'Priority',
    type: 'radio',
    section: 'Inspection',
    options: [
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' },
    ],
  },
  {
    id: 'date_range',
    label: 'Date Range',
    type: 'dateRange',
    section: 'Inspection',
  },
  {
    id: 'supplier_type',
    label: 'Supplier Type',
    type: 'select',
    section: 'Supplier',
    options: [
      { value: 'manufacturer', label: 'Manufacturer' },
      { value: 'distributor', label: 'Distributor' },
      { value: 'service', label: 'Service Provider' },
    ],
  },
  {
    id: 'certification',
    label: 'Certifications',
    type: 'multiselect',
    section: 'Supplier',
    options: [
      { value: 'iso9001', label: 'ISO 9001' },
      { value: 'as9100', label: 'AS9100' },
      { value: 'nadcap', label: 'NADCAP' },
    ],
    defaultValue: [],
  },
  {
    id: 'price_range',
    label: 'Price Range',
    type: 'range',
    section: 'Supplier',
    minValue: 0,
    maxValue: 10000,
    step: 100,
    unit: '$',
    defaultValue: [0, 10000],
  },
];

const fileCategories = [
  { id: 'documents', name: 'Documents' },
  { id: 'images', name: 'Images' },
  { id: 'reports', name: 'Reports' },
];

// Mock search results that match the SearchResult interface expected by SearchModal
const mockSearchResults = [
  {
    id: '1',
    title: 'Aerospace Parts Inc.',
    description: 'Supplier - ISO 9001, AS9100 certified',
    type: 'supplier',
    url: '/suppliers/1',
    icon: 'business',
    date: new Date(2023, 5, 15),
  },
  {
    id: '2',
    title: 'Precision Manufacturing',
    description: 'Supplier - Specializes in CNC machining',
    type: 'supplier',
    url: '/suppliers/2',
    icon: 'business',
    date: new Date(2023, 6, 22),
  },
  {
    id: '3',
    title: 'Inspection #A-2345',
    description: 'First Article Inspection - Aerospace Parts Inc.',
    type: 'inspection',
    url: '/inspections/3',
    icon: 'assignment',
    date: new Date(2023, 7, 10),
  },
  {
    id: '4',
    title: 'GlobalTech Aviation',
    description: 'Customer - Commercial aircraft manufacturer',
    type: 'customer',
    url: '/customers/4',
    icon: 'account_circle',
    date: new Date(2023, 4, 5),
  },
];

const ModalsAndFormsTester: React.FC = () => {
  const theme = useTheme();
  
  // State for modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);
  
  // State for feedback
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  
  // Handle modal functions
  const handleDeleteConfirm = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    showSnackbar('Item deleted successfully', 'success');
  };
  
  const handleSearchResult = (result: any) => {
    showSnackbar(`Selected: ${result.title}`, 'info');
  };
  
  const handleSearch = async (query: string) => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    return mockSearchResults.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) || 
      item.description.toLowerCase().includes(query.toLowerCase())
    );
  };
  
  const handleMarkAllNotificationsRead = () => {
    showSnackbar('All notifications marked as read', 'success');
  };
  
  const handleDeleteAllNotifications = () => {
    showSnackbar('All notifications deleted', 'info');
  };
  
  const handleNotificationClick = (notification: any) => {
    showSnackbar(`Clicked on notification: ${notification.title}`, 'info');
  };
  
  const handleProfileSave = async (profile: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    showSnackbar('Profile updated successfully', 'success');
  };
  
  const handleApplyFilters = (filters: any) => {
    showSnackbar(`Filters applied: ${JSON.stringify(filters)}`, 'info');
  };
  
  const handleFileUpload = async (files: File[], category?: string, description?: string) => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
    showSnackbar(`Uploaded ${files.length} files${category ? ` to ${category}` : ''}`, 'success');
  };
  
  // Helper for showing snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Modals & Forms Tester"
        subtitle="Test and verify all modal components and forms"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Modals & Forms Tester' },
        ]}
      />

      <Grid container spacing={3}>
        {/* Delete Confirmation Modal */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Delete Confirmation Modal
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                A modal for confirming deletion of items with proper warnings and error handling.
              </Typography>
            </CardContent>
            <Divider />
            <CardActions>
              <Button 
                variant="contained" 
                color="error"
                onClick={() => setDeleteModalOpen(true)}
              >
                Open Delete Modal
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Search Modal */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Search Modal
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Advanced search interface with real-time results, filtering, and history tracking.
              </Typography>
            </CardContent>
            <Divider />
            <CardActions>
              <Button 
                variant="contained" 
                onClick={() => setSearchModalOpen(true)}
              >
                Open Search Modal
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Notifications Modal */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notifications Modal
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Comprehensive notifications center with read/unread status, filtering, and bulk actions.
              </Typography>
            </CardContent>
            <Divider />
            <CardActions>
              <Button 
                variant="contained" 
                onClick={() => setNotificationModalOpen(true)}
              >
                Open Notifications Modal
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Edit Profile Modal */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Edit Profile Modal
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Form for editing user profile information with validation and avatar upload.
              </Typography>
            </CardContent>
            <Divider />
            <CardActions>
              <Button 
                variant="contained" 
                onClick={() => setEditProfileModalOpen(true)}
              >
                Open Edit Profile Modal
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Filter Modal */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filter Modal
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Advanced filtering interface with multiple filter types, sections, and saved presets.
              </Typography>
            </CardContent>
            <Divider />
            <CardActions>
              <Button 
                variant="contained" 
                onClick={() => setFilterModalOpen(true)}
              >
                Open Filter Modal
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* File Upload Modal */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                File Upload Modal
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Interactive file upload interface with drag & drop, progress tracking, and validation.
              </Typography>
            </CardContent>
            <Divider />
            <CardActions>
              <Button 
                variant="contained" 
                onClick={() => setFileUploadModalOpen(true)}
              >
                Open File Upload Modal
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
      />

      {/* Search Modal */}
      <SearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        initialQuery=""
        onSearch={async (query) => {
          // Mock search delay
          await new Promise(resolve => setTimeout(resolve, 500));
          return mockSearchResults.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) || 
            item.description.toLowerCase().includes(query.toLowerCase())
          );
        }}
        onResultClick={(result) => showSnackbar(`Selected: ${result.title}`, 'info')}
        showFilters={true}
        showRecentSearches={true}
        showTrending={true}
        recentSearches={['aerospace parts', 'inspection report', 'supplier evaluation']}
        trendingSearches={['quality audit', 'certification', 'compliance report']}
      />

      {/* Notification Modal */}
      <NotificationModal
        open={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
        notifications={sampleNotifications}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onDeleteAll={handleDeleteAllNotifications}
        onNotificationClick={handleNotificationClick}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        open={editProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        profile={sampleProfile}
        onSave={handleProfileSave}
      />

      {/* Filter Modal */}
      <FilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={handleApplyFilters}
        filterOptions={filterOptions}
        showSearch={true}
        onSearch={(term) => showSnackbar(`Searching for: ${term}`, 'info')}
      />

      {/* File Upload Modal */}
      <FileUploadModal
        open={fileUploadModalOpen}
        onClose={() => setFileUploadModalOpen(false)}
        onUpload={handleFileUpload}
        maxFiles={5}
        maxSize={5 * 1024 * 1024} // 5MB
        acceptedFileTypes={['image/*', 'application/pdf']}
        categories={fileCategories}
        showDescriptionField={true}
        showCategoryField={true}
      />

      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ModalsAndFormsTester;