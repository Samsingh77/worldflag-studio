import React from 'react';
import {
  Presentation,
  Flag,
  Map,
  Globe,
  Layers,
  Download,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import type { StudioSection } from './Header';
import type { MapStudioTab } from './map/MapStudio';

interface PowerPointHubProps {
  onNavigateStudio: (studio: StudioSection, mapTab?: MapStudioTab) => void;
  onQuickDownloadWorldSvg: () => void;
  onQuickDownloadWorldPng: () => void;
  onQuickDownloadBusinessMapSvg: () => void;
}

export const PowerPointHub: React.FC<PowerPointHubProps> = ({
  onNavigateStudio,
  onQuickDownloadWorldSvg,
  onQuickDownloadWorldPng,
  onQuickDownloadBusinessMapSvg,
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Hero Banner */}
      <section className="bg-white rounded-3xl p-7 sm:p-10 border border-slate-200 shadow-xs">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold text-emerald-700 mb-2">
            PowerPoint Designer Hub · WorldAtlas Studio
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3 text-balance">
            Presentation-ready vector flags and geographical maps for PowerPoint &amp; Keynote
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Export crisp editable SVG graphics and transparent high-resolution PNGs (up to 4096px)
            designed for executive decks, regional market maps, and international slides—completely
            offline in your browser.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateStudio('flags')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <Flag className="w-4 h-4" />
              <span>Open Flag Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateStudio('maps', 'world')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <Map className="w-4 h-4" />
              <span>Open Map Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Ready-to-Use Designer Asset Shortcuts */}
      <section>
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900">Ready-to-Use Presentation Assets</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Jump directly into each asset type or export a slide-ready file immediately
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                <Flag className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">
                Country Flags (271 SVGs)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Standard 4:3 rectangular, square, circular, rounded, and shield styles with
                transparent PNGs up to 2048px.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateStudio('flags')}
              className="mt-4 inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <span>Browse Flag Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                <Map className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">
                Individual Country Maps &amp; Outlines
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Natural Earth 1:50m country silhouettes in filled, outline-only (no fill), or solid
                modes with editable borders.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateStudio('maps', 'countries')}
              className="mt-4 inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <span>Browse Country Maps</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                <Globe className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">
                Executive World Map (16:9)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clean international boundaries fitted for 16:9 widescreen slides. Download editable
                SVG or transparent 2048px PNG.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={onQuickDownloadWorldSvg}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>SVG</span>
              </button>
              <button
                type="button"
                onClick={onQuickDownloadWorldPng}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Transparent PNG</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">Continent Maps</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dedicated regional maps for Asia, Europe, Africa, North America, South America, and
                Oceania in editable SVG and PNG formats.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateStudio('maps', 'continents')}
              className="mt-4 inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <span>Open Continent Maps</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">
                Business Markets Highlight Map
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Highlight India, USA, UK, and Germany against a clean light-grey world backdrop for
                consulting and banking decks.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={onQuickDownloadBusinessMapSvg}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Quick SVG</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateStudio('maps', 'custom')}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                Customise →
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                <Presentation className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">
                Country Outline Graphics
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                No-fill vector outlines and solid silhouettes on transparent backgrounds for
                minimalist KPI callout slides.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateStudio('maps', 'outlines')}
              className="mt-4 inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <span>Open Country Outlines</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* PowerPoint Editable SVG Workflow Guide */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          How to Edit WorldAtlas SVG Files Directly Inside PowerPoint
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Works in Microsoft 365, PowerPoint 2021+, and PowerPoint for Mac
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-emerald-700">01. Insert Vector SVG</div>
            <h4 className="text-sm font-semibold text-slate-900">Drag &amp; Drop onto Slide</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Download any country flag, world map, continent map, or country outline as{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">.svg</code> and
              insert via <strong>Insert → Pictures → This Device</strong>.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-emerald-700">
              02. Convert to Editable Shapes
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Right-Click → Convert to Shape</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Select the inserted SVG, open the <strong>Graphics Format</strong> ribbon (or
              right-click), and click <strong>Convert to Shape</strong>. PowerPoint ungroups each
              country boundary into an individual native shape.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-emerald-700">
              03. Recolour &amp; Animate
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Apply Brand Colours Natively</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Click any individual country shape to apply your corporate PowerPoint theme fill,
              outline weight, callout pins, or slide animations with zero pixelation at any zoom.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
          <span className="inline-flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Transparent PNGs up to 4096px for older Office versions</span>
          </span>
          <span className="inline-flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>16:9 widescreen aspect ratio matched to standard decks</span>
          </span>
          <span className="inline-flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>100% offline client-side export</span>
          </span>
        </div>
      </section>
    </div>
  );
};
