import React from 'react';
import { X, Globe, ShieldCheck, Code2, Map, Flag } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 my-8">
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 id="about-modal-title" className="text-lg font-bold text-slate-900">
                About WorldAtlas Studio
              </h2>
              <p className="text-xs text-slate-500">Flags. Maps. Geography. Made for Designers.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close about dialog"
            className="p-2 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-5 text-sm text-slate-600 leading-relaxed">
          <p>
            <strong className="text-slate-900">WorldAtlas Studio</strong> is a free geographical
            graphics toolkit for presentation, PowerPoint, and graphic designers. Browse, customise,
            and export crisp SVG vectors and transparent high-resolution PNGs for both country flags
            and accurate Natural Earth maps.
          </p>

          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <Flag className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900 text-xs">Flag Studio Attribution</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Powered by the open-source{' '}
                  <a
                    href="https://github.com/lipis/flag-icons"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:underline font-medium"
                  >
                    flag-icons
                  </a>{' '}
                  SVG library (MIT License) with ISO 3166-1 alpha-2 country codes.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <Map className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900 text-xs">Map Studio Attribution</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Country and world boundaries use Natural Earth 1:50m via{' '}
                  <a
                    href="https://github.com/topojson/world-atlas"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:underline font-medium"
                  >
                    world-atlas
                  </a>{' '}
                  (Public Domain / ISC). Internal state, province, and regional boundaries (ADM1)
                  are sourced on demand from{' '}
                  <a
                    href="https://www.geoboundaries.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:underline font-medium"
                  >
                    geoBoundaries
                  </a>{' '}
                  (open administrative datasets), projected locally with D3 Geo and TopoJSON.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <Code2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900 text-xs">Offline &amp; Privacy First</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  All vector maps, PNG rasterisations, and ZIP archives are generated directly in
                  your browser with zero login, zero API keys, and zero external requests.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Free for commercial &amp; presentation use</span>
            </span>
            <span>Client-side SVG / PNG / ZIP</span>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
