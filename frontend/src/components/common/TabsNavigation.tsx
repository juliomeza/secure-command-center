// src/components/common/TabsNavigation.tsx
import React, { useState } from 'react';

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
  const [hoveredTab, setHoveredTab] = useState<T | null>(null);

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
            onMouseOver={() => setHoveredTab(tab.id)}
            onMouseOut={() => setHoveredTab(null)}
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
              color: activeTab === tab.id || hoveredTab === tab.id ? '#2563eb' : '#6b7280',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {tab.label}
            <span 
              style={{
                position: 'absolute',
                bottom: '-1px',
                left: '-50%',
                width: '200%',
                height: '2px',
                backgroundColor: '#2563eb',
                transform: activeTab === tab.id 
                  ? 'scaleX(1)' 
                  : hoveredTab === tab.id 
                    ? 'scaleX(1)' 
                    : 'scaleX(0)',
                transformOrigin: 'center',
                transition: 'transform 0.2s ease-in-out'
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default TabsNavigation;