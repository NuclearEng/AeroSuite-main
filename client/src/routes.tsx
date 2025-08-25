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
const CustomerDetail = lazy(() => import('./pages/customers/CustomerDetail'));
const EditCustomer = lazy(() => import('./pages/customers/EditCustomer'));
const CustomerOrders = lazy(() => import('./pages/customers/CustomerOrders'));

// Supplier pages
const SupplierList = lazy(() => import('./pages/suppliers/SupplierList'));
const CreateSupplier = lazy(() => import('./pages/suppliers/CreateSupplier'));
const SupplierDetail = lazy(() => import('./pages/suppliers/SupplierDetail'));
const EditSupplier = lazy(() => import('./pages/suppliers/EditSupplier'));
const SupplierPerformance = lazy(() => import('./pages/suppliers/SupplierPerformance'));
const SupplierOrders = lazy(() => import('./pages/suppliers/SupplierOrders'));
const SupplierQuality = lazy(() => import('./pages/suppliers/SupplierQuality'));
const EnhancedSupplierForm = lazy(() => import('./pages/suppliers/EnhancedSupplierForm'));
const EnhancedSupplierTable = lazy(() => import('./pages/suppliers/EnhancedSupplierTable'));

// Inspection pages
const InspectionList = lazy(() => import('./pages/inspections/InspectionList'));
const ScheduleInspection = lazy(() => import('./pages/inspections/ScheduleInspection'));
const InspectionDetail = lazy(() => import('./pages/inspections/InspectionDetail'));
const ConductInspection = lazy(() => import('./pages/inspections/ConductInspection'));
const EditInspection = lazy(() => import('./pages/inspections/EditInspection'));
const QualityMetrics = lazy(() => import('./pages/inspections/QualityMetrics'));
const InspectorProfile = lazy(() => import('./pages/inspections/InspectorProfile'));
const KanbanBoard = lazy(() => import('./pages/inspections/KanbanBoard'));

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
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
const ResendVerification = lazy(() => import('./pages/auth/ResendVerification'));

// Create a loading component
const LoadingFallback = () =>
<Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
    <CircularProgress />
  </Box>;


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
        
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password/:token" element={<ResetPassword />} />
        <Route path="/auth/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/auth/resend-verification" element={<ResendVerification />} />

        
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          
          <Route path="customers">
            <Route index element={<CustomerList />} />
            <Route path="create" element={<CreateCustomer />} />
            <Route path=":id" element={<CustomerDetail />} />
            <Route path=":id/edit" element={<EditCustomer />} />
            <Route path=":id/orders" element={<CustomerOrders />} />
          </Route>
          
          
          <Route path="suppliers">
            <Route index element={<SupplierList />} />
            <Route path="create" element={<CreateSupplier />} />
            <Route path=":id" element={<SupplierDetail />} />
            <Route path=":id/edit" element={<EditSupplier />} />
            <Route path=":id/performance" element={<SupplierPerformance />} />
            <Route path=":id/orders" element={<SupplierOrders />} />
            <Route path=":id/quality" element={<SupplierQuality />} />
            <Route path="enhanced-form" element={<EnhancedSupplierForm />} />
            <Route path="enhanced-table" element={<EnhancedSupplierTable />} />
          </Route>
          
          
          <Route path="inspections">
            <Route index element={<InspectionList />} />
            <Route path="schedule" element={<ScheduleInspection />} />
            <Route path="kanban" element={<KanbanBoard />} />
            <Route path=":id" element={<InspectionDetail />} />
            <Route path=":id/conduct" element={<ConductInspection />} />
            <Route path=":id/edit" element={<EditInspection />} />
            <Route path="quality-metrics" element={<QualityMetrics />} />
            <Route path="inspector-profile" element={<InspectorProfile />} />
          </Route>
          
          
          <Route path="reports">
            <Route index element={<ReportBuilder />} />
            <Route path="builder" element={<ReportBuilder />} />
            <Route path="visualization" element={<DataVisualization />} />
          </Route>
          
          
          <Route path="metrics" element={<ApplicationMetrics />} />
          <Route path="ai-analysis" element={<AIAnalysis />} />
          <Route path="monitoring/performance" element={<PerformanceMetrics />} />
          
          
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />
          <Route path="modals-and-forms" element={<ModalsAndFormsTester />} />
          
          
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>);

};

export default AppRoutes;