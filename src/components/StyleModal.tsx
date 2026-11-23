import React, { useState } from 'react';
import {
  CountryFlag,
  FlagAspect,
  getFlagSvgContent,
  getFlagSvgUrl,
  getFallbackFlagDataUrl,
} from '../data/countries';
import { X, Download, Copy, Check, Image as ImageIcon, Sparkles } from 'lucide-react';
import { downloadSvg, downloadPng } from '../utils/flagUtils';
import { sanitizeFilename } from '../utils/flagLogic';

interface StyleModalProps {
  country: CountryFlag | null;
  onClose: () => void;
  onNotify?: (message: string, isError?: boolean) => void;
}

export const StyleModal: React.FC<StyleModalProps> = ({ country, onClose, onNotify }) => {
  const [copied, setCopied] = useState(false);
  const [downloadingPngSize, setDownloadingPngSize] = useState<number | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<FlagAspect>('4x3');

  if (!country) return null;

  const url4x3 = getFlagSvgUrl(country.code, '4x3');
  const url1x1 = getFlagSvgUrl(country.code, '1x1');
  const fallbackUrl = getFallbackFlagDataUrl(country.code);

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.src !== fallbackUrl) {
      img.src = fallbackUrl;
    }
  };

  const handleCopySvg = async () => {
    try {
      const svgContent = await getFlagSvgContent(country.code, selectedAspect);
      await navigator.clipboard.writeText(svgContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onNotify?.('Clipboard access denied. Use Download SVG instead.', true);
    }
  };

  const handleSvgDownload = async () => {
    try {
      const svgContent = await getFlagSvgContent(country.code, selectedAspect);
      downloadSvg(svgContent, sanitizeFilename(country.name, country.code, 'svg'));
    } catch {
      onNotify?.(`Failed to download SVG for ${country.name}.`, true);
    }
  };

  const handlePngDownload = async (size: number) => {
    setDownloadingPngSize(size);
    try {
      const svgContent = await getFlagSvgContent(country.code, selectedAspect);
      const baseName = sanitizeFilename(country.name, country.code, 'png').replace(
        /\.png$/,
        `-${size}px.png`
      );
      await downloadPng(svgContent, baseName, size, selectedAspect);
    } catch {
      onNotify?.(`Failed to export ${size}px PNG for ${country.name}.`, true);
    } finally {
      setDownloadingPngSize(null);
    }
  };

  const stylesList = [
    {
      id: 'rectangle',
      label: 'Standard Rectangle (4:3)',
      src: url4x3,
      className: 'w-44 aspect-[4/3] rounded-md shadow-sm border border-slate-200 overflow-hidden',
    },
    {
      id: 'rounded',
      label: 'Rounded Card (4:3)',
      src: url4x3,
      className: 'w-44 aspect-[4/3] rounded-2xl shadow-sm border border-slate-200 overflow-hidden',
    },
    {
      id: 'square',
      label: 'Square Asset (1:1)',
      src: url1x1,
      className: 'w-32 aspect-square rounded-lg shadow-sm border border-slate-200 overflow-hidden',
    },
    {
      id: 'circle',
      label: 'Circular Emblem',
      src: url1x1,
      className: 'w-32 aspect-square rounded-full shadow-sm border border-slate-200 overflow-hidden',
    },
    {
      id: 'shield',
      label: 'Presentation Shield',
      src: url1x1,
      className: 'w-28 h-32 flag-shield-clip overflow-hidden drop-shadow-sm',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="style-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 my-8">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-9 rounded-md overflow-hidden shadow-xs border border-slate-200 bg-white">
              <img
                src={url4x3}
                alt={`${country.name} flag`}
                onError={handleImgError}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="style-modal-title" className="text-xl font-bold text-slate-900">
                  {country.name}
                </h2>
                <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-md">
                  {country.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Region: {country.continent}
                {country.capital ? ` • Capital: ${country.capital}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview modal"
            className="p-2 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-8 max-h-[75vh] overflow-y-auto">
          {/* Quick Download Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-semibold text-sm text-emerald-950 block">
                  Instant Designer Export
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedAspect('4x3')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      selectedAspect === '4x3'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    4:3 Rectangle
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAspect('1x1')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      selectedAspect === '1x1'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    1:1 Square
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSvgDownload}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download SVG</span>
              </button>
              <button
                type="button"
                onClick={handleCopySvg}
                className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs border border-slate-300 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied SVG!' : 'Copy SVG Code'}</span>
              </button>
            </div>
          </div>

          {/* PNG Resolution Options */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              High-Resolution PNG Export (Transparent Background, {selectedAspect})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[256, 512, 1024, 2048].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handlePngDownload(size)}
                  disabled={downloadingPngSize === size}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all text-center group"
                >
                  <ImageIcon className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 mb-1" />
                  <span className="font-bold text-sm text-slate-800">{size}px</span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {size >= 1024 ? 'PPT Retina Ready' : 'Standard'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Presentation Style Previews */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              Presentation Style Previews
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {stylesList.map((st) => (
                <div
                  key={st.id}
                  className="flex flex-col items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200"
                >
                  <div className="h-36 flex items-center justify-center mb-2">
                    <div className={st.className}>
                      <img
                        src={st.src}
                        alt={`${country.name} - ${st.label}`}
                        onError={handleImgError}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{st.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Tip: Insert SVG files into PowerPoint and right-click &ldquo;Convert to Shape&rdquo; to edit vector paths.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shrink-0 ml-4"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
