import React from 'react';

interface SuperGroupHeaderProps {
  title: string;
}

const SuperGroupHeader: React.FC<SuperGroupHeaderProps> = ({ title }) => {
  return (
    <div className="mb-6 mt-8">
      <h2 
        className="text-lg font-semibold text-blue-900"
        style={{
          position: 'relative',
          paddingLeft: '1rem',
          borderLeft: '4px solid var(--blue-dark, #1e3a8a)'
        }}
      >
        {title}
      </h2>
    </div>
  );
};

export default SuperGroupHeader;