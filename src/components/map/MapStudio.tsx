import React, { useMemo, useState } from 'react';
import JSZip from 'jszip';
import {
  MAP_CONTINENTS,
  filterMapCountries,
  getMapCountries,
  type MapContinent,
  type MapCountry,
} from '../../data/worldMaps';
import {
  DEFAULT_MAP_STYLE,
  downloadMapPng,
  generateContinentMapSvg,
  generateCountryMapSvg,
  generateCustomHighlightMapSvg,
  generateWorldMapSvg,
  type MapPngResolution,
  type MapStyleConfig,
} from '../../utils/mapRenderer';
import { downloadFile, downloadSvg } from '../../utils/flagUtils';
import { sanitizeFilename, MAX_ZIP_SELECTION } from '../../utils/flagLogic';
import { MapCard } from './MapCard';
import { MapCustomizerPanel } from './MapCustomizerPanel';
import { MapPreviewModal } from './MapPreviewModal';
import {
  ArrowUpDown,
  Check,
  Compass,
  Copy,
  Download,
  Globe,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Loader2,
  Map as MapIcon,
  PenTool,
  Search,
  Sparkles,
  X,
} from 'lucide-react';

export type MapStudioTab = 'all' | 'countries' | 'world' | 'continents' | 'outlines' | 'custom';

interface MapStudioProps {
  activeTab: MapStudioTab;
  onTabChange: (tab: MapStudioTab) => void;
  selectedCodes: Set<string>;
  onToggleSelect: (code: string) => void;
  onClearSelection: () => void;
  onNotify: (message: string, isError?: boolean) => void;
}

const MAP_TABS: { id: MapStudioTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'All Maps', icon: LayoutGrid },
  { id: 'countries', label: 'Individual Countries', icon: MapIcon },
  { id: 'world', label: 'World Map', icon: Globe },
  { id: 'continents', label: 'Continents', icon: Layers },
  { id: 'outlines', label: 'Country Outlines', icon: PenTool },
  { id: 'custom', label: 'Custom Maps', icon: Sparkles },
];

const CUSTOM_PRESETS: { id: string; label: string; codes: string[] }[] = [
  { id: 'business', label: 'Global Markets (IN, US, GB, DE)', codes: ['in', 'us', 'gb', 'de'] },
  { id: 'g7', label: 'G7 Nations', codes: ['ca', 'fr', 'de', 'it', 'jp', 'gb', 'us'] },
  { id: 'brics', label: 'BRICS+', codes: ['br', 'ru', 'in', 'cn', 'za'] },
  { id: 'apac', label: 'Key APAC', codes: ['in', 'jp', 'kr', 'au', 'sg', 'id'] },
];

function buildMapsCsv(countries: MapCountry[]): string {
  const header = 'ISO_Code,Country_Name,Continent,Capital';
  const rows = countries.map(
    (c) =>
      `"${c.code.toUpperCase()}","${c.name.replace(/"/g, '""')}","${c.continent}","${(c.capital || '').replace(/"/g, '""')}"`
  );
  return [header, ...rows].join('\n');
}

