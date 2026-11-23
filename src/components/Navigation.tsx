import React from 'react';
import { Globe, Compass, Landmark, Trees, Mountain, Sun, Waves, Building2 } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  counts: Record<string, number>;
}

export const CONTINENTS = [
  { id: 'All', label: 'All Flags', icon: Globe },
  { id: 'Asia', label: 'Asia', icon: Compass },
  { id: 'Europe', label: 'Europe', icon: Landmark },
  { id: 'Africa', label: 'Africa', icon: Sun },
  { id: 'North America', label: 'North America', icon: Mountain },
  { id: 'South America', label: 'South America', icon: Trees },
  { id: 'Oceania', label: 'Oceania', icon: Waves },
  { id: 'International', label: 'Intl & Others', icon: Building2 },
];

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  counts,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 shadow-xs overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 py-3">
        {CONTINENTS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = counts[tab.id] || 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              <span
                className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full ${
                  isActive
                    ? 'bg-emerald-700 text-emerald-100'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
