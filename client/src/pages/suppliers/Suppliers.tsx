import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SupplierList from './SupplierList';
import SupplierDetail from './SupplierDetail';
import CreateSupplier from './CreateSupplier';
import EditSupplier from './EditSupplier';

const Suppliers: React.FC = () => {
  return (
    <Routes>
      <Route index element={<SupplierList />} />
      <Route path="new" element={<CreateSupplier />} />
      <Route path=":id" element={<SupplierDetail />} />
      <Route path=":id/edit" element={<EditSupplier />} />
    </Routes>
  );
};

export default Suppliers; 