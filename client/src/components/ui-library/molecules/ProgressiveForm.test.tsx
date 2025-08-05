import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { ProgressiveForm, FormField } from './ProgressiveForm';
import { LoadPriority } from '../../../utils/codeSplittingConfig';
import { TextField, Select, MenuItem } from '@mui/material';

// Mock the progressive loading hook
jest.mock('../../../utils/progressiveLoading', () => ({
  useIncrementalHydration: () => ({
    hydratedComponents: [],
    isComplete: true,
    progress: 100,
    isHydrated: () => true
  })
}));

describe('ProgressiveForm', () => {
  // Test form fields
  const mockFields: FormField[] = [
    {
      id: 'name',
      label: 'Name',
      component: TextField,
      priority: LoadPriority.HIGH,
      required: true,
      validate: (value) => !value ? 'Name is required' : null
    },
    {
      id: 'email',
      label: 'Email',
      component: TextField,
      priority: LoadPriority.MEDIUM,
      required: true,
      validate: (value) => {
        if (!value) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format';
        return null;
      }
    },
    {
      id: 'role',
      label: 'Role',
      component: (props) => (
        <Select {...props}>
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="user">User</MenuItem>
        </Select>
      ),
      priority: LoadPriority.LOW,
      required: false
    }
  ];

  it('renders form fields correctly', () => {
    render(
      <ProgressiveForm
        fields={mockFields}
        title="Test Form"
        progressiveLoadingEnabled={false}
      />
    );
    
    expect(screen.getByText('Test Form')).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
  });

  it('initializes with provided values', () => {
    const initialValues = {
      name: 'John Doe',
      email: 'john@example.com'
    };
    
    render(
      <ProgressiveForm
        fields={mockFields}
        initialValues={initialValues}
        progressiveLoadingEnabled={false}
      />
    );
    
    expect(screen.getByLabelText(/Name/)).toHaveValue('John Doe');
    expect(screen.getByLabelText(/Email/)).toHaveValue('john@example.com');
  });

  it('shows validation errors on submit', async () => {
    const handleSubmit = jest.fn();
    
    render(
      <ProgressiveForm
        fields={mockFields}
        onSubmit={handleSubmit}
        progressiveLoadingEnabled={false}
      />
    );
    
    // Submit the empty form
    fireEvent.click(screen.getByText('Submit'));
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
    
    // Ensure onSubmit was not called
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    const handleSubmit = jest.fn();
    
    render(
      <ProgressiveForm
        fields={mockFields}
        onSubmit={handleSubmit}
        progressiveLoadingEnabled={false}
      />
    );
    
    // Fill in name correctly but email incorrectly
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'invalid-email' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Submit'));
    
    // Check for validation error on email only
    await waitFor(() => {
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
    
    // Ensure onSubmit was not called
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('clears errors when fields are corrected', async () => {
    render(
      <ProgressiveForm
        fields={mockFields}
        progressiveLoadingEnabled={false}
      />
    );
    
    // Submit empty form to trigger validation
    fireEvent.click(screen.getByText('Submit'));
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
    
    // Fix the error
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } });
    
    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    });
  });

  it('calls onSubmit with form values when validation passes', async () => {
    const handleSubmit = jest.fn();
    
    render(
      <ProgressiveForm
        fields={mockFields}
        onSubmit={handleSubmit}
        progressiveLoadingEnabled={false}
      />
    );
    
    // Fill in required fields correctly
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Submit'));
    
    // Ensure onSubmit was called with correct values
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
      });
    });
  });

  it('handles cancel button click', () => {
    const handleCancel = jest.fn();
    
    render(
      <ProgressiveForm
        fields={mockFields}
        onCancel={handleCancel}
        progressiveLoadingEnabled={false}
      />
    );
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(handleCancel).toHaveBeenCalled();
  });

  it('disables fields when isLoading is true', () => {
    render(
      <ProgressiveForm
        fields={mockFields}
        isLoading={true}
        progressiveLoadingEnabled={false}
      />
    );
    
    expect(screen.getByLabelText(/Name/)).toBeDisabled();
    expect(screen.getByLabelText(/Email/)).toBeDisabled();
  });

  it('respects field visibility settings', () => {
    const fieldsWithHidden = [
      ...mockFields,
      {
        id: 'hidden',
        label: 'Hidden Field',
        component: TextField,
        priority: LoadPriority.LOW,
        visible: false
      }
    ];
    
    render(
      <ProgressiveForm
        fields={fieldsWithHidden}
        progressiveLoadingEnabled={false}
      />
    );
    
    expect(screen.queryByLabelText(/Hidden Field/)).not.toBeInTheDocument();
  });
}); 