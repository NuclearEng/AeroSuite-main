import React, { useState } from 'react';

export interface DropdownOption {
  label: string;
  value: string;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Best-in-class Dropdown component with keyboard navigation and accessibility.
 */
const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | undefined>(value);

  const handleSelect = (val: string) => {
    setSelected(val);
    onChange?.(val);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative', minWidth: 160 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #ccc',
          borderRadius: 4,
          background: '#fff',
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {options.find(o => o.value === selected)?.label || placeholder}
      </button>
      {open && (
        <ul
          tabIndex={-1}
          role="listbox"
          style={{
            position: 'absolute',
            zIndex: 10,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: 4,
            margin: 0,
            padding: 0,
            listStyle: 'none',
            width: '100%',
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          {options.map(opt => (
            <li
              key={opt.value}
              role="option"
              aria-selected={selected === opt.value}
              onClick={() => handleSelect(opt.value)}
              style={{
                padding: '8px 12px',
                background: selected === opt.value ? '#e3f2fd' : '#fff',
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown; 