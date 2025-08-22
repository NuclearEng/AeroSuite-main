import React from 'react';

export type FilterType = 'text' | 'select' | 'date';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterField {
  key: string;
  label: string;
  type: FilterType;
  options?: FilterOption[]; // For select
  placeholder?: string;
}

export interface FilterPanelProps {
  filters: FilterField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onApply: () => void;
  onReset: () => void;
  disabled?: boolean;
}

/**
 * Best-in-class FilterPanel component for dynamic filtering.
 * Supports text, select, and date fields, with apply and reset.
 */
const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  values,
  onChange,
  onApply,
  onReset,
  disabled = false,
}) => {
  return (
    <form
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        border: '1px solid #ccc',
        borderRadius: 8,
        padding: 16,
        background: '#fafafa',
        minWidth: 260,
      }}
      onSubmit={e => {
        e.preventDefault();
        onApply();
      }}
      aria-label="Filter panel"
    >
      {filters.map(filter => (
        <div key={filter.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label htmlFor={filter.key} style={{ fontWeight: 500 }}>{filter.label}</label>
          {filter.type === 'text' && (
            <input
              id={filter.key}
              type="text"
              value={values[filter.key] || ''}
              onChange={e => onChange(filter.key, e.target.value)}
              placeholder={filter.placeholder}
              disabled={disabled}
              style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc' }}
            />
          )}
          {filter.type === 'select' && filter.options && (
            <select
              id={filter.key}
              value={values[filter.key] || ''}
              onChange={e => onChange(filter.key, e.target.value)}
              disabled={disabled}
              style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc' }}
            >
              <option value="">Select...</option>
              {filter.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
          {filter.type === 'date' && (
            <input
              id={filter.key}
              type="date"
              value={values[filter.key] || ''}
              onChange={e => onChange(filter.key, e.target.value)}
              disabled={disabled}
              style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc' }}
            />
          )}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          type="submit"
          disabled={disabled}
          style={{
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '8px 16px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          Apply
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          style={{
            background: '#eee',
            color: '#333',
            border: 'none',
            borderRadius: 4,
            padding: '8px 16px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          Reset
        </button>
      </div>
    </form>
  );
};

export default FilterPanel; 