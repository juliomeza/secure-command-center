// src/components/tables/ProjectTable.tsx
import React from 'react';
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
  return (
    <div style={{
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '0.875rem'
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            <th style={{ 
              padding: '0.75rem 1.5rem', 
              textAlign: 'left', 
              fontSize: '0.75rem', 
              fontWeight: '500',
              color: '#6b7280', 
              textTransform: 'uppercase'
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
                height: '60px'
              }}
            >
              <td style={{ 
                padding: '1rem 1.5rem',
                fontWeight: '500',
                color: '#111827'
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
  );
};

export default ProjectTable;