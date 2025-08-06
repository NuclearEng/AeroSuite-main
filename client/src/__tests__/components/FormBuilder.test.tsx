import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import FormBuilder from '../../components/common/FormBuilder';

describe('FormBuilder Component', () => {
  const mockFields = [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'Enter name',
      validation: {
        required: 'Name is required',
        minLength: {
          value: 3,
          message: 'Name must be at least 3 characters'
        }
      }
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'Enter email address',
      validation: {
        required: 'Email is required',
        pattern: {
          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
          message: 'Invalid email address'
        }
      }
    },
    {
      name: 'age',
      label: 'Age',
      type: 'number',
      required: false,
      placeholder: 'Enter age',
      validation: {
        min: {
          value: 18,
          message: 'Age must be at least 18'
        }
      }
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'category1', label: 'Category 1' },
        { value: 'category2', label: 'Category 2' },
        { value: 'category3', label: 'Category 3' }
      ],
      required: true,
      validation: {
        required: 'Category is required'
      }
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: false,
      placeholder: 'Enter description',
      validation: {
        maxLength: {
          value: 500,
          message: 'Description must be less than 500 characters'
        }
      }
    },
    {
      name: 'active',
      label: 'Active',
      type: 'checkbox',
      required: false
    },
    {
      name: 'preferences',
      label: 'Preferences',
      type: 'checkboxgroup',
      options: [
        { value: 'pref1', label: 'Preference 1' },
        { value: 'pref2', label: 'Preference 2' },
        { value: 'pref3', label: 'Preference 3' }
      ],
      required: false
    },
    {
      name: 'receiveEmails',
      label: 'Receive Emails',
      type: 'switch',
      required: false
    }
  ];

  const defaultValues = {
    name: '',
    email: '',
    age: '',
    category: '',
    description: '',
    active: false,
    preferences: [],
    receiveEmails: false
  };

  test('renders form fields correctly', () => {
    renderWithProviders(
      <FormBuilder title="Test Form"
        fields={mockFields}
        defaultValues={defaultValues}
        onSubmit={() = as any> {}}
      />
    );
    
    // Check form title
    expect(screen.getByText('Test Form')).toBeInTheDocument();
    
    // Check all form fields are rendered
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/age/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/active/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preferences/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/receive emails/i)).toBeInTheDocument();
    
    // Check submit button is rendered
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  test('handles form submission with valid data', async () => {
    const handleSubmit = jest.fn();
    
    renderWithProviders(
      <FormBuilder title="Test Form"
        fields={mockFields}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
      / as any>
    );
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john.doe@example.com' } });
    
    // Select a category
    fireEvent.mouseDown(screen.getByLabelText(/category/i));
    const categoryOptions = await screen.findAllByRole('option');
    fireEvent.click(categoryOptions[0]); // Select Category 1
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    // Check that onSubmit was called with the correct data
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john.doe@example.com',
          category: 'category1'
        }),
        expect.anything()
      );
    });
  });

  test('displays validation errors for invalid data', async () => {
    renderWithProviders(
      <FormBuilder title="Test Form"
        fields={mockFields}
        defaultValues={defaultValues}
        onSubmit={() = as any> {}}
      />
    );
    
    // Submit form without filling required fields
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    // Check that validation errors are displayed
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Category is required')).toBeInTheDocument();
    });
    
    // Fill with invalid data
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jo' } }); // Too short
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid-email' } }); // Invalid email
    fireEvent.change(screen.getByLabelText(/age/i), { target: { value: '15' } }); // Too young
    
    // Submit again
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    // Check that validation errors are updated
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument();
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      expect(screen.getByText('Age must be at least 18')).toBeInTheDocument();
    });
  });

  test('handles form reset', () => {
    renderWithProviders(
      <FormBuilder title="Test Form"
        fields={mockFields}
        defaultValues={defaultValues}
        onSubmit={() = as any> {}}
        showReset={true}
      />
    );
    
    // Fill in some fields
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john.doe@example.com' } });
    
    // Check that values are set
    expect(screen.getByLabelText(/name/i)).toHaveValue('John Doe');
    expect(screen.getByLabelText(/email/i)).toHaveValue('john.doe@example.com');
    
    // Reset the form
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    
    // Check that values are reset
    expect(screen.getByLabelText(/name/i)).toHaveValue('');
    expect(screen.getByLabelText(/email/i)).toHaveValue('');
  });

  test('handles form with default values', () => {
    const prefilledValues = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      age: '25',
      category: 'category2',
      description: 'This is a test description',
      active: true,
      preferences: ['pref1', 'pref3'],
      receiveEmails: true
    };
    
    renderWithProviders(
      <FormBuilder title="Prefilled Form"
        fields={mockFields}
        defaultValues={prefilledValues}
        onSubmit={() = as any> {}}
      />
    );
    
    // Check that default values are set correctly
    expect(screen.getByLabelText(/name/i)).toHaveValue('John Doe');
    expect(screen.getByLabelText(/email/i)).toHaveValue('john.doe@example.com');
    expect(screen.getByLabelText(/age/i)).toHaveValue(25);
    expect(screen.getByLabelText(/description/i)).toHaveValue('This is a test description');
    
    // Check checkbox is checked
    expect(screen.getByLabelText(/active/i)).toBeChecked();
  });

  test('handles custom submit button text', () => {
    renderWithProviders(
      <FormBuilder title="Test Form"
        fields={mockFields}
        defaultValues={defaultValues}
        onSubmit={() = as any> {}}
        submitText="Save Changes"
      />
    );
    
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  test('handles form in loading state', () => {
    renderWithProviders(
      <FormBuilder title="Loading Form"
        fields={mockFields}
        defaultValues={defaultValues}
        onSubmit={() = as any> {}}
        loading={true}
      />
    );
    
    // Check that submit button is disabled and shows loading state
    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveAttribute('aria-busy', 'true');
  });

  test('handles custom field layouts', () => {
    renderWithProviders(
      <FormBuilder title="Custom Layout Form"
        fields={mockFields}
        defaultValues={defaultValues}
        onSubmit={() = as any> {}}
        layout={{
          name: { xs: 12, md: 6 },
          email: { xs: 12, md: 6 },
          age: { xs: 12, md: 4 },
          category: { xs: 12, md: 4 },
          description: { xs: 12 }
        }}
      />
    );
    
    // Check that form renders without errors
    expect(screen.getByText('Custom Layout Form')).toBeInTheDocument();
  });

  test('applies custom styles', () => {
    const { container } = renderWithProviders(
      <FormBuilder title="Styled Form"
        fields={mockFields}
        defaultValues={defaultValues}
        onSubmit={() = as any> {}}
        sx={{ padding: '24px' }}
      />
    );
    
    expect(container.firstChild).toHaveStyle('padding: 24px');
  });
}); 