// src/components/common/TabsNavigation.tsx
import React from 'react';

interface TabProps<T extends string> {
  tabs: Array<{ id: T; label: string }>;
  activeTab: T;
  onTabChange: (tabId: T) => void;
  className?: string;
}

export function TabsNavigation<T extends string>({ 
  tabs, 
  activeTab, 
  onTabChange,
  className = ''
}: TabProps<T>) {
  return (
    <div style={{ 
      width: '100%', 
      marginBottom: '2rem',
      backgroundColor: 'transparent'
    }} className={className}>
      <div style={{ 
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: 'transparent',
        display: 'flex',
        justifyContent: 'flex-start',
        paddingLeft: '1rem'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            style={{
              position: 'relative',
              padding: '1rem 0',
              margin: '0 2rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
              color: activeTab === tab.id ? '#2563eb' : '#6b7280',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TabsNavigation;