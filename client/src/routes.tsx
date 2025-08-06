import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout components
import MainLayout from './layouts/MainLayout';

// Page components
import Help from './pages/Help';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ModalsAndFormsTester from './pages/ModalsAndFormsTester';

// Create a simple login page component for now
const Login = () =>
<div style={{ padding: '2rem', textAlign: 'center' }}>
    <h1>Login</h1>
    <p>Login functionality coming soon...</p>
      </div>;


// Create a simple dashboard component
const Dashboard = () =>
<div style={{ padding: '2rem' }}>
    <h1>Dashboard</h1>
    <p>Welcome to AeroSuite!</p>
    </div>;


// Create a simple not found component
const NotFound = () =>
<div style={{ padding: '2rem', textAlign: 'center' }}>
    <h1>404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
  </div>;


const AppRoutes: React.FC = () => {
  return (
    <Routes>
      
      <Route path="/auth/login" element={<Login />} />

      
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="help" element={<Help />} />
        <Route path="modals-and-forms" element={<ModalsAndFormsTester />} />
        
        
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>);

};

export default AppRoutes;