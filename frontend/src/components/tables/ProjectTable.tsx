// src/components/tables/ProjectTable.tsx
import React, { useRef, useState, useEffect } from 'react';
import { Project } from '../../data/types';

interface ProjectTableProps {
  projects: Project[];
}

const getStatusBadge = (status: Project['status']) => {
  switch (status) {
    case 'On track':
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
          On track
        </span>
      );
    case 'At risk':
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
          At risk
        </span>
      );
    case 'Delayed':
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
          Delayed
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

const ProjectTable: React.FC<ProjectTableProps> = ({ projects }) => {
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
  }, [projects]);

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
      {/* Arrow indicator - only visible on narrow screens */}
      {isNarrowScreen && showScrollIndicator && !isScrolledRight && (
        <div 
          style={{ 
            position: 'absolute',
            right: 8,
            bottom: 8,
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
                width: isNarrowScreen ? '100px' : '250px',
                maxWidth: isNarrowScreen ? '100px' : '250px',
                boxShadow: '2px 0 5px rgba(0,0,0,0.05)'
              }}>
                Project
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
                Progress
              </th>
              <th style={{ 
                padding: '0.75rem 1.5rem', 
                textAlign: 'left', 
                fontSize: '0.75rem', 
                fontWeight: '500',
                color: '#6b7280', 
                textTransform: 'uppercase'
              }}>
                End Date
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr 
                key={project.id} 
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
                  width: isNarrowScreen ? '100px' : '250px',
                  maxWidth: isNarrowScreen ? '100px' : '250px',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  whiteSpace: 'normal',
                  lineHeight: isNarrowScreen ? '1.25' : '1.5',
                  boxShadow: '2px 0 5px rgba(0,0,0,0.05)'
                }}>
                  {project.name}
                </td>
                <td style={{ 
                  padding: '1rem 1.5rem'
                }}>
                  {getStatusBadge(project.status)}
                </td>
                <td style={{ 
                  padding: '1rem 1.5rem'
                }}>
                  <div style={{ 
                    width: '100%',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '9999px',
                    height: '8px',
                    overflow: 'hidden'
                  }}>
                    <div 
                      style={{ 
                        backgroundColor: '#3b82f6',
                        height: '100%',
                        borderRadius: '9999px',
                        width: `${project.progress}%` 
                      }} 
                    />
                  </div>
                </td>
                <td style={{ 
                  padding: '1rem 1.5rem',
                  color: '#6b7280'
                }}>
                  {project.endDate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectTable;