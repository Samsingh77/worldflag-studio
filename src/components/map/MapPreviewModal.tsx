import React, { useEffect, useMemo, useState } from 'react';
import type { MapCountry } from '../../data/worldMaps';
import {
  fetchAdminBoundaries,
  getAdminClassificationLabel,
  getCachedAdminBoundaries,
  type AdminBoundaryDataset,
} from '../../data/adminBoundaries';
import {
  DEFAULT_MAP_STYLE,
  buildCountryMapFilename,
  downloadMapPng,
  generateCountryDetailSvg,
  type MapPngResolution,
  type MapStyleConfig,
} from '../../utils/mapRenderer';
import { downloadSvg } from '../../utils/flagUtils';
import { MapCustomizerPanel } from './MapCustomizerPanel';
import { Check, Copy, Download, Image as ImageIcon, Layers, Loader2, Map, X } from 'lucide-react';

interface MapPreviewModalProps {
  country: MapCountry | null;
  initialConfig: MapStyleConfig;
  initialResolution: MapPngResolution;
  onClose: () => void;
  onNotify?: (message: string, isError?: boolean) => void;
}

const PNG_SIZES: MapPngResolution[] = [512, 1024, 2048, 4096];

export const MapPreviewModal: React.FC<MapPreviewModalProps> = ({
  country,
  initialConfig,
  initialResolution,
  onClose,
  onNotify,
}) => {
  // Always default to Mode 1: Country Only with zero labels enabled
  const [config, setConfig] = useState<MapStyleConfig>({
    ...DEFAULT_MAP_STYLE,
    ...initialConfig,
    showStateBoundaries: false,
    showStateLabels: false,
    showLabels: false,
  });
  const [resolution, setResolution] = useState<MapPngResolution>(initialResolution);
  const [copied, setCopied] = useState(false);
  const [exportingSize, setExportingSize] = useState<number | null>(null);

  // Lazy-loaded & session-cached geoBoundaries ADM1 state
  const [adminData, setAdminData] = useState<AdminBoundaryDataset | null>(() => {
    if (!country) return null;
    const cached = getCachedAdminBoundaries(country.code);
    return cached?.status === 'ready' ? cached.dataset : null;
  });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminUnavailable, setAdminUnavailable] = useState<string | null>(() => {
    if (!country) return null;
    const cached = getCachedAdminBoundaries(country.code);
    return cached?.status === 'unavailable' ? cached.reason : null;
  });

  // Load ADM1 boundaries lazily ONLY when user enables Show State / Province Boundaries
  useEffect(() => {
    if (!country || !config.showStateBoundaries) return;

    const cached = getCachedAdminBoundaries(country.code);
    if (cached) {
      if (cached.status === 'ready') {
        setAdminData(cached.dataset);
        setAdminUnavailable(null);
      } else {
        setAdminData(null);
        setAdminUnavailable(cached.reason);
      }
      setAdminLoading(false);
      return;
    }

    let cancelled = false;
    setAdminLoading(true);
    setAdminUnavailable(null);

    void fetchAdminBoundaries(country.code).then((result) => {
      if (cancelled) return;
      if (result.status === 'ready') {
        setAdminData(result.dataset);
        setAdminUnavailable(null);
      } else {
        setAdminData(null);
        setAdminUnavailable(result.reason);
      }
      setAdminLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [country, config.showStateBoundaries]);

  const isStatesActive = Boolean(config.showStateBoundaries && adminData);

  const svgMarkup = useMemo(() => {
    if (!country) return '';
    return generateCountryDetailSvg(country, adminData, config, { width: 900 });
  }, [country, adminData, config]);

  if (!country) return null;

  const divisionLabel =
    adminData?.metadata.canonicalType || getAdminClassificationLabel(country.code);

  const handleDownloadSvg = () => {
    const filename = buildCountryMapFilename(country.name, isStatesActive, 'svg');
    downloadSvg(svgMarkup, filename);
    onNotify?.(`Downloaded ${filename}.`);
  };

  const handleCopySvg = async () => {
    try {
      await navigator.clipboard.writeText(svgMarkup);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onNotify?.('Clipboard access denied. Use Download SVG instead.', true);
    }
  };

  const handleDownloadPng = async (size: MapPngResolution) => {
    setExportingSize(size);
    try {
      const filename = buildCountryMapFilename(country.name, isStatesActive, 'png', size);
      await downloadMapPng(svgMarkup, filename, size, config.aspectRatio);
      onNotify?.(`Exported ${filename}.`);
    } catch {
      onNotify?.(`Failed to export ${size}px PNG map for ${country.name}.`, true);
    } finally {
      setExportingSize(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-preview-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 id="map-preview-modal-title" className="text-lg font-bold text-slate-900 truncate">
                {country.name} Map
              </h2>
              <span className="text-xs font-mono font-semibold uppercase text-emerald-700 shrink-0">
                {country.code}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate">
              {country.continent}
              {country.capital ? ` · Capital: ${country.capital}` : ''} ·{' '}
              {isStatesActive
                ? `${adminData!.metadata.unitCount} ${divisionLabel} (geoBoundaries ADM1)`
                : 'Natural Earth 1:50m Vector'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close map customiser"
            className="p-2 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[80vh] overflow-y-auto">
          {/* Left: Mode Switcher + Live Vector Preview + Quick Exports */}
          <div className="lg:col-span-7 space-y-4">
            {/* Instant Mode 1 / Mode 2 Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div
                role="group"
                aria-label="Country map display mode"
                className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80"
              >
                <button
                  type="button"
                  aria-pressed={!config.showStateBoundaries}
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      showStateBoundaries: false,
                      showStateLabels: false,
                    }))
                  }
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    !config.showStateBoundaries
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Map className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Country Only</span>
                </button>

                <button
                  type="button"
                  aria-pressed={Boolean(config.showStateBoundaries)}
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      showStateBoundaries: true,
                    }))
                  }
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    config.showStateBoundaries
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Country + {divisionLabel}</span>
                </button>
              </div>

              <span className="text-[11px] font-medium text-slate-500">
                {isStatesActive
                  ? `${adminData!.metadata.unitCount} divisions · ${
                      config.showStateLabels ? 'Labels on' : 'No labels'
                    }`
                  : 'Outer silhouette only'}
              </span>
            </div>

            {/* Live SVG Preview Canvas */}
            <div
              className={`relative w-full rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center p-4 min-h-[300px] sm:min-h-[380px] ${
                config.transparentBackground ? 'map-checkerboard' : 'bg-slate-50'
              }`}
            >
              <div
                data-testid="country-modal-svg-canvas"
                className="w-full max-h-[400px] flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[380px]"
                dangerouslySetInnerHTML={{ __html: svgMarkup }}
              />

              {adminLoading && (
                <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] flex items-center justify-center p-4">
                  <div className="inline-flex items-center space-x-2.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-md text-xs font-semibold text-slate-700">
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                    <span>
                      Loading {country.name} {divisionLabel}…
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Primary SVG actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={adminLoading}
                onClick={handleDownloadSvg}
                className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>
                  Download {isStatesActive ? 'Country + States' : 'Country Only'} SVG
                </span>
              </button>

              <button
                type="button"
                disabled={adminLoading}
                onClick={handleCopySvg}
                className="flex items-center space-x-2 px-4 py-2.5 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{copied ? 'Copied SVG!' : 'Copy SVG Code'}</span>
              </button>
            </div>

            {/* PNG Resolution Export Grid */}
            <div>
              <h3 className="text-xs font-semibold text-slate-700 mb-2.5">
                Download PNG ({isStatesActive ? 'With State Boundaries' : 'Country Only'} ·{' '}
                {config.transparentBackground ? 'Transparent' : 'Solid'} · {config.aspectRatio})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PNG_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    disabled={exportingSize === size || adminLoading}
                    onClick={() => handleDownloadPng(size)}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-colors disabled:opacity-50"
                  >
                    <ImageIcon className="w-4 h-4 text-slate-500 mb-1" />
                    <span className="text-sm font-bold text-slate-900 tabular-nums">{size}px</span>
                    <span className="text-[10px] text-slate-500">
                      {size >= 2048 ? 'Print / 4K Slide' : 'Standard Slide'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Customisation Panel */}
          <div className="lg:col-span-5">
            <MapCustomizerPanel
              config={config}
              onChange={setConfig}
              onReset={() =>
                setConfig({
                  ...DEFAULT_MAP_STYLE,
                  aspectRatio: initialConfig.aspectRatio,
                  showStateBoundaries: config.showStateBoundaries,
                  showStateLabels: false,
                  showLabels: false,
                })
              }
              pngResolution={resolution}
              onResolutionChange={setResolution}
              mode="country"
              compact
              adminBoundaryState={{
                loading: adminLoading,
                unavailableReason: adminUnavailable,
                divisionLabel,
                unitCount: adminData?.metadata.unitCount ?? null,
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            {isStatesActive ? (
              <>
                Administrative boundaries by{' '}
                <a
                  href="https://www.geoboundaries.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:underline font-medium"
                >
                  geoBoundaries
                </a>{' '}
                ({adminData!.metadata.license}). Every division exports as an editable PowerPoint
                vector shape.
              </>
            ) : (
              <>
                PowerPoint Tip: Drag the SVG onto a slide, then right-click &ldquo;Convert to
                Shape&rdquo; to recolour regions natively.
              </>
            )}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shrink-0"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
