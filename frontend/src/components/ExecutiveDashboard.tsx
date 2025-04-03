// frontend/src/components/ExecutiveDashboard.tsx
import React, { useState, ChangeEvent } from 'react';
import DashboardLayout from './layout/DashboardLayout';
import CompanySelector from './common/CompanySelector';
import PeriodSelector from './common/PeriodSelector';
import CEOView from '../views/CEOView';
import CFOView from '../views/CFOView';
import COOView from '../views/COOView';
import CIOView from '../views/CIOView';
import { companies, periods } from '../data/mockData'; // Import data for selectors
import { useAuth } from './AuthProvider';

// Define Tab type
type TabId = 'CEO' | 'CFO' | 'COO' | 'CIO';

const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'CEO', label: 'CEO' },
    { id: 'CFO', label: 'CFO' },
    { id: 'COO', label: 'COO' },
    { id: 'CIO', label: 'CIO' },
];

const ExecutiveDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('CEO');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  
  const handleCompanyChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setSelectedCompany(e.target.value);
  };
  
  const handlePeriodChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setSelectedPeriod(e.target.value);
  };

  const renderContent = () => {
    // NOTE: Currently, selectedCompany and selectedPeriod are not used
    // to filter data, as the views use static mockData directly.
    // In a real app, you would pass these down or use them in data fetching.
    switch (activeTab) {
      case 'CEO':
        return <CEOView />;
      case 'CFO':
        return <CFOView />;
      case 'COO':
        return <COOView />;
      case 'CIO':
        return <CIOView />;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <DashboardLayout>
      {/* User Welcome Banner */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h2 className="text-xl font-semibold">Welcome, {user?.first_name || user?.username}!</h2>
        <p className="text-sm text-gray-600">
          {user?.profile?.job_title && `${user.profile.job_title} at `}
          {user?.profile?.company?.name || 'Your Company'}
        </p>
      </div>

      {/* Navigation and Selectors Container */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px px-4 sm:px-6 lg:px-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mx-2 sm:mx-4
                  ${activeTab === tab.id
                    ? 'border-blue-900 text-blue-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Selectors */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 lg:px-8 py-3 border-b border-gray-200 bg-gray-50 space-y-3 sm:space-y-0">
          <CompanySelector
            companies={companies}
            selectedValue={selectedCompany}
            onChange={handleCompanyChange}
          />
          <PeriodSelector
            periods={periods}
            selectedValue={selectedPeriod}
            onChange={handlePeriodChange}
          />
        </div>
      </div>

      {/* Main Dashboard Content Area */}
      {renderContent()}

    </DashboardLayout>
  );
};

export default ExecutiveDashboard;