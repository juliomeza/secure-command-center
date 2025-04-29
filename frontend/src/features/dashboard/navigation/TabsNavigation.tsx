// Updated TabsNavigation.tsx with centered tab content
import React, { useRef, useEffect } from 'react';

interface TabProps<T extends string> {
  tabs: Array<{ 
    id: T; 
    label: string;
    icon?: React.ReactNode;
  }>;
  activeTab: T;
  onTabChange: (tabId: T) => void;
  className?: string;
  showIcons?: boolean;
}

export function TabsNavigation<T extends string>({ 
  tabs, 
  activeTab, 
  onTabChange,
  className = '',
  showIcons = true
}: TabProps<T>) {
  // Reference to the tabs container for scrolling
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  
  // Scroll active tab into view when it changes
  useEffect(() => {
    if (tabsContainerRef.current) {
      const activeTabElement = tabsContainerRef.current.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement;
      if (activeTabElement) {
        const container = tabsContainerRef.current;
        const containerWidth = container.offsetWidth;
        const activeTabLeft = activeTabElement.offsetLeft;
        const activeTabWidth = activeTabElement.offsetWidth;
        
        // Center the active tab in the container
        container.scrollLeft = activeTabLeft - (containerWidth / 2) + (activeTabWidth / 2);
      }
    }
  }, [activeTab]);

  return (
    <div style={{ 
      width: '100%', 
      marginBottom: '2rem',
      backgroundColor: 'transparent'
    }} className={className}>
      <div 
        ref={tabsContainerRef}
        style={{ 
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: 'transparent',
          display: 'flex',
          justifyContent: 'flex-start',
          overflowX: 'auto',
          scrollbarWidth: 'none', // Hide scrollbar for Firefox
          msOverflowStyle: 'none', // Hide scrollbar for IE/Edge
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
          padding: '0 0.5rem'
        }}
      >
        <style>
          {`
            /* Hide scrollbar for Chrome/Safari */
            div[data-tabs-container]::-webkit-scrollbar {
              display: none;
            }
            
            /* For touch devices */
            @media (hover: none) {
              div[data-tabs-container] {
                -webkit-overflow-scrolling: touch;
              }
            }
            
            /* Responsive tab sizing */
            @media (max-width: 640px) {
              .tab-button {
                margin: 0 0.5rem !important;
                font-size: 0.75rem !important;
              }
              .tab-icon {
                transform: scale(0.9);
              }
            }
            
            /* Even smaller for very small screens */
            @media (max-width: 360px) {
              .tab-button {
                margin: 0 0.25rem !important;
                font-size: 0.7rem !important;
              }
              .tab-icon {
                transform: scale(0.8);
              }
            }
          `}
        </style>
        
        <div 
          data-tabs-container 
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            minWidth: 'min-content' // Ensures tabs don't shrink below their content
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              className="tab-button"
              type="button"
              onClick={() => onTabChange(tab.id)}
              style={{
                position: 'relative',
                padding: '0.75rem 0',
                margin: '0 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                color: activeTab === tab.id ? '#2563eb' : '#6b7280',
                transition: 'all 0.2s ease-in-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center', // Center content horizontally
                gap: '0.25rem',
                whiteSpace: 'nowrap',
                flex: '1 0 auto',
                textAlign: 'center' // Center text within button
              }}
            >
              {/* Icon with responsive sizing */}
              {showIcons && tab.icon && (
                <span 
                  className="tab-icon"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    opacity: activeTab === tab.id ? 1 : 0.7
                  }}
                >
                  {tab.icon}
                </span>
              )}
              
              <span>{tab.label}</span>
              
              {/* Active tab indicator */}
              {activeTab === tab.id && (
                <span 
                  style={{
                    position: 'absolute',
                    bottom: '-1px',
                    left: 0,
                    width: '100%',
                    height: '2px',
                    backgroundColor: '#2563eb'
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TabsNavigation;