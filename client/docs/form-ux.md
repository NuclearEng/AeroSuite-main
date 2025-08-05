# Enhanced Form UX

This document provides an overview of AeroSuite's enhanced form UX features, which improve the user experience with forms through inline validation, auto-save functionality, and smart defaults/suggestions.

## Features

### Inline Validation

The form system provides real-time validation feedback as users enter information:

- **Immediate Feedback**: Validates input as users type or when they leave a field
- **Clear Error Messages**: Shows specific error messages that explain how to fix problems
- **Validation Severity Levels**: Uses different severity levels (error, warning, info) for different types of validation issues
- **Related Field Validation**: Validates related fields together (e.g., password confirmation)

```tsx
// Example field with validation
{
  name: 'email',
  label: 'Email Address',
  type: 'email',
  required: true,
  validation: [
    {
      type: 'required',
      message: 'Email is required',
    },
    {
      type: 'email',
      message: 'Please enter a valid email address',
    }
  ],
  placeholder: 'email@example.com',
}
```

### Auto-Save Functionality

Forms automatically save user progress to prevent data loss:

- **Automatic Saving**: Saves form progress after a period of inactivity (default: 2 seconds)
- **Visual Confirmation**: Provides visual feedback when auto-save occurs
- **Manual Save Option**: Allows users to manually save their progress
- **Form History**: Maintains a history of form versions for recovery

```tsx
// Example auto-save implementation
useEffect(() => {
  if (!autoSaveEnabled || Object.keys(formValues).length === 0) return;
  
  // Clear previous timer
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }
  
  // Set new timer to save after 2 seconds of inactivity
  const timer = setTimeout(() => {
    handleAutoSave();
  }, 2000);
  
  setAutoSaveTimer(timer);
  
  return () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
  };
}, [formValues, autoSaveEnabled]);
```

### Smart Defaults & Suggestions

The form system provides intelligent suggestions and defaults:

- **Intelligent Suggestions**: Offers contextual suggestions based on user input
- **Pre-filling Fields**: Pre-fills fields based on related information (e.g., email suggestions based on name)
- **Automatic Formatting**: Formats input automatically (e.g., adding https:// to URLs)
- **Previous Entry Memory**: Remembers previous entries for returning users

```tsx
// Example smart suggestions implementation
const handleShowSuggestions = (fieldName: string) => {
  // ...
  
  switch (fieldName) {
    case 'email':
      // Generate email suggestions based on contact name if available
      if (formValues.contactName) {
        const name = formValues.contactName.toLowerCase().replace(/\s+/g, '.');
        fieldSuggestions = commonDomains.map(domain => `${name}@${domain}`);
      }
      break;
    // ...
  }
  
  setSuggestions({ ...suggestions, [fieldName]: fieldSuggestions });
  setShowSuggestionFor(fieldName);
};
```

## Usage

### FormBuilder Component

The enhanced form UX features are integrated into the `FormBuilder` component:

```tsx
import FormBuilder from '../components/common/FormBuilder';
import { FormSection } from '../components/common/FormBuilder';

// Define form sections with validation rules
const formSections: FormSection[] = [
  {
    title: 'Section Title',
    description: 'Section description',
    fields: [
      // Field definitions with validation rules
    ]
  }
];

// Use the FormBuilder component
<FormBuilder
  sections={formSections}
  onSubmit={handleSubmit}
  initialValues={formValues}
  validateOnChange={true}
  validateOnBlur={true}
  showProgressIndicator={true}
  instantValidation={true}
/>
```

### Auto-Save Implementation

To implement auto-save functionality:

```tsx
// State for auto-save
const [formValues, setFormValues] = useState<Record<string, any>>({});
const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
const [formHistory, setFormHistory] = useState<Array<{timestamp: Date, values: Record<string, any>}>>([]);

// Auto-save effect
useEffect(() => {
  if (!autoSaveEnabled || Object.keys(formValues).length === 0) return;
  
  // Clear previous timer
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }
  
  // Set new timer to save after 2 seconds of inactivity
  const timer = setTimeout(() => {
    // Save form values
    const now = new Date();
    setFormHistory(prev => [
      { timestamp: now, values: { ...formValues } },
      ...prev.slice(0, 9) // Keep only last 10 entries
    ]);
  }, 2000);
  
  setAutoSaveTimer(timer);
  
  return () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
  };
}, [formValues, autoSaveEnabled]);
```

### Smart Suggestions Implementation

To implement smart suggestions:

```tsx
// State for suggestions
const [suggestions, setSuggestions] = useState<Record<string, any[]>>({});
const [showSuggestionFor, setShowSuggestionFor] = useState<string | null>(null);

// Add suggestion button to field
{
  name: 'email',
  label: 'Email Address',
  type: 'email',
  endAdornment: (
    <InputAdornment position="end">
      <IconButton 
        size="small" 
        onClick={() => handleShowSuggestions('email')}
        edge="end"
      >
        <LightbulbIcon fontSize="small" color="action" />
      </IconButton>
    </InputAdornment>
  ),
}

// Render suggestions
const renderSuggestions = (fieldName: string) => {
  if (fieldName !== showSuggestionFor || !suggestions[fieldName]) return null;
  
  return (
    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {suggestions[fieldName].map((suggestion, index) => (
        <Chip
          key={index}
          label={suggestion}
          size="small"
          color="primary"
          variant="outlined"
          onClick={() => handleApplySuggestion(fieldName, suggestion)}
        />
      ))}
    </Box>
  );
};
```

## Best Practices

### Inline Validation

- Validate input as users type or when they leave a field
- Show clear error messages that explain how to fix the problem
- Use different severity levels (error, warning, info)
- Validate related fields together (e.g., password confirmation)
- Don't block form submission for warnings, only for errors
- Provide visual cues for validation status (icons, colors)

### Auto-Save

- Save form progress automatically after a period of inactivity
- Provide visual confirmation when auto-save occurs
- Allow users to manually save their progress
- Maintain form history for recovery
- Make it clear when the form was last saved
- Allow users to disable auto-save if preferred

### Smart Defaults & Suggestions

- Offer intelligent suggestions based on user input
- Pre-fill fields based on related information
- Format input automatically (e.g., phone numbers, URLs)
- Remember previous entries for returning users
- Make suggestions non-intrusive and easy to dismiss
- Ensure suggestions are relevant and helpful

### Accessibility Considerations

- Ensure all validation messages are accessible to screen readers
- Maintain keyboard navigation throughout the form
- Use proper ARIA attributes for custom form controls
- Provide sufficient color contrast for all form elements
- Make sure error states are perceivable through multiple senses (not just color)

## Demo

Visit the [Form UX Demo](/demos/form-ux) page to see all form UX features in action. 