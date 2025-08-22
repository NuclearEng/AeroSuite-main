/**
 * Composition Pattern
 * 
 * @task RF015 - Implement component composition patterns
 * 
 * The Composition pattern involves building components that accept and render children
 * or specific props that contain React elements. This pattern enables flexible and
 * reusable component structures.
 * 
 * Examples: Layout and Card components with slot-based composition
 */

import React, { ReactNode } from 'react';

// Types for the Layout component
interface LayoutProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Layout Component
 * 
 * A composition-based layout component with header, sidebar, content, and footer slots
 */
export const Layout: React.FC<LayoutProps> = ({
  header,
  sidebar,
  footer,
  children,
  className = ''
}) => {
  return (
    <div className={`layout ${className}`}>
      {header && <header className="layout-header">{header}</header>}
      <div className="layout-body">
        {sidebar && <aside className="layout-sidebar">{sidebar}</aside>}
        <main className="layout-content">{children}</main>
      </div>
      {footer && <footer className="layout-footer">{footer}</footer>}
    </div>
  );
};

// Types for the Card component
interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  media?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Card Component
 * 
 * A composition-based card component with title, subtitle, media, content, and actions slots
 */
export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  media,
  actions,
  children,
  className = ''
}) => {
  return (
    <div className={`card ${className}`}>
      {media && <div className="card-media">{media}</div>}
      {(title || subtitle) && (
        <div className="card-header">
          {title && <div className="card-title">{title}</div>}
          {subtitle && <div className="card-subtitle">{subtitle}</div>}
        </div>
      )}
      <div className="card-content">{children}</div>
      {actions && <div className="card-actions">{actions}</div>}
    </div>
  );
};

// Types for the Split component
interface SplitProps {
  left: ReactNode;
  right: ReactNode;
  ratio?: string;
  className?: string;
}

/**
 * Split Component
 * 
 * A composition-based component that splits content into two columns
 */
export const Split: React.FC<SplitProps> = ({
  left,
  right,
  ratio = '1fr 1fr',
  className = ''
}) => {
  return (
    <div 
      className={`split ${className}`}
      style={{ display: 'grid', gridTemplateColumns: ratio }}
    >
      <div className="split-left">{left}</div>
      <div className="split-right">{right}</div>
    </div>
  );
};

// Types for the Tabs component with named slots
interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  initialTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

/**
 * Tabs Component
 * 
 * A composition-based tabs component that manages tab state
 */
export const Tabs: React.FC<TabsProps> = ({
  items,
  initialTab,
  onChange,
  className = ''
}) => {
  const [activeTab, setActiveTab] = React.useState<string>(
    initialTab || (items.length > 0 ? items[0].id : '')
  );

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (onChange) {
      onChange(tabId);
    }
  };

  return (
    <div className={`tabs ${className}`}>
      <div className="tabs-header">
        {items.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
            disabled={tab.disabled}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {items.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};

export type { LayoutProps, CardProps, SplitProps, TabItem, TabsProps }; 