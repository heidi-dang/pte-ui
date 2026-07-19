import { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab: controlledActive, onChange, className = '' }: TabsProps) {
  const [internalActive, setInternalActive] = useState(tabs[0]?.id ?? '');
  const activeTab = controlledActive ?? internalActive;

  const handleClick = (tabId: string) => {
    setInternalActive(tabId);
    onChange?.(tabId);
  };

  return (
    <div className={`flex border-b border-dark-border gap-0 ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => handleClick(tab.id)}
          className={`relative px-4 py-2.5 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-surface ${
            activeTab === tab.id
              ? 'text-primary-400'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          {tab.label}
          {tab.badge !== undefined && (
            <span className={`ml-2 inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full text-[10px] font-bold ${
              activeTab === tab.id ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-elevated text-gray-400'
            }`}>
              {tab.badge}
            </span>
          )}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
