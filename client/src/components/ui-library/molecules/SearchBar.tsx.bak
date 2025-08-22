import React, { useState, useRef } from 'react';

export interface SearchBarProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  disabled?: boolean;
}

/**
 * Best-in-class SearchBar component with clear button, keyboard navigation, and accessibility.
 */
const SearchBar: React.FC<SearchBarProps> = ({
  value = '',
  placeholder = 'Search...',
  onChange,
  onSearch,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange?.(e.target.value);
  };

  const handleClear = () => {
    setInputValue('');
    onChange?.('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch?.(inputValue);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        placeholder={placeholder}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label={placeholder}
        style={{
          flex: 1,
          padding: '8px 12px',
          border: '1px solid #ccc',
          borderRadius: 4,
          fontSize: 16,
        }}
      />
      {inputValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 18,
            color: '#888',
          }}
          disabled={disabled}
        >
          ×
        </button>
      )}
      <button
        type="button"
        onClick={() => onSearch?.(inputValue)}
        aria-label="Search"
        style={{
          background: '#1976d2',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          padding: '8px 16px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          fontSize: 14,
        }}
        disabled={disabled}
      >
        Search
      </button>
    </div>
  );
};

export default SearchBar; 