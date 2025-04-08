// src/components/tables/ProjectTable.tsx
import React from 'react';
import { Project } from '../../data/types';

interface ProjectTableProps {
  projects: Project[];
}

const getStatusBadge = (status: Project['status']) => {
  // Define badge styles directly
  const badgeStyles = {
    onTrack: {
      span: "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
      color: "bg-green-100 text-green-800"
    },
    atRisk: {
      span: "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
      color: "bg-yellow-100 text-yellow-800"
    },
    delayed: {
      span: "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
      color: "bg-red-100 text-red-800"
    },
    default: {
      span: "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
      color: "bg-gray-100 text-gray-800"
    }
  };

  switch (status) {
    case 'On track':
      return (
        <span 
          className={`${badgeStyles.onTrack.span} ${badgeStyles.onTrack.color}`}
          style={{
            backgroundColor: '#dcfce7', // Explicit green background
            color: '#166534',           // Explicit green text
            padding: '2px 8px',         // Explicit padding
            borderRadius: '9999px'      // Explicit rounded corners
          }}
        >
          On track
        </span>
      );
    case 'At risk':
      return (
        <span 
          className={`${badgeStyles.atRisk.span} ${badgeStyles.atRisk.color}`}
          style={{
            backgroundColor: '#fef9c3', // Explicit yellow background
            color: '#854d0e',           // Explicit yellow text
            padding: '2px 8px',         // Explicit padding
            borderRadius: '9999px'      // Explicit rounded corners
          }}
        >
          At risk
        </span>
      );
    case 'Delayed':
      return (
        <span 
          className={`${badgeStyles.delayed.span} ${badgeStyles.delayed.color}`}
          style={{
            backgroundColor: '#fee2e2', // Explicit red background
            color: '#b91c1c',           // Explicit red text
            padding: '2px 8px',         // Explicit padding
            borderRadius: '9999px'      // Explicit rounded corners
          }}
        >
          Delayed
        </span>
      );
    default:
      return (
        <span 
          className={`${badgeStyles.default.span} ${badgeStyles.default.color}`}
          style={{
            backgroundColor: '#f3f4f6', // Explicit gray background
            color: '#4b5563',           // Explicit gray text
            padding: '2px 8px',         // Explicit padding
            borderRadius: '9999px'      // Explicit rounded corners
          }}
        >
          {status}
        </span>
      );
  }
};

const ProjectTable: React.FC<ProjectTableProps> = ({ projects }) => {
  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full divide-y divide-gray-200" style={{ width: '100%' }}>
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {projects.map((project) => (
            <tr key={project.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {getStatusBadge(project.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.endDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectTable;