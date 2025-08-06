import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Select, SelectChangeEvent } from '@mui/material';
import { MUISelectChangeHandler } from '../../types/mui';
import { SupplierFormValues } from '../../types/supplier';
import { supplierService } from '../../services/supplier.service';

const initialFormValues: SupplierFormValues = {
  name: '',
  code: '',
  description: '',
  industry: '',
  status: '',
  website: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  },
  qualifications: [],
  certifications: [],
  notes: '',
  supplierTags: []
};

export const CreateSupplier: React.FC = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState<SupplierFormValues>(initialFormValues);

  const handleChange: MUISelectChangeHandler = (
  event: SelectChangeEvent) =>
  {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const supplierData = await supplierService.createSupplier(formValues);
      navigate(`/suppliers/${supplierData.id}`);
    } catch (error) {
      console.error('Failed to create supplier:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Select
        name="industry"
        value={formValues.industry}
        onChange={handleChange}>

        
      </Select>
      <Select
        name="status"
        value={formValues.status}
        onChange={handleChange}>

        
      </Select>
      
    </form>);

};