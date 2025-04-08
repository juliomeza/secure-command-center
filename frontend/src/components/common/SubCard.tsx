// src/components/common/SubCard.tsx
import React from 'react';

interface SubCardProps {
  title: string;
  value: React.ReactNode;
  trend?: React.ReactNode;
  isSmallScreen?: boolean;
  padding?: string;
  width?: string;
}

/**
 * SubCard component for displaying small metric cards inside a parent Card
 * Used primarily for grouping related metrics in a compact, inline layout
 */
const SubCard: React.FC<SubCardProps> = ({ 
  title, 
  value, 
  trend, 
  isSmallScreen = false, 
  padding = '0.0rem 1rem',
  width = '33.33%'
}) => {
  return (
    <div style={{ 
      flex: isSmallScreen ? 'none' : '1', 
      width: isSmallScreen ? '100%' : width,
      padding: padding,
      backgroundColor: '#eff6ff',
      borderRadius: '0.5rem',
      textAlign: isSmallScreen ? 'center' : 'left'
    }}>
      <h4 style={{ 
        fontSize: '0.875rem', 
        fontWeight: '500', 
        color: '#4b5563',
        marginBottom: '0.0rem'
      }}>
        {title}
      </h4>
      <p style={{ 
        fontSize: '1.25rem', 
        fontWeight: '700', 
        color: '#111827', 
        marginTop: '0',
        marginBottom: trend ? '0.25rem' : '0.95rem'
      }}>
        {value}
      </p>
      {trend && (
        <div style={{
          marginBottom: '0.95rem',
          textAlign: isSmallScreen ? 'center' : 'left'
        }}>
          {trend}
        </div>
      )}
    </div>
  );
};

export default SubCard;
