import React, { useState } from 'react';
import {
  CountryFlag,
  FlagAspect,
  getFlagSvgContent,
  getFlagSvgUrl,
  getFallbackFlagDataUrl,
} from '../data/countries';
import { FlagStyle } from './Toolbar';
import { Download, Image as ImageIcon, Check, Sliders } from 'lucide-react';
import { downloadSvg, downloadPng } from '../utils/flagUtils';
import { sanitizeFilename } from '../utils/flagLogic';

interface FlagCardProps {
  country: CountryFlag;
  flagStyle: FlagStyle;
  isSelected: boolean;
  onToggleSelect: (code: string) => void;
  onOpenModal: (country: CountryFlag) => void;
  onNotify?: (message: string, isError?: boolean) => void;
}

export const FlagCard: React.FC<FlagCardProps> = ({
  country,
  flagStyle,
  isSelected,
  onToggleSelect,
  onOpenModal,
  onNotify,
}) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const aspect: FlagAspect =
    flagStyle === 'square' || flagStyle === 'circle' || flagStyle === 'shield'
      ? '1x1'
      : '4x3';

  const expectedSrc = getFlagSvgUrl(country.code, aspect);
  const imgFailed = failedSrc === expectedSrc;
  const imgSrc = imgFailed ? getFallbackFlagDataUrl(country.code) : expectedSrc;

  const getContainerStyle = () => {
    switch (flagStyle) {
      case 'circle':
        return 'w-24 h-24 sm:w-28 sm:h-28 rounded-full mx-auto overflow-hidden border border-slate-200 bg-slate-50 shadow-xs';
      case 'square':
        return 'w-24 h-24 sm:w-28 sm:h-28 rounded-lg mx-auto overflow-hidden border border-slate-200 bg-slate-50 shadow-xs';
      case 'rounded':
        return 'w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs';
      case 'shield':
        return 'w-24 h-28 sm:w-26 sm:h-30 mx-auto overflow-hidden bg-slate-50 flag-shield-clip drop-shadow-xs';
      case 'rectangle':
      default:
        return 'w-full aspect-[4/3] rounded-md overflow-hidden border border-slate-200 bg-slate-50 shadow-xs';
    }
  };

  const handleDownloadSvg = async () => {
    try {
      const svgContent = await getFlagSvgContent(country.code, aspect);
      downloadSvg(svgContent, sanitizeFilename(country.name, country.code, 'svg'));
    } catch {
      onNotify?.(`Failed to download SVG for ${country.name}.`, true);
    }
  };

  const handleDownloadPng = async () => {
    try {
      const svgContent = await getFlagSvgContent(country.code, aspect);
      await downloadPng(
        svgContent,
        sanitizeFilename(country.name, country.code, 'png'),
        1024,
        aspect
      );
    } catch {
      onNotify?.(`Failed to export PNG for ${country.name}.`, true);
    }
  };

  return (
    <article
      data-testid={`flag-card-${country.code}`}
      className={`group relative bg-white rounded-2xl p-4 border transition-all duration-200 hover:shadow-lg flex flex-col items-center justify-between ${
        isSelected
          ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top Row: Selection Checkbox & ISO Code */}
      <div className="w-full flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => onToggleSelect(country.code)}
          aria-pressed={isSelected}
          aria-label={`${isSelected ? 'Deselect' : 'Select'} ${country.name}`}
          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors border ${
            isSelected
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'bg-white border-slate-300 hover:border-emerald-500 text-transparent'
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </button>

        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 rounded-md border border-slate-200">
          {country.code}
        </span>
      </div>

      {/* Clickable Flag Preview Button */}
      <button
        type="button"
        onClick={() => onOpenModal(country)}
        aria-label={`Preview and customize ${country.name} flag`}
        className="w-full flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
      >
        <div className="my-2 w-full flex items-center justify-center min-h-[7rem]">
          <div className={getContainerStyle()}>
            <img
              src={imgSrc}
              alt={`${country.name} flag`}
              loading="lazy"
              onError={() => {
                if (failedSrc !== expectedSrc) setFailedSrc(expectedSrc);
              }}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            />
          </div>
        </div>

        <div className="text-center w-full mt-1">
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
          aria-label={`Download ${country.name} SVG`}
          className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-medium transition-colors border border-slate-200/80"
        >
          <Download className="w-3.5 h-3.5" />
          <span>SVG</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadPng}
          aria-label={`Download ${country.name} PNG`}
          className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-medium transition-colors border border-slate-200/80"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>PNG</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenModal(country)}
          aria-label={`Customize ${country.name} export options`}
          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200/80"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
};
