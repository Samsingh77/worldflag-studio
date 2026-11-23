import { MAX_ZIP_SELECTION } from '../utils/flagLogic';
import React from 'react';
import { Globe, Info, Flag, Map, Presentation } from 'lucide-react';

export type StudioSection = 'flags' | 'maps' | 'powerpoint';

interface HeaderProps {
  activeStudio: StudioSection;
  onSelectStudio: (studio: StudioSection) => void;
  onOpenAbout: () => void;
  selectedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeStudio,
  onSelectStudio,
  onOpenAbout,
  selectedCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Brand Identity */}
        <button
          type="button"
          onClick={() => onSelectStudio('flags')}
          className="flex items-center space-x-2 sm:space-x-3 text-left min-w-0 shrink focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm sm:text-lg text-slate-900 tracking-tight truncate sm:whitespace-nowrap leading-tight">
              WorldAtlas <span className="text-emerald-600">Studio</span>
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium whitespace-nowrap hidden sm:block">
              Flags. Maps. Geography. Made for Designers.
            </p>
          </div>
        </button>

        {/* Zone 2: Main Studio Switcher (Two Primary Sections + PowerPoint Hub) */}
        <nav
          aria-label="Primary studio sections"
          className="flex items-center gap-0.5 sm:gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0"
        >
          <button
            type="button"
            aria-current={activeStudio === 'flags' ? 'page' : undefined}
            onClick={() => onSelectStudio('flags')}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeStudio === 'flags'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flag
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                activeStudio === 'flags' ? 'text-emerald-600' : 'text-slate-500'
              }`}
            />
            <span>Flag Studio</span>
          </button>

          <button
            type="button"
            aria-current={activeStudio === 'maps' ? 'page' : undefined}
            onClick={() => onSelectStudio('maps')}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeStudio === 'maps'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Map
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                activeStudio === 'maps' ? 'text-emerald-600' : 'text-slate-500'
              }`}
            />
            <span>Map Studio</span>
          </button>

          <button
            type="button"
            aria-current={activeStudio === 'powerpoint' ? 'page' : undefined}
            onClick={() => onSelectStudio('powerpoint')}
            className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeStudio === 'powerpoint'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Presentation
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                activeStudio === 'powerpoint' ? 'text-emerald-600' : 'text-slate-500'
              }`}
            />
            <span>PowerPoint Hub</span>
          </button>
        </nav>

        {/* Zone 3: Selection Metric & About */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {selectedCount > 0 && (
            <span className="hidden lg:inline-block text-xs font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
              {selectedCount}/{MAX_ZIP_SELECTION} selected
            </span>
          )}
          <button
            type="button"
            onClick={onOpenAbout}
            className="flex items-center space-x-1.5 p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
            aria-label="About WorldAtlas Studio"
          >
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">About</span>
          </button>
        </div>
      </div>
    </header>
  );
};
