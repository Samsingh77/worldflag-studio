import { MAX_ZIP_SELECTION } from '../utils/flagLogic';
import React from 'react';
import {
  Search,
  ArrowUpDown,
  Square,
  Circle,
  Shield,
  LayoutGrid,
  Download,
  FileSpreadsheet,
  X,
} from 'lucide-react';

export type FlagStyle = 'rectangle' | 'circle' | 'rounded' | 'square' | 'shield';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortChange: (order: 'asc' | 'desc') => void;
  flagStyle: FlagStyle;
  onStyleChange: (style: FlagStyle) => void;
  selectedCount: number;
  onClearSelection?: () => void;
  onDownloadSelectedZip: () => void;
  onExportCsv: () => void;
  isZipping: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  searchQuery,
  onSearchChange,
  sortOrder,
  onSortChange,
  flagStyle,
  onStyleChange,
  selectedCount,
  onClearSelection,
  onDownloadSelectedZip,
  onExportCsv,
  isZipping,
}) => {
  return (
    <div className="bg-slate-50 border-b border-slate-200 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="flex items-center w-full lg:w-72 xl:w-80 relative shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            aria-label="Search country name or ISO code"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search country or ISO (India, USA, UK, JP)..."
            className="w-full pl-10 pr-9 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Style Selector */}
        <div
          className="flex items-center flex-wrap gap-1.5"
          role="group"
          aria-label="Flag style"
        >
          <span className="text-xs font-semibold text-slate-500 mr-1 hidden xl:inline">Style:</span>
          {(
            [
              { id: 'rectangle', label: 'Rectangle', icon: LayoutGrid },
              { id: 'circle', label: 'Circle', icon: Circle },
              { id: 'rounded', label: 'Rounded', icon: Square },
              { id: 'square', label: 'Square', icon: Square },
              { id: 'shield', label: 'Shield', icon: Shield },
            ] as const
          ).map((s) => {
            const Icon = s.icon;
            const active = flagStyle === s.id;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={active}
                onClick={() => onStyleChange(s.id)}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sort & Bulk Actions */}
        <div className="flex items-center flex-wrap gap-2 justify-start lg:justify-end shrink-0">
          <button
            type="button"
            onClick={() => onSortChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            aria-label={`Sort ${sortOrder === 'asc' ? 'Z to A' : 'A to Z'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>{sortOrder === 'asc' ? 'A–Z' : 'Z–A'}</span>
          </button>

          {selectedCount > 0 && onClearSelection && (
            <button
              type="button"
              onClick={onClearSelection}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              Clear ({selectedCount})
            </button>
          )}

          <button
            type="button"
            onClick={onDownloadSelectedZip}
            disabled={selectedCount === 0 || isZipping}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-xs ${
              selectedCount > 0 && !isZipping
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isZipping ? 'Zipping…' : `Selected ZIP (${selectedCount}/${MAX_ZIP_SELECTION})`}</span>
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            title="Download country name and ISO code CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
