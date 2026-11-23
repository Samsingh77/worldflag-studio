import React, { useMemo } from 'react';
import type { MapCountry } from '../../data/worldMaps';
import {
  downloadMapPng,
  generateCountryMapSvg,
  generateCountryThumbnailPath,
  type MapPngResolution,
  type MapStyleConfig,
} from '../../utils/mapRenderer';
import { downloadSvg } from '../../utils/flagUtils';
import { sanitizeFilename } from '../../utils/flagLogic';
import { Check, Download, Image as ImageIcon, Sliders } from 'lucide-react';

interface MapCardProps {
  country: MapCountry;
  config: MapStyleConfig;
  pngResolution: MapPngResolution;
  isSelected: boolean;
  onToggleSelect: (code: string) => void;
  onOpenModal: (country: MapCountry) => void;
  onNotify?: (message: string, isError?: boolean) => void;
}

export const MapCard: React.FC<MapCardProps> = ({
  country,
  config,
  pngResolution,
  isSelected,
  onToggleSelect,
  onOpenModal,
  onNotify,
}) => {
  const thumbPath = useMemo(() => generateCountryThumbnailPath(country, 240, 170), [country]);

  const fill =
    config.renderMode === 'outline' ? 'none' : config.fillColor;
  const stroke =
    config.renderMode === 'silhouette'
      ? 'none'
      : config.renderMode === 'outline'
      ? config.borderColor === '#ffffff'
        ? '#0f172a'
        : config.borderColor
      : config.showBorders
      ? config.borderColor
      : 'none';
  const strokeWidth =
    config.renderMode === 'silhouette'
      ? 0
      : config.renderMode === 'outline'
      ? Math.max(config.borderWidth, 1.4)
      : config.showBorders
      ? Math.min(config.borderWidth, 2)
      : 0;

  const handleDownloadSvg = () => {
    try {
      const svg = generateCountryMapSvg(country, config);
      downloadSvg(svg, sanitizeFilename(`${country.name}-Map`, country.code, 'svg'));
    } catch {
      onNotify?.(`Failed to export SVG map for ${country.name}.`, true);
    }
  };

  const handleDownloadPng = async () => {
    try {
      const svg = generateCountryMapSvg(country, config);
      await downloadMapPng(
        svg,
        sanitizeFilename(`${country.name}-Map`, country.code, 'png'),
        pngResolution,
        config.aspectRatio
      );
    } catch {
      onNotify?.(`Failed to export PNG map for ${country.name}.`, true);
    }
  };

  return (
    <article
      data-testid={`map-card-${country.code}`}
      className={`group bg-white rounded-2xl p-4 border transition-all duration-200 hover:shadow-lg flex flex-col justify-between ${
        isSelected
          ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top Row: Selection Checkbox & ISO */}
      <div className="w-full flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => onToggleSelect(country.code)}
          aria-pressed={isSelected}
          aria-label={`${isSelected ? 'Deselect' : 'Select'} ${country.name} map`}
          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors border ${
            isSelected
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'bg-white border-slate-300 hover:border-emerald-500 text-transparent'
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </button>

        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
          {country.code}
        </span>
      </div>

      {/* Clickable Vector Silhouette Preview */}
      <button
        type="button"
        onClick={() => onOpenModal(country)}
        aria-label={`Preview and customise ${country.name} map`}
        className="w-full flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
      >
        <div
          className={`w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-200/80 flex items-center justify-center my-1.5 ${
            config.transparentBackground ? 'map-checkerboard' : ''
          }`}
          style={
            config.transparentBackground
              ? undefined
              : { backgroundColor: config.backgroundColor }
          }
        >
          <svg
            viewBox="0 0 240 170"
            className="w-full h-full transition-transform duration-200 group-hover:scale-[1.03]"
            role="img"
            aria-label={`${country.name} geographical silhouette`}
          >
            <path
              d={thumbPath}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="text-center w-full mt-1.5">
          <h3
            className="font-semibold text-slate-900 text-sm truncate max-w-full"
            title={country.name}
          >
            {country.name}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">{country.continent}</p>
        </div>
      </button>

      {/* Quick Action Footer */}
      <div className="mt-3 pt-3 border-t border-slate-100 w-full flex items-center justify-between gap-1.5 text-xs">
        <button
          type="button"
          onClick={handleDownloadSvg}
          aria-label={`Download ${country.name} map SVG`}
          className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-medium transition-colors border border-slate-200/80"
        >
          <Download className="w-3.5 h-3.5" />
          <span>SVG</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadPng}
          aria-label={`Download ${country.name} map PNG`}
          className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-medium transition-colors border border-slate-200/80"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>PNG</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenModal(country)}
          aria-label={`Customise ${country.name} map`}
          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200/80"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
};
