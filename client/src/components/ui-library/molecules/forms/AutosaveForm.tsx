import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Alert, 
  Snackbar,
  CircularProgress,
  Chip
} from '@mui/material';
import { Save as SaveIcon, Restore as RestoreIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useFormAutosave } from '../../../../hooks/useFormAutosave';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

interface AutosaveFormProps {
  /**
   * Unique identifier for the form
   */
  formId: string;
  
  /**
   * Initial form data
   */
  initialData: Record<string, any>;
  
  /**
   * Fields configuration
   */
  fields: {
    name: string;
    label: string;
    type?: string;
    required?: boolean;
    multiline?: boolean;
    rows?: number;
  }[];
  
  /**
   * Function to handle form submission
   */
  onSubmit: (data: Record<string, any>) => Promise<void>;
  
  /**
   * Debounce delay in milliseconds
   * @default 1000
   */
  debounceDelay?: number;
}

/**
 * A form component with auto-save functionality
 */
export const AutosaveForm: React.FC<AutosaveFormProps> = ({
  formId,
  initialData,
  fields,
  onSubmit,
  debounceDelay = 1000
}) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const {
    formData,
    updateFormData,
    handleSubmit,
    clearSavedData,
    isSaving,
    lastSaved,
    hasSavedData
  } = useFormAutosave({
    storageKey: formId,
    initialData,
    debounceDelay,
    onSave: () => {}
  });
  
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData(name, value);
  };
  
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await handleSubmit(onSubmit);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (_error) {
      console.error("Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Box component="form" onSubmit={handleFormSubmit} noValidate sx={{ mt: 1 }}>
      {hasSavedData && (
        <Alert 
          severity="info" 
          sx={{ mb: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              startIcon={<DeleteIcon />}
              onClick={clearSavedData}
            >
              {t('forms.autosave.discard')}
            </Button>
          }
        >
          {t('forms.autosave.restored')}
        </Alert>
      )}
      
      {fields.map((field) => (
        <TextField
          key={field.name}
          margin="normal"
          required={field.required}
          fullWidth
          id={field.name}
          label={field.label}
          name={field.name}
          type={field.type || 'text'}
          multiline={field.multiline}
          rows={field.rows}
          value={formData[field.name] || ''}
          onChange={handleFieldChange}
        />
      ))}
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isSaving ? (
            <CircularProgress size={16} sx={{ mr: 1 }} />
          ) : lastSaved && (
            <Chip
              size="small"
              icon={<SaveIcon fontSize="small" />}
              label={`${t('forms.autosave.saved')} ${format(lastSaved, 'HH:mm:ss')}`}
              variant="outlined"
              color="success"
            />
          )}
        </Box>
        
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {t('forms.submit')}
        </Button>
      </Box>
      
      <Snackbar
        open={submitSuccess}
        autoHideDuration={3000}
        onClose={() => setSubmitSuccess(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          {t('forms.submitSuccess')}
        </Alert>
      </Snackbar>
    </Box>
  );
}; 