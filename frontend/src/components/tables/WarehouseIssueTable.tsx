// src/components/tables/WarehouseIssueTable.tsx
import React from 'react';

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
                height: '60px'
              }}
            >
              <td style={{ 
                padding: '1rem 1.5rem',
                fontWeight: '500',
                color: '#111827'
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
  );
};

export default WarehouseIssueTable;
