import React from 'react';

export interface Breadcrumb {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbsProps {
  items: Breadcrumb[];
  separator?: React.ReactNode;
}

/**
 * Best-in-class Breadcrumbs component with accessibility and keyboard navigation.
 */
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  separator = '/',
}) => {
  return (
    <nav aria-label="breadcrumb">
      <ol style={{ display: 'flex', alignItems: 'center', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, idx: any) => (
          <li key={item.label} style={{ display: 'flex', alignItems: 'center' }}>
            {item.href ? (
              <a
                href={item.href}
                onClick={item.onClick}
                style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}
              >
                {item.label}
              </a>
            ) : (
              <span style={{ color: '#888' }}>{item.label}</span>
            )}
            {idx < items.length - 1 && <span style={{ margin: '0 4px' }}>{separator}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs; 