export const MapStudio: React.FC<MapStudioProps> = ({
  activeTab,
  onTabChange,
  selectedCodes,
  onToggleSelect,
  onClearSelection,
  onNotify,
}) => {
  const allCountries = useMemo(() => {
    try {
      return getMapCountries();
    } catch {
      return [];
    }
  }, []);

  // Gallery filters (Individual Countries & All Maps & Outlines)
  const [searchQuery, setSearchQuery] = useState('');
  const [continentFilter, setContinentFilter] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Active continent for Continent Map Studio
  const [activeContinent, setActiveContinent] = useState<MapContinent>('Asia');

  // Shared & mode-specific styling configs
  const [galleryConfig, setGalleryConfig] = useState<MapStyleConfig>({
    ...DEFAULT_MAP_STYLE,
    aspectRatio: '4:3',
  });
  const [outlineConfig, setOutlineConfig] = useState<MapStyleConfig>({
    ...DEFAULT_MAP_STYLE,
    renderMode: 'outline',
    borderColor: '#0f172a',
    borderWidth: 1.6,
    fillColor: '#0f172a',
    transparentBackground: true,
    aspectRatio: '4:3',
  });
  const [worldConfig, setWorldConfig] = useState<MapStyleConfig>({
    ...DEFAULT_MAP_STYLE,
    fillColor: '#059669',
    borderColor: '#ffffff',
    borderWidth: 0.7,
    aspectRatio: '16:9',
  });
  const [continentConfig, setContinentConfig] = useState<MapStyleConfig>({
    ...DEFAULT_MAP_STYLE,
    fillColor: '#059669',
    borderColor: '#ffffff',
    borderWidth: 0.9,
    aspectRatio: '16:9',
  });
  const [customConfig, setCustomConfig] = useState<MapStyleConfig>({
    ...DEFAULT_MAP_STYLE,
    highlightColor: '#059669',
    baseColor: '#e2e8f0',
    borderColor: '#ffffff',
    borderWidth: 0.7,
    showLabels: true,
    labelMode: 'name',
    aspectRatio: '16:9',
  });

  // Custom map highlighted countries (default India, USA, UK, Germany)
  const [highlightedCodes, setHighlightedCodes] = useState<Set<string>>(
    () => new Set(['in', 'us', 'gb', 'de'])
  );
  const [customCountrySearch, setCustomCountrySearch] = useState('');

  // Export state
  const [pngResolution, setPngResolution] = useState<MapPngResolution>(2048);
  const [isZipping, setIsZipping] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [modalCountry, setModalCountry] = useState<MapCountry | null>(null);

  const filteredCountries = useMemo(
    () =>
      filterMapCountries(allCountries, {
        continent: continentFilter,
        searchQuery,
        sortOrder,
      }),
    [allCountries, continentFilter, searchQuery, sortOrder]
  );

  const continentCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allCountries.length };
    for (const c of allCountries) {
      counts[c.continent] = (counts[c.continent] || 0) + 1;
    }
    return counts;
  }, [allCountries]);

  // Live SVGs for World, Continent, and Custom Highlight workspaces
  const worldSvg = useMemo(() => {
    if (activeTab !== 'world') return '';
    return generateWorldMapSvg(allCountries, worldConfig, { width: 1200 });
  }, [activeTab, allCountries, worldConfig]);

  const continentSvg = useMemo(() => {
    if (activeTab !== 'continents') return '';
    return generateContinentMapSvg(activeContinent, allCountries, continentConfig, { width: 1200 });
  }, [activeTab, activeContinent, allCountries, continentConfig]);

  const customSvg = useMemo(() => {
    if (activeTab !== 'custom') return '';
    return generateCustomHighlightMapSvg(allCountries, highlightedCodes, customConfig, {
      width: 1200,
    });
  }, [activeTab, allCountries, highlightedCodes, customConfig]);

  const customChecklistCountries = useMemo(() => {
    const q = customCountrySearch.trim().toLowerCase();
    const list = q
      ? allCountries.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.code.toLowerCase().includes(q) ||
            (c.aliases && c.aliases.some((a) => a.includes(q)))
        )
      : allCountries;
    return list;
  }, [allCountries, customCountrySearch]);

  const highlightedCountryObjects = useMemo(
    () => allCountries.filter((c) => highlightedCodes.has(c.code)),
    [allCountries, highlightedCodes]
  );

  const toggleHighlight = (code: string) => {
    setHighlightedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const handleCopySvg = async (svg: string, id: string) => {
    try {
      await navigator.clipboard.writeText(svg);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      onNotify('Clipboard access denied. Use Download SVG instead.', true);
    }
  };

  const handleExportPng = async (
    svg: string,
    filename: string,
    aspectRatio: MapStyleConfig['aspectRatio']
  ) => {
    setIsExportingPng(true);
    try {
      await downloadMapPng(svg, filename, pngResolution, aspectRatio);
      onNotify(`Exported ${filename} (${pngResolution}px wide).`);
    } catch {
      onNotify(`Failed to export PNG ${filename}. Please try again.`, true);
    } finally {
      setIsExportingPng(false);
    }
  };

  const exportCountriesZip = async (
    list: MapCountry[],
    config: MapStyleConfig,
    zipFilename: string
  ) => {
    if (list.length === 0) {
      onNotify('Select at least one country map to export.', true);
      return;
    }
    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (const country of list) {
        const svg = generateCountryMapSvg(country, config, { width: 900 });
        const folder = zip.folder(country.continent || 'Other');
        if (folder) {
          folder.file(sanitizeFilename(`${country.name}-Map`, country.code, 'svg'), svg);
        }
      }
      zip.file('worldatlas_studio_maps_index.csv', buildMapsCsv(list));
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadFile(blob, zipFilename);
      onNotify(
        `Downloaded ${list.length} country vector ${list.length === 1 ? 'map' : 'maps'} as ${zipFilename}.`
      );
    } catch {
      onNotify('Failed to generate map ZIP archive. Please try again.', true);
    } finally {
      setIsZipping(false);
    }
  };

  const activeGalleryConfig = activeTab === 'outlines' ? outlineConfig : galleryConfig;

  const handleDownloadSelectedMapsZip = () => {
    const selectedList = allCountries.filter((c) => selectedCodes.has(c.code)).slice(0, MAX_ZIP_SELECTION);
    const suffix = activeTab === 'outlines' ? 'outlines' : 'maps';
    void exportCountriesZip(
      selectedList,
      activeGalleryConfig,
      `worldatlas-studio-selected-${suffix}.zip`
    );
  };

  if (allCountries.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <Globe className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Map dataset unavailable</h2>
          <p className="text-sm text-slate-500">
            WorldAtlas Studio could not load the Natural Earth TopoJSON boundaries. Please reload
            the application.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Map Studio Sub-Navigation (6 Categories) */}
      <nav
        aria-label="Map Studio categories"
        className="bg-white border-b border-slate-200 sticky top-16 z-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 overflow-x-auto py-2.5">
            {MAP_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.id === 'countries' && (
                    <span
                      className={`text-[11px] font-semibold tabular-nums ${
                        isActive ? 'text-emerald-100' : 'text-slate-400'
                      }`}
                    >
                      {allCountries.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ==================== TAB 1 & 2: ALL MAPS / INDIVIDUAL COUNTRIES ==================== */}
      {(activeTab === 'all' || activeTab === 'countries') && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-6">
          {/* Overview Strip on "All Maps" */}
          {activeTab === 'all' && (
            <section aria-label="Map collections overview" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => onTabChange('world')}
                className="group bg-white rounded-2xl p-4 border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all text-left flex items-start space-x-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900">World Map</h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    Full global boundaries in 16:9, 4:3, or 1:1 with labels &amp; transparency
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('continents')}
                className="group bg-white rounded-2xl p-4 border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all text-left flex items-start space-x-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900">6 Continent Maps</h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    Asia, Europe, Africa, Americas &amp; Oceania editable vector &amp; PNG exports
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('outlines')}
                className="group bg-white rounded-2xl p-4 border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all text-left flex items-start space-x-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <PenTool className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900">Country Outlines</h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    No-fill editable vector strokes &amp; solid silhouettes on transparent PNGs
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('custom')}
                className="group bg-white rounded-2xl p-4 border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all text-left flex items-start space-x-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900">Custom Highlight Maps</h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    Highlight India, USA, UK, Germany or any regions against a grey world map
                  </p>
                </div>
              </button>
            </section>
          )}

          {/* Filter, Style & Bulk Export Toolbar */}
          <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search & Continent Selector */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search country or ISO (India, USA, UK, Germany...)"
                    aria-label="Search country maps"
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear map search"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <select
                  aria-label="Filter country maps by continent"
                  value={continentFilter}
                  onChange={(e) => setContinentFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="All">All Continents ({continentCounts.All || 0})</option>
                  {MAP_CONTINENTS.map((cont) => (
                    <option key={cont} value={cont}>
                      {cont} ({continentCounts[cont] || 0})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors whitespace-nowrap"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  <span>{sortOrder === 'asc' ? 'A–Z' : 'Z–A'}</span>
                </button>
              </div>

              {/* Bulk ZIP Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedCodes.size > 0 && (
                  <button
                    type="button"
                    onClick={onClearSelection}
                    className="px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Clear ({selectedCodes.size})
                  </button>
                )}

                <button
                  type="button"
                  disabled={selectedCodes.size === 0 || isZipping}
                  onClick={handleDownloadSelectedMapsZip}
                  className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedCodes.size > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isZipping ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Selected ZIP ({selectedCodes.size}/{MAX_ZIP_SELECTION})</span>
                </button>
              </div>
            </div>

            {/* Quick Style Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  {(
                    [
                      { id: 'filled', label: 'Filled' },
                      { id: 'outline', label: 'Outline' },
                      { id: 'silhouette', label: 'Solid' },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() =>
                        setGalleryConfig((prev) => ({
                          ...prev,
                          renderMode: mode.id,
                          borderColor:
                            mode.id === 'outline' && prev.borderColor === '#ffffff'
                              ? '#0f172a'
                              : prev.borderColor,
                        }))
                      }
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                        galleryConfig.renderMode === mode.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                <label className="inline-flex items-center space-x-2 text-xs font-medium text-slate-600 cursor-pointer">
                  <span>Fill</span>
                  <input
                    type="color"
                    aria-label="Gallery map fill colour"
                    value={galleryConfig.fillColor}
                    onChange={(e) =>
                      setGalleryConfig((prev) => ({ ...prev, fillColor: e.target.value }))
                    }
                    className="w-5 h-5 rounded cursor-pointer border border-slate-200 p-0 bg-transparent"
                  />
                </label>

                <label className="inline-flex items-center space-x-2 text-xs font-medium text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={galleryConfig.transparentBackground}
                    onChange={(e) =>
                      setGalleryConfig((prev) => ({
                        ...prev,
                        transparentBackground: e.target.checked,
                      }))
                    }
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Transparent BG</span>
                </label>
              </div>

              <p className="text-xs text-slate-500 tabular-nums">
                Showing <strong className="text-slate-800">{filteredCountries.length}</strong> of{' '}
                {allCountries.length} vector country maps · Click any map to toggle State / Province
                boundaries
              </p>
            </div>

            {/* Quick Open Popular State / Province Maps */}
            <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">
                State / Province Maps:
              </span>
              {(
                [
                  { code: 'in', label: 'India' },
                  { code: 'us', label: 'USA' },
                  { code: 'ca', label: 'Canada' },
                  { code: 'au', label: 'Australia' },
                  { code: 'de', label: 'Germany' },
                  { code: 'br', label: 'Brazil' },
                ] as const
              ).map((item) => {
                const match = allCountries.find((c) => c.code === item.code);
                if (!match) return null;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setModalCountry(match)}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 text-xs font-medium transition-colors"
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Country Maps Grid */}
          {filteredCountries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 py-14 px-6 text-center">
              <Compass className="w-9 h-9 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No matching country maps</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Try searching by country name, ISO code (IN, US, GB, DE), or clear your continent
                filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setContinentFilter('All');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredCountries.map((country) => (
                <MapCard
                  key={country.code}
                  country={country}
                  config={galleryConfig}
                  pngResolution={pngResolution}
                  isSelected={selectedCodes.has(country.code)}
                  onToggleSelect={onToggleSelect}
                  onOpenModal={setModalCountry}
                  onNotify={onNotify}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 3: WORLD MAP ==================== */}
      {activeTab === 'world' && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Live Vector World Map Canvas */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    World Map · Natural Earth 1:50m
                  </h2>
                  <p className="text-xs text-slate-500">
                    International boundaries · {worldConfig.aspectRatio} ·{' '}
                    {worldConfig.transparentBackground ? 'Transparent' : worldConfig.backgroundColor}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      downloadSvg(
                        worldSvg,
                        `worldatlas-world-map-${worldConfig.aspectRatio.replace(':', 'x')}.svg`
                      )
                    }
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download SVG</span>
                  </button>

                  <button
                    type="button"
                    disabled={isExportingPng}
                    onClick={() =>
                      handleExportPng(
                        worldSvg,
                        `worldatlas-world-map-${pngResolution}px.png`,
                        worldConfig.aspectRatio
                      )
                    }
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                  >
                    {isExportingPng ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5" />
                    )}
                    <span>PNG ({pngResolution}px)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopySvg(worldSvg, 'world')}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors"
                  >
                    {copiedId === 'world' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId === 'world' ? 'Copied' : 'Copy SVG'}</span>
                  </button>
                </div>
              </div>

              <div
                className={`p-4 sm:p-6 flex items-center justify-center min-h-[360px] ${
                  worldConfig.transparentBackground ? 'map-checkerboard' : 'bg-slate-50/70'
                }`}
              >
                <div
                  data-testid="world-map-canvas"
                  className="w-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[540px] [&>svg]:rounded-xl [&>svg]:border [&>svg]:border-slate-200/70"
                  dangerouslySetInnerHTML={{ __html: worldSvg }}
                />
              </div>
            </div>

            {/* Right: Customiser */}
            <div className="lg:col-span-4">
              <MapCustomizerPanel
                config={worldConfig}
                onChange={setWorldConfig}
                onReset={() =>
                  setWorldConfig({
                    ...DEFAULT_MAP_STYLE,
                    fillColor: '#059669',
                    borderColor: '#ffffff',
                    borderWidth: 0.7,
                    aspectRatio: '16:9',
                  })
                }
                pngResolution={pngResolution}
                onResolutionChange={setPngResolution}
                mode="world"
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: CONTINENTS ==================== */}
      {activeTab === 'continents' && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-5">
          {/* Continent Selector Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {MAP_CONTINENTS.map((continent) => {
                const active = activeContinent === continent;
                return (
                  <button
                    key={continent}
                    type="button"
                    onClick={() => setActiveContinent(continent)}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      active
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {continent}{' '}
                    <span
                      className={`text-[11px] font-medium tabular-nums ml-1 ${
                        active ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      {continentCounts[continent] || 0}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{activeContinent} Map</h2>
                  <p className="text-xs text-slate-500">
                    {continentCounts[activeContinent] || 0} countries &amp; territories · Editable
                    vector SVG
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      downloadSvg(
                        continentSvg,
                        `worldatlas-${activeContinent.toLowerCase().replace(/\s+/g, '-')}-map.svg`
                      )
                    }
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download SVG</span>
                  </button>

                  <button
                    type="button"
                    disabled={isExportingPng}
                    onClick={() =>
                      handleExportPng(
                        continentSvg,
                        `worldatlas-${activeContinent.toLowerCase().replace(/\s+/g, '-')}-${pngResolution}px.png`,
                        continentConfig.aspectRatio
                      )
                    }
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>PNG ({pngResolution}px)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopySvg(continentSvg, 'continent')}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors"
                  >
                    {copiedId === 'continent' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId === 'continent' ? 'Copied' : 'Copy SVG'}</span>
                  </button>
                </div>
              </div>

              <div
                className={`p-4 sm:p-6 flex items-center justify-center min-h-[360px] ${
                  continentConfig.transparentBackground ? 'map-checkerboard' : 'bg-slate-50/70'
                }`}
              >
                <div
                  data-testid="continent-map-canvas"
                  className="w-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[540px] [&>svg]:rounded-xl [&>svg]:border [&>svg]:border-slate-200/70"
                  dangerouslySetInnerHTML={{ __html: continentSvg }}
                />
              </div>
            </div>

            <div className="lg:col-span-4">
              <MapCustomizerPanel
                config={continentConfig}
                onChange={setContinentConfig}
                onReset={() =>
                  setContinentConfig({
                    ...DEFAULT_MAP_STYLE,
                    fillColor: '#059669',
                    borderColor: '#ffffff',
                    borderWidth: 0.9,
                    aspectRatio: '16:9',
                  })
                }
                pngResolution={pngResolution}
                onResolutionChange={setPngResolution}
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: COUNTRY OUTLINES ==================== */}
      {activeTab === 'outlines' && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Country Outlines &amp; Silhouettes
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Clean no-fill vector borders or solid filled silhouettes on transparent
                  backgrounds—ideal for minimalist slides and KPI callouts.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedCodes.size > 0 && (
                  <button
                    type="button"
                    onClick={onClearSelection}
                    className="px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Clear ({selectedCodes.size})
                  </button>
                )}

                <button
                  type="button"
                  disabled={selectedCodes.size === 0 || isZipping}
                  onClick={handleDownloadSelectedMapsZip}
                  className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    selectedCodes.size > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Selected Outlines ZIP ({selectedCodes.size}/{MAX_ZIP_SELECTION})</span>
                </button>
              </div>
            </div>

            {/* Outline Customisation Controls */}
            <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() =>
                    setOutlineConfig((prev) => ({
                      ...prev,
                      renderMode: 'outline',
                    }))
                  }
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    outlineConfig.renderMode === 'outline'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  No-Fill Outline
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setOutlineConfig((prev) => ({
                      ...prev,
                      renderMode: 'silhouette',
                    }))
                  }
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    outlineConfig.renderMode === 'silhouette'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Solid Silhouette
                </button>
              </div>

              <label className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-700">
                <span>
                  {outlineConfig.renderMode === 'outline' ? 'Border Colour' : 'Silhouette Colour'}
                </span>
                <input
                  type="color"
                  aria-label="Outline stroke or silhouette colour"
                  value={
                    outlineConfig.renderMode === 'outline'
                      ? outlineConfig.borderColor
                      : outlineConfig.fillColor
                  }
                  onChange={(e) =>
                    setOutlineConfig((prev) =>
                      prev.renderMode === 'outline'
                        ? { ...prev, borderColor: e.target.value }
                        : { ...prev, fillColor: e.target.value }
                    )
                  }
                  className="w-6 h-6 rounded cursor-pointer border border-slate-200 p-0 bg-transparent"
                />
              </label>

              {outlineConfig.renderMode === 'outline' && (
                <label className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-700">
                  <span>Stroke</span>
                  <input
                    type="range"
                    aria-label="Outline stroke width"
                    min={0.8}
                    max={4}
                    step={0.2}
                    value={outlineConfig.borderWidth}
                    onChange={(e) =>
                      setOutlineConfig((prev) => ({
                        ...prev,
                        borderWidth: parseFloat(e.target.value),
                      }))
                    }
                    className="w-24 accent-emerald-600 cursor-pointer"
                  />
                  <span className="font-mono text-slate-500 tabular-nums">
                    {outlineConfig.borderWidth.toFixed(1)}px
                  </span>
                </label>
              )}

              <label className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={outlineConfig.transparentBackground}
                  onChange={(e) =>
                    setOutlineConfig((prev) => ({
                      ...prev,
                      transparentBackground: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Transparent Background</span>
              </label>

              {/* Inline Search */}
              <div className="relative ml-auto min-w-[220px] flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter outlines (India, USA...)"
                  aria-label="Search country outlines"
                  className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear outline search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredCountries.map((country) => (
              <MapCard
                key={country.code}
                country={country}
                config={outlineConfig}
                pngResolution={pngResolution}
                isSelected={selectedCodes.has(country.code)}
                onToggleSelect={onToggleSelect}
                onOpenModal={setModalCountry}
                onNotify={onNotify}
              />
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB 6: CUSTOM HIGHLIGHT MAPS ==================== */}
      {activeTab === 'custom' && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-5">
          {/* Quick Presets & Selected Countries Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Custom Multi-Country Highlight Map
                </h2>
                <p className="text-xs text-slate-500">
                  Click any country directly on the map or pick from the directory below to
                  highlight key markets in your accent colour.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {CUSTOM_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setHighlightedCodes(new Set(preset.codes))}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 text-xs font-medium transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
                {highlightedCodes.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setHighlightedCodes(new Set())}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Active Highlighted Countries Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500 mr-1">
                Highlighted ({highlightedCountryObjects.length}):
              </span>
              {highlightedCountryObjects.length === 0 ? (
                <span className="text-xs text-slate-400">
                  No countries highlighted yet — click countries on the map or select below.
                </span>
              ) : (
                highlightedCountryObjects.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => toggleHighlight(country.code)}
                    title={`Remove ${country.name}`}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold hover:bg-rose-50 hover:text-rose-800 hover:border-rose-200 transition-colors"
                  >
                    <span>{country.name}</span>
                    <span className="text-[10px] font-mono opacity-70 uppercase">
                      {country.code}
                    </span>
                    <X className="w-3 h-3" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Main Custom Map Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Interactive SVG Canvas + Country Picker */}
            <div className="lg:col-span-8 space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-500">
                    Interactive preview · Click any country polygon to toggle highlight
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        downloadSvg(
                          customSvg,
                          `worldatlas-custom-highlight-${highlightedCodes.size}-countries.svg`
                        )
                      }
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download SVG</span>
                    </button>

                    <button
                      type="button"
                      disabled={isExportingPng}
                      onClick={() =>
                        handleExportPng(
                          customSvg,
                          `worldatlas-custom-highlight-${pngResolution}px.png`,
                          customConfig.aspectRatio
                        )
                      }
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>PNG ({pngResolution}px)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopySvg(customSvg, 'custom')}
                      className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors"
                    >
                      {copiedId === 'custom' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedId === 'custom' ? 'Copied' : 'Copy SVG'}</span>
                    </button>
                  </div>
                </div>

                <div
                  className={`p-4 sm:p-5 flex items-center justify-center min-h-[340px] ${
                    customConfig.transparentBackground ? 'map-checkerboard' : 'bg-slate-50/70'
                  }`}
                >
                  <div
                    data-testid="custom-map-canvas"
                    onClick={(e) => {
                      const target = (e.target as Element).closest('path[data-code]');
                      const code = target?.getAttribute('data-code');
                      if (code) {
                        toggleHighlight(code);
                      }
                    }}
                    className="w-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[500px] [&>svg]:rounded-xl [&>svg]:border [&>svg]:border-slate-200/70 [&_path[data-code]]:cursor-pointer [&_path[data-code]]:transition-opacity [&_path[data-code]:hover]:opacity-80"
                    dangerouslySetInnerHTML={{ __html: customSvg }}
                  />
                </div>
              </div>

              {/* Country Selection Directory */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <h3 className="text-xs font-bold text-slate-800">
                    Add or Remove Highlighted Countries
                  </h3>
                  <div className="relative sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={customCountrySearch}
                      onChange={(e) => setCustomCountrySearch(e.target.value)}
                      placeholder="Search country (Japan, Brazil, UK...)"
                      aria-label="Search countries to highlight"
                      className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white"
                    />
                    {customCountrySearch && (
                      <button
                        type="button"
                        onClick={() => setCustomCountrySearch('')}
                        aria-label="Clear country highlight search"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-52 overflow-y-auto pr-1">
                  {customChecklistCountries.map((country) => {
                    const active = highlightedCodes.has(country.code);
                    return (
                      <button
                        key={country.code}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleHighlight(country.code)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left text-xs transition-colors ${
                          active
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="truncate pr-1.5">{country.name}</span>
                        <span className="text-[10px] font-mono uppercase text-slate-400 shrink-0">
                          {country.code}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Custom Highlight Customisation Panel */}
            <div className="lg:col-span-4">
              <MapCustomizerPanel
                config={customConfig}
                onChange={setCustomConfig}
                onReset={() =>
                  setCustomConfig({
                    ...DEFAULT_MAP_STYLE,
                    highlightColor: '#059669',
                    baseColor: '#e2e8f0',
                    borderColor: '#ffffff',
                    borderWidth: 0.7,
                    showLabels: true,
                    labelMode: 'name',
                    aspectRatio: '16:9',
                  })
                }
                pngResolution={pngResolution}
                onResolutionChange={setPngResolution}
                mode="custom-highlight"
              />
            </div>
          </div>
        </div>
      )}

      {/* Single-Country Preview & Customise Modal */}
      {modalCountry && (
        <MapPreviewModal
          key={modalCountry.code}
          country={modalCountry}
          initialConfig={activeGalleryConfig}
          initialResolution={pngResolution}
          onClose={() => setModalCountry(null)}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};
