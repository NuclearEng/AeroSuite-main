import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Select, SelectChangeEvent } from '@mui/material';
import { MUISelectChangeHandler } from '../../types/mui';
import { SupplierFormValues, SupplierData } from '../../types/supplier';
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

export const EditSupplier: React.FC = () => {
  const { id } = useParams<{id: string;}>();
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState<SupplierFormValues>(initialFormValues);

  useEffect(() => {
    const loadSupplier = async () => {
      if (!id) return;
      try {
        const data = await supplierService.getSupplier(id);
        const { id: _, ...formData } = data;
        setFormValues(formData);
      } catch (error) {
        console.error('Failed to load supplier:', error);
      }
    };
    loadSupplier();
  }, [id]);

  const handleChange: MUISelectChangeHandler = (
  event: SelectChangeEvent) =>
  {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (name: keyof SupplierFormValues, newValue: string[]) => {
    setFormValues((prev) => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;

    try {
      await supplierService.updateSupplier(id, formValues);
      navigate(`/suppliers/${id}`);
    } catch (error) {
      console.error('Failed to update supplier:', error);
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