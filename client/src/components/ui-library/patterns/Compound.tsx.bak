/**
 * Compound Component Pattern
 * 
 * @task RF015 - Implement component composition patterns
 * 
 * The Compound Component pattern allows components to share state and behavior
 * while maintaining separation of concerns. It creates a parent component that
 * manages state and provides context to child components.
 * 
 * Example: A Select component with Option sub-components
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Context for the Select component
interface SelectContextType {
  selectedValue: string;
  onChange: (value: string) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

// Hook to use the Select context
const useSelectContext = () => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select compound components must be used within a Select component');
  }
  return context;
};

// Types for the Select component
interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

interface SelectComposition {
  Option: React.FC<OptionProps>;
  Label: React.FC<LabelProps>;
  OptionGroup: React.FC<OptionGroupProps>;
}

// Types for sub-components
interface OptionProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

interface LabelProps {
  children: ReactNode;
  className?: string;
}

interface OptionGroupProps {
  label: string;
  children: ReactNode;
  className?: string;
}

// Select component with compound components
const Select: React.FC<SelectProps> & SelectComposition = ({ 
  value, 
  onChange, 
  children, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleDropdown = () => setIsOpen(!isOpen);
  
  return (
    <SelectContext.Provider value={{ selectedValue: value, onChange }}>
      <div className={`select-container ${className}`}>
        <div className="select-header" onClick={toggleDropdown}>
          <span>{value || 'Select an option'}</span>
          <span className="select-arrow">{isOpen ? '▲' : '▼'}</span>
        </div>
        {isOpen && (
          <div className="select-dropdown">
            {children}
          </div>
        )}
      </div>
    </SelectContext.Provider>
  );
};

// Option sub-component
const Option: React.FC<OptionProps> = ({ value, children, disabled = false, className = '' }) => {
  const { selectedValue, onChange } = useSelectContext();
  
  const handleClick = () => {
    if (!disabled) {
      onChange(value);
    }
  };
  
  return (
    <div 
      className={`select-option ${selectedValue === value ? 'selected' : ''} ${disabled ? 'disabled' : ''} ${className}`}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

// Label sub-component
const Label: React.FC<LabelProps> = ({ children, className = '' }) => {
  return (
    <div className={`select-label ${className}`}>
      {children}
    </div>
  );
};

// OptionGroup sub-component
const OptionGroup: React.FC<OptionGroupProps> = ({ label, children, className = '' }) => {
  return (
    <div className={`select-group ${className}`}>
      <div className="select-group-label">{label}</div>
      {children}
    </div>
  );
};

// Attach sub-components to the Select component
Select.Option = Option;
Select.Label = Label;
Select.OptionGroup = OptionGroup;

export { Select, SelectContext, useSelectContext };
export type { SelectProps, OptionProps, LabelProps, OptionGroupProps }; 