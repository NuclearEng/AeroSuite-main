import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

// Layout components
import MainLayout from './layouts/MainLayout';

// Page components - Lazy loaded for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Help = lazy(() => import('./pages/Help'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const ModalsAndFormsTester = lazy(() => import('./pages/ModalsAndFormsTester'));

// Customer pages
const CustomerList = lazy(() => import('./pages/customers/CustomerList'));
const CreateCustomer = lazy(() => import('./pages/customers/CreateCustomer'));

// Supplier pages
const SupplierList = lazy(() => import('./pages/suppliers/SupplierList'));
const CreateSupplier = lazy(() => import('./pages/suppliers/CreateSupplier'));
const EnhancedSupplierForm = lazy(() => import('./pages/suppliers/EnhancedSupplierForm'));
const EnhancedSupplierTable = lazy(() => import('./pages/suppliers/EnhancedSupplierTable'));

// Inspection pages
const InspectionList = lazy(() => import('./pages/inspections/InspectionList'));
const ScheduleInspection = lazy(() => import('./pages/inspections/ScheduleInspection'));

// Report pages
const ReportBuilder = lazy(() => import('./pages/reports/ReportBuilder'));
const DataVisualization = lazy(() => import('./pages/reports/DataVisualization'));
const ApplicationMetrics = lazy(() => import('./pages/ApplicationMetrics'));

// AI Analysis page
const AIAnalysis = lazy(() => import('./pages/AIAnalysis'));

// Performance Monitoring
const PerformanceMetrics = lazy(() => import('./pages/monitoring/PerformanceMetricsDashboard'));

// Auth pages
const Login = lazy(() => import('./pages/auth/Login'));

// Create a loading component
const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
    <CircularProgress />
  </Box>
);

// Create a simple not found component
const NotFound = () =>
<div style={{ padding: '2rem', textAlign: 'center' }}>
    <h1>404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
  </div>;


const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Auth Routes */}
        <Route path="/auth/login" element={<Login />} />

        {/* Main Layout Routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Customer Routes */}
          <Route path="customers">
            <Route index element={<CustomerList />} />
            <Route path="create" element={<CreateCustomer />} />
          </Route>
          
          {/* Supplier Routes */}
          <Route path="suppliers">
            <Route index element={<SupplierList />} />
            <Route path="create" element={<CreateSupplier />} />
            <Route path="enhanced-form" element={<EnhancedSupplierForm />} />
            <Route path="enhanced-table" element={<EnhancedSupplierTable />} />
          </Route>
          
          {/* Inspection Routes */}
          <Route path="inspections">
            <Route index element={<InspectionList />} />
            <Route path="schedule" element={<ScheduleInspection />} />
          </Route>
          
          {/* Report Routes */}
          <Route path="reports">
            <Route index element={<ReportBuilder />} />
            <Route path="builder" element={<ReportBuilder />} />
            <Route path="visualization" element={<DataVisualization />} />
          </Route>
          
          {/* Other Routes */}
          <Route path="metrics" element={<ApplicationMetrics />} />
          <Route path="ai-analysis" element={<AIAnalysis />} />
          <Route path="monitoring/performance" element={<PerformanceMetrics />} />
          
          {/* Settings & Profile */}
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />
          <Route path="modals-and-forms" element={<ModalsAndFormsTester />} />
          
          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;