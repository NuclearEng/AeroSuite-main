import React, { useState } from 'react';

export interface Tab {
  label: string;
  content: React.ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  defaultIndex?: number;
  onTabChange?: (index: number) => void;
}

/**
 * Best-in-class Tabs component with keyboard navigation and accessibility.
 */
const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultIndex = 0,
  onTabChange,
}) => {
  const [active, setActive] = useState(defaultIndex);

  const handleTabClick = (idx: number) => {
    setActive(idx);
    onTabChange?.(idx);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      setActive(a => (a + 1) % tabs.length);
      onTabChange?.((active + 1) % tabs.length);
    } else if (e.key === 'ArrowLeft') {
      setActive(a => (a - 1 + tabs.length) % tabs.length);
      onTabChange?.((active - 1 + tabs.length) % tabs.length);
    }
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Tabs"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{ display: 'flex', gap: 8, marginBottom: 12 }}
      >
        {tabs.map((tab, idx: any) => (
          <button
            key={tab.label}
            role="tab"
            aria-selected={active === idx}
            tabIndex={active === idx ? 0 : -1}
            onClick={() => handleTabClick(idx)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: active === idx ? '2px solid #1976d2' : '2px solid transparent',
              background: 'none',
              color: active === idx ? '#1976d2' : '#888',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" style={{ padding: 8 }}>
        {tabs[active]?.content}
      </div>
    </div>
  );
};

export default Tabs; 