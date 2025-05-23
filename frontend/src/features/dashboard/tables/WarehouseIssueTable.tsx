// src/components/tables/WarehouseIssueTable.tsx
import React, { useRef, useState, useEffect } from 'react';

interface WarehouseIssue {
  id: string;
  issue: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'In Progress' | 'Scheduled' | 'On Track' | 'Not Started';
  assignedTo: string;
  dueDate: string;
}

interface WarehouseIssueTableProps {
  issues: WarehouseIssue[];
}

const getPriorityBadge = (priority: WarehouseIssue['priority']) => {
  switch (priority) {
    case 'High':
      return (
        <span style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          lineHeight: '1',
          borderRadius: '9999px',
          backgroundColor: '#fee2e2',
          color: '#b91c1c',
          textAlign: 'center'
        }}>
          High
        </span>
      );
    case 'Medium':
      return (
        <span style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          lineHeight: '1',
          borderRadius: '9999px',
          backgroundColor: '#fef9c3',
          color: '#854d0e',
          textAlign: 'center'
        }}>
          Medium
        </span>
      );
    case 'Low':
      return (
        <span style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          lineHeight: '1',
          borderRadius: '9999px',
          backgroundColor: '#dbeafe',
          color: '#1e40af',
          textAlign: 'center'
        }}>
          Low
        </span>
      );
    default:
      return (
        <span style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          lineHeight: '1',
          borderRadius: '9999px',
          backgroundColor: '#f3f4f6',
          color: '#4b5563',
          textAlign: 'center'
        }}>
          {priority}
        </span>
      );
  }
};

const getStatusBadge = (status: WarehouseIssue['status']) => {
  switch (status) {
    case 'In Progress':
      return (
        <span style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          lineHeight: '1',
          borderRadius: '9999px',
          backgroundColor: '#fef9c3',
          color: '#854d0e',
          textAlign: 'center'
        }}>
          In Progress
        </span>
      );
    case 'Scheduled':
      return (
        <span style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          lineHeight: '1',
          borderRadius: '9999px',
          backgroundColor: '#dcfce7',
          color: '#166534',
          textAlign: 'center'
        }}>
          Scheduled
        </span>
      );
    case 'On Track':
      return (
        <span style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          lineHeight: '1',
          borderRadius: '9999px',
          backgroundColor: '#dcfce7',
          color: '#166534',
          textAlign: 'center'
        }}>
          On Track
        </span>
      );
    case 'Not Started':
      return (
        <span style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          lineHeight: '1',
          borderRadius: '9999px',
          backgroundColor: '#f3f4f6',
          color: '#4b5563',
          textAlign: 'center'
        }}>
          Not Started
        </span>
      );
    default:
      return (
        <span style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          lineHeight: '1',
          borderRadius: '9999px',
          backgroundColor: '#f3f4f6',
          color: '#4b5563',
          textAlign: 'center'
        }}>
          {status}
        </span>
      );
  }
};

const WarehouseIssueTable: React.FC<WarehouseIssueTableProps> = ({ issues }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [isScrolledRight, setIsScrolledRight] = useState(false);
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const checkScroll = () => {
      setShowScrollIndicator(container.scrollWidth > container.clientWidth);
      const isAtRight = 
        Math.ceil(container.scrollLeft + container.clientWidth) >= container.scrollWidth;
      setIsScrolledRight(isAtRight);
      
      // Check if the screen is narrow (mobile)
      setIsNarrowScreen(window.innerWidth <= 768);
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);
    container.addEventListener('scroll', checkScroll);

    return () => {
      window.removeEventListener('resize', checkScroll);
      container?.removeEventListener('scroll', checkScroll);
    };
  }, [issues]);

  // Create a style element for custom scrollbar
  useEffect(() => {
    // Add custom CSS to hide scrollbar
    const style = document.createElement('style');
    style.textContent = `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      {/* Arrow indicator - moved outside scrollable area but still only visible on narrow screens */}
      {isNarrowScreen && showScrollIndicator && !isScrolledRight && (
        <div 
          style={{ 
            position: 'absolute',
            right: 8,
            bottom: 8, // Positioned at bottom corner
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.2)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            pointerEvents: 'none'
          }}
        >
          →
        </div>
      )}
      
      <div 
        ref={scrollContainerRef}
        className="hide-scrollbar"
        style={{
          width: '100%',
          overflowX: 'auto',
          position: 'relative',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ 
                padding: '0.75rem 1rem', 
                textAlign: 'left', 
                fontSize: '0.75rem', 
                fontWeight: '500',
                color: '#6b7280', 
                textTransform: 'uppercase',
                position: 'sticky',
                left: 0,
                backgroundColor: 'white',
                zIndex: 1,
                // Responsive width based on screen size
                width: isNarrowScreen ? '100px' : '250px',
                maxWidth: isNarrowScreen ? '100px' : '250px',
                boxShadow: '2px 0 5px rgba(0,0,0,0.05)'
              }}>
                Issue
              </th>
              <th style={{ 
                padding: '0.75rem 1.5rem', 
                textAlign: 'left', 
                fontSize: '0.75rem', 
                fontWeight: '500',
                color: '#6b7280', 
                textTransform: 'uppercase'
              }}>
                Priority
              </th>
              <th style={{ 
                padding: '0.75rem 1.5rem', 
                textAlign: 'left', 
                fontSize: '0.75rem', 
                fontWeight: '500',
                color: '#6b7280', 
                textTransform: 'uppercase'
              }}>
                Status
              </th>
              <th style={{ 
                padding: '0.75rem 1.5rem', 
                textAlign: 'left', 
                fontSize: '0.75rem', 
                fontWeight: '500',
                color: '#6b7280', 
                textTransform: 'uppercase'
              }}>
                Assigned To
              </th>
              <th style={{ 
                padding: '0.75rem 1.5rem', 
                textAlign: 'left', 
                fontSize: '0.75rem', 
                fontWeight: '500',
                color: '#6b7280', 
                textTransform: 'uppercase'
              }}>
                Due Date
              </th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr 
                key={issue.id} 
                style={{ 
                  borderBottom: '1px solid #e5e7eb',
                  height: 'auto'
                }}
              >
                <td style={{ 
                  padding: '1rem 1rem',
                  fontWeight: '500',
                  color: '#111827',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: 'white',
                  zIndex: 1,
                  // Responsive width based on screen size
                  width: isNarrowScreen ? '100px' : '250px',
                  maxWidth: isNarrowScreen ? '100px' : '250px',
                  // Always keep word wrap for text overflow handling
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  whiteSpace: 'normal',
                  // Different line height based on screen size
                  lineHeight: isNarrowScreen ? '1.25' : '1.5',
                  boxShadow: '2px 0 5px rgba(0,0,0,0.05)'
                }}>
                  {issue.issue}
                </td>
                <td style={{ 
                  padding: '1rem 1.5rem'
                }}>
                  {getPriorityBadge(issue.priority)}
                </td>
                <td style={{ 
                  padding: '1rem 1.5rem'
                }}>
                  {getStatusBadge(issue.status)}
                </td>
                <td style={{ 
                  padding: '1rem 1.5rem',
                  color: '#6b7280'
                }}>
                  {issue.assignedTo}
                </td>
                <td style={{ 
                  padding: '1rem 1.5rem',
                  color: '#6b7280'
                }}>
                  {issue.dueDate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WarehouseIssueTable;
