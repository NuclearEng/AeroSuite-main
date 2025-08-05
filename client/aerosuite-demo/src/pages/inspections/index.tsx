import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import InspectionList from './InspectionList';
import InspectionDetail from './InspectionDetail';
import InspectionSchedule from './InspectionSchedule';
import InspectionConductor from './InspectionConductor';
import Dashboard from './Dashboard';

const InspectionsRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<InspectionList />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/schedule" element={<InspectionSchedule />} />
      <Route path="/:id" element={<InspectionDetail />} />
      <Route path="/:id/conduct" element={<InspectionConductor />} />
      <Route path="*" element={<Navigate to="/inspections" replace />} />
    </Routes>
  );
};

export default InspectionsRoutes; 