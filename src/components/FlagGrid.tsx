import React from 'react';
import { CountryFlag } from '../data/countries';
import { FlagStyle } from './Toolbar';
import { FlagCard } from './FlagCard';
import { Globe, SearchX } from 'lucide-react';

interface FlagGridProps {
  countries: CountryFlag[];
  flagStyle: FlagStyle;
  selectedCodes: Set<string>;
  onToggleSelect: (code: string) => void;
  onOpenModal: (country: CountryFlag) => void;
  onClearSearch: () => void;
  onNotify?: (message: string, isError?: boolean) => void;
}

export const FlagGrid: React.FC<FlagGridProps> = ({
  countries,
  flagStyle,
  selectedCodes,
  onToggleSelect,
  onOpenModal,
  onClearSearch,
  onNotify,
}) => {
  if (countries.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4 shadow-inner">
          <SearchX className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">No flags found</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          We couldn&apos;t find any country matching your search or filter criteria. Try checking your spelling or clearing filters.
        </p>
        <button
          type="button"
          onClick={onClearSearch}
          className="mt-6 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
        >
          Clear Search &amp; Filters
        </button>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-emerald-600" />
          <h2 className="font-bold text-slate-900 text-base sm:text-lg">
            Flag Library Gallery{' '}
            <span className="text-sm font-normal text-slate-500">
              ({countries.length} {countries.length === 1 ? 'flag' : 'flags'})
            </span>
          </h2>
        </div>
      </div>

      <div
        data-testid="flag-grid"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
      >
        {countries.map((country) => (
          <FlagCard
            key={country.code}
            country={country}
            flagStyle={flagStyle}
            isSelected={selectedCodes.has(country.code)}
            onToggleSelect={onToggleSelect}
            onOpenModal={onOpenModal}
            onNotify={onNotify}
          />
        ))}
      </div>
    </section>
  );
};
