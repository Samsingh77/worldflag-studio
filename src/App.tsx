import React, { useState, useMemo } from 'react';
import { COUNTRIES, CountryFlag, getFlagSvgContent } from './data/countries';
import { getMapCountries } from './data/worldMaps';
import { Header, type StudioSection } from './components/Header';
import { Navigation } from './components/Navigation';
import { Toolbar, FlagStyle } from './components/Toolbar';
import { FlagGrid } from './components/FlagGrid';
import { StyleModal } from './components/StyleModal';
import { AboutModal } from './components/AboutModal';
import { PowerPointHub } from './components/PowerPointHub';
import { MapStudio, type MapStudioTab } from './components/map/MapStudio';
import JSZip from 'jszip';
import { downloadFile, downloadSvg } from './utils/flagUtils';
import {
  DEFAULT_MAP_STYLE,
  downloadMapPng,
  generateCustomHighlightMapSvg,
  generateWorldMapSvg,
} from './utils/mapRenderer';
import {
  buildCountriesCsv,
  computeContinentCounts,
  filterAndSortCountries,
  sanitizeFilename,
  MAX_ZIP_SELECTION,
  toggleZipSelection,
} from './utils/flagLogic';
import { X } from 'lucide-react';

export default function App() {
  // Primary Studio Section ('flags' | 'maps' | 'powerpoint')
  const [activeStudio, setActiveStudio] = useState<StudioSection>('flags');
  const [activeMapTab, setActiveMapTab] = useState<MapStudioTab>('all');

  // Flag Studio State (Preserved)
  const [activeTab, setActiveTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [flagStyle, setFlagStyle] = useState<FlagStyle>('rectangle');
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [selectedCountryForModal, setSelectedCountryForModal] = useState<CountryFlag | null>(null);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  // Map Studio Selection State
  const [selectedMapCodes, setSelectedMapCodes] = useState<Set<string>>(new Set());

  // Shared UI State
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ message: string; isError: boolean } | null>(null);

  const showNotice = (message: string, isError = false) => {
    setNotice({ message, isError });
  };

  // Compute counts per Flag Studio navigation tab (group Antarctica under International & Others)
  const counts = useMemo(() => {
    const raw = computeContinentCounts(COUNTRIES);
    return {
      ...raw,
      International: (raw.International || 0) + (raw.Antarctica || 0),
    };
  }, []);

  const filteredCountries = useMemo(
    () =>
      filterAndSortCountries(COUNTRIES, {
        activeTab,
        searchQuery,
        sortOrder,
      }),
    [activeTab, searchQuery, sortOrder]
  );

  const handleToggleSelectFlag = (code: string) => {
    setSelectedCodes((prev) => {
      const { next, limitReached } = toggleZipSelection(prev, code, MAX_ZIP_SELECTION);
      if (limitReached) {
        showNotice(`You can select a maximum of ${MAX_ZIP_SELECTION} flags for ZIP download.`, true);
      }
      return next;
    });
  };

  const handleToggleSelectMap = (code: string) => {
    setSelectedMapCodes((prev) => {
      const { next, limitReached } = toggleZipSelection(prev, code, MAX_ZIP_SELECTION);
      if (limitReached) {
        showNotice(`You can select a maximum of ${MAX_ZIP_SELECTION} country maps for ZIP download.`, true);
      }
      return next;
    });
  };

  const buildAndDownloadFlagZip = async (list: CountryFlag[], zipFilename: string) => {
    if (list.length === 0) return;
    setIsZipping(true);
    setNotice(null);

    const aspect =
      flagStyle === 'square' || flagStyle === 'circle' || flagStyle === 'shield'
        ? '1x1'
        : '4x3';

    try {
      const zip = new JSZip();
      await Promise.all(
        list.map(async (country) => {
          const svg = await getFlagSvgContent(country.code, aspect);
          const folder = zip.folder(country.continent || 'Other');
          if (folder) {
            folder.file(sanitizeFilename(country.name, country.code, 'svg'), svg);
          }
        })
      );

      zip.file('worldatlas_studio_flags_index.csv', buildCountriesCsv(list));

      const content = await zip.generateAsync({ type: 'blob' });
      downloadFile(content, zipFilename);
      showNotice(`Downloaded ${list.length} flags as ${zipFilename}.`);
    } catch {
      showNotice('Failed to generate ZIP bundle. Please try again.', true);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadSelectedFlagZip = () => {
    const selectedList = COUNTRIES.filter((c) => selectedCodes.has(c.code)).slice(0, MAX_ZIP_SELECTION);
    void buildAndDownloadFlagZip(selectedList, 'worldatlas-studio-selected-flags.zip');
  };

  const handleExportFlagCsv = () => {
    const listToExport = filteredCountries.length > 0 ? filteredCountries : COUNTRIES;
    const blob = new Blob([buildCountriesCsv(listToExport)], {
      type: 'text/csv;charset=utf-8',
    });
    downloadFile(blob, 'worldatlas-studio-flags-metadata.csv');
  };

  // PowerPoint Hub Quick Exports
  const handleQuickDownloadWorldSvg = () => {
    try {
      const countries = getMapCountries();
      const svg = generateWorldMapSvg(countries, {
        ...DEFAULT_MAP_STYLE,
        fillColor: '#059669',
        borderColor: '#ffffff',
        borderWidth: 0.7,
        aspectRatio: '16:9',
      });
      downloadSvg(svg, 'worldatlas-executive-world-map-16x9.svg');
      showNotice('Downloaded executive 16:9 World Map SVG.');
    } catch {
      showNotice('Failed to generate World Map SVG.', true);
    }
  };

  const handleQuickDownloadWorldPng = async () => {
    try {
      const countries = getMapCountries();
      const svg = generateWorldMapSvg(countries, {
        ...DEFAULT_MAP_STYLE,
        fillColor: '#059669',
        borderColor: '#ffffff',
        borderWidth: 0.7,
        transparentBackground: true,
        aspectRatio: '16:9',
      });
      await downloadMapPng(svg, 'worldatlas-world-map-transparent-2048px.png', 2048, '16:9');
      showNotice('Downloaded transparent 2048px World Map PNG.');
    } catch {
      showNotice('Failed to export transparent World Map PNG.', true);
    }
  };

  const handleQuickDownloadBusinessMapSvg = () => {
    try {
      const countries = getMapCountries();
      const svg = generateCustomHighlightMapSvg(
        countries,
        new Set(['in', 'us', 'gb', 'de']),
        {
          ...DEFAULT_MAP_STYLE,
          highlightColor: '#059669',
          baseColor: '#e2e8f0',
          borderColor: '#ffffff',
          borderWidth: 0.7,
          showLabels: true,
          labelMode: 'name',
          aspectRatio: '16:9',
        }
      );
      downloadSvg(svg, 'worldatlas-business-markets-in-us-gb-de.svg');
      showNotice('Downloaded Business Markets Highlight Map SVG (India, USA, UK, Germany).');
    } catch {
      showNotice('Failed to generate Business Markets Highlight Map.', true);
    }
  };

  const handleNavigateStudio = (studio: StudioSection, mapTab?: MapStudioTab) => {
    setActiveStudio(studio);
    if (studio === 'maps' && mapTab) {
      setActiveMapTab(mapTab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeSelectedCount =
    activeStudio === 'maps' ? selectedMapCodes.size : selectedCodes.size;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Header
        activeStudio={activeStudio}
        onSelectStudio={(studio) => setActiveStudio(studio)}
        onOpenAbout={() => setIsAboutOpen(true)}
        selectedCount={activeSelectedCount}
      />

      {notice && (
        <div
          role="status"
          className={`border-b px-4 py-2.5 text-xs font-medium ${
            notice.isError
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <span>{notice.message}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss message"
              className="p-0.5 rounded hover:bg-black/5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ==================== FLAG STUDIO (PRESERVED) ==================== */}
      {activeStudio === 'flags' && (
        <>
          <Navigation activeTab={activeTab} onSelectTab={setActiveTab} counts={counts} />

          <main className="flex-1 pb-16">
            <Toolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
              flagStyle={flagStyle}
              onStyleChange={setFlagStyle}
              selectedCount={selectedCodes.size}
              onClearSelection={() => setSelectedCodes(new Set())}
              onDownloadSelectedZip={handleDownloadSelectedFlagZip}
              onExportCsv={handleExportFlagCsv}
              isZipping={isZipping}
            />

            <FlagGrid
              countries={filteredCountries}
              flagStyle={flagStyle}
              selectedCodes={selectedCodes}
              onToggleSelect={handleToggleSelectFlag}
              onOpenModal={(country) => setSelectedCountryForModal(country)}
              onClearSearch={() => {
                setSearchQuery('');
                setActiveTab('All');
              }}
              onNotify={showNotice}
            />
          </main>
        </>
      )}

      {/* ==================== MAP STUDIO (NEW) ==================== */}
      {activeStudio === 'maps' && (
        <main className="flex-1">
          <MapStudio
            activeTab={activeMapTab}
            onTabChange={setActiveMapTab}
            selectedCodes={selectedMapCodes}
            onToggleSelect={handleToggleSelectMap}
            onClearSelection={() => setSelectedMapCodes(new Set())}
            onNotify={showNotice}
          />
        </main>
      )}

      {/* ==================== POWERPOINT DESIGNER HUB ==================== */}
      {activeStudio === 'powerpoint' && (
        <main className="flex-1 pb-12">
          <PowerPointHub
            onNavigateStudio={handleNavigateStudio}
            onQuickDownloadWorldSvg={handleQuickDownloadWorldSvg}
            onQuickDownloadWorldPng={handleQuickDownloadWorldPng}
            onQuickDownloadBusinessMapSvg={handleQuickDownloadBusinessMapSvg}
          />
        </main>
      )}

      <footer className="bg-white border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} WorldAtlas Studio — Flags. Maps. Geography. Made for
            Designers.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <button
              type="button"
              onClick={() => handleNavigateStudio('powerpoint')}
              className="hover:text-slate-900 transition-colors font-medium"
            >
              PowerPoint Hub
            </button>
            <button
              type="button"
              onClick={() => setIsAboutOpen(true)}
              className="hover:text-slate-900 transition-colors"
            >
              About &amp; License
            </button>
            <a
              href="https://github.com/lipis/flag-icons"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 transition-colors"
            >
              flag-icons (MIT)
            </a>
            <a
              href="https://github.com/topojson/world-atlas"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 transition-colors"
            >
              world-atlas (Natural Earth)
            </a>
            <a
              href="https://www.geoboundaries.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 transition-colors"
            >
              geoBoundaries (ADM1)
            </a>
          </div>
        </div>
      </footer>

      <StyleModal
        country={selectedCountryForModal}
        onClose={() => setSelectedCountryForModal(null)}
        onNotify={showNotice}
      />

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
