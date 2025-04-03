// src/components/common/TabsNavigation.tsx
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
  return (
    <div className={`w-full mb-8 ${className}`}>
      <div className="border-b border-gray-200">
        <nav className="flex justify-center -mb-px space-x-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`
                relative py-4 px-1 font-medium text-sm sm:text-base transition-all duration-200 ease-in-out
                ${activeTab === tab.id 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default TabsNavigation;