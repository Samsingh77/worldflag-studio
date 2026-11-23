import React from 'react';
import {
  MAP_THEMES,
  type MapAspectRatio,
  type MapLabelMode,
  type MapPngResolution,
  type MapRenderMode,
  type MapStyleConfig,
} from '../../utils/mapRenderer';
import { AlertCircle, Layers, Loader2, Palette, RotateCcw } from 'lucide-react';

export interface AdminBoundaryControlState {
  loading: boolean;
  unavailableReason: string | null;
  divisionLabel: string;
  unitCount: number | null;
}

interface MapCustomizerPanelProps {
  config: MapStyleConfig;
  onChange: (next: MapStyleConfig) => void;
  onReset: () => void;
  pngResolution: MapPngResolution;
  onResolutionChange: (res: MapPngResolution) => void;
  mode?: 'standard' | 'country' | 'custom-highlight' | 'world';
  compact?: boolean;
  adminBoundaryState?: AdminBoundaryControlState;
}

const RESOLUTIONS: MapPngResolution[] = [512, 1024, 2048, 4096];
const ASPECT_RATIOS: MapAspectRatio[] = ['16:9', '4:3', '1:1'];

export const MapCustomizerPanel: React.FC<MapCustomizerPanelProps> = ({
  config,
  onChange,
  onReset,
  pngResolution,
  onResolutionChange,
  mode = 'standard',
  compact = false,
  adminBoundaryState,
}) => {
  const update = (patch: Partial<MapStyleConfig>) => {
    onChange({ ...config, ...patch });
  };

  const isCountryWithStates =
    mode === 'country' && Boolean(config.showStateBoundaries) && !adminBoundaryState?.unavailableReason;

  return (
    <aside
      aria-label="Map customisation panel"
      className={`bg-white rounded-2xl border border-slate-200 ${
        compact ? 'p-4 space-y-4' : 'p-5 space-y-5'
      }`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Palette className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Map Customisation</h3>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center space-x-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          title="Reset to default style"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Administrative Boundaries Section (Individual Country Mode) */}
      {mode === 'country' && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">Administrative Boundaries</span>
            </div>
            {adminBoundaryState?.loading && (
              <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-emerald-700">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Loading…</span>
              </span>
            )}
          </div>

          <label className="flex items-start space-x-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(config.showStateBoundaries)}
              onChange={(e) => {
                const enabled = e.target.checked;
                update({
                  showStateBoundaries: enabled,
                  // Keep state labels off whenever toggling state boundaries
                  showStateLabels: enabled ? Boolean(config.showStateLabels) : false,
                });
              }}
              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="leading-snug">
              Show State / Province Boundaries
              <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                {config.showStateBoundaries && adminBoundaryState?.unitCount
                  ? `${adminBoundaryState.unitCount} ${adminBoundaryState.divisionLabel} · geoBoundaries`
                  : adminBoundaryState?.divisionLabel
                  ? `Display internal ${adminBoundaryState.divisionLabel.toLowerCase()}`
                  : 'Display internal states, provinces, or regions'}
              </span>
            </span>
          </label>

          {adminBoundaryState?.unavailableReason && config.showStateBoundaries && (
            <div
              role="status"
              className="flex items-start space-x-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>{adminBoundaryState.unavailableReason}</span>
            </div>
          )}

          <label
            className={`flex items-center space-x-2.5 text-xs font-medium pt-1 border-t border-slate-200/70 ${
              isCountryWithStates
                ? 'text-slate-700 cursor-pointer'
                : 'text-slate-400 cursor-not-allowed'
            }`}
          >
            <input
              type="checkbox"
              disabled={!isCountryWithStates}
              checked={Boolean(config.showStateLabels) && isCountryWithStates}
              onChange={(e) => update({ showStateLabels: e.target.checked })}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-40"
            />
            <span>Show State / Province Names</span>
          </label>
        </div>
      )}

      {/* Preset Themes */}
      <div>
        <span className="block text-xs font-semibold text-slate-700 mb-2">
          Corporate Colour Presets
        </span>
        <div className="grid grid-cols-2 gap-2">
          {MAP_THEMES.map((theme) => {
            const active =
              config.renderMode === theme.renderMode &&
              (mode === 'custom-highlight'
                ? config.highlightColor === theme.highlightColor
                : config.fillColor === theme.fillColor);
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() =>
                  update({
                    fillColor: theme.fillColor,
                    highlightColor: theme.highlightColor,
                    baseColor: theme.baseColor,
                    borderColor: theme.borderColor,
                    borderWidth: theme.borderWidth,
                    backgroundColor: theme.backgroundColor,
                    renderMode: mode === 'custom-highlight' ? 'filled' : theme.renderMode,
                    stateBorderColor: theme.stateBorderColor,
                    stateBorderWidth: theme.stateBorderWidth,
                    outerBorderColor: theme.outerBorderColor,
                    outerBorderWidth: theme.outerBorderWidth,
                  })
                }
                className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border text-left text-xs font-medium transition-colors ${
                  active
                    ? 'border-emerald-600 bg-emerald-50/60 text-slate-900'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-sm shrink-0 border border-slate-300"
                  style={{
                    backgroundColor:
                      theme.renderMode === 'outline' ? '#ffffff' : theme.fillColor,
                    borderColor:
                      theme.renderMode === 'outline' ? theme.borderColor : 'rgba(15,23,42,0.15)',
                    borderWidth: theme.renderMode === 'outline' ? 2 : 1,
                  }}
                />
                <span className="truncate">{theme.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Style (Standard / Outline / Silhouette) */}
      {mode !== 'custom-highlight' && (
        <div>
          <span className="block text-xs font-semibold text-slate-700 mb-2">Map Style</span>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'filled', label: 'Filled' },
                { id: 'outline', label: 'Outline' },
                { id: 'silhouette', label: 'Solid' },
              ] as { id: MapRenderMode; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => update({ renderMode: opt.id })}
                className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-colors ${
                  config.renderMode === opt.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Pickers */}
      <div className="grid grid-cols-2 gap-3">
        {mode === 'custom-highlight' ? (
          <>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                Highlight Colour
              </span>
              <div className="flex items-center space-x-2 px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50">
                <input
                  type="color"
                  aria-label="Highlight colour"
                  value={config.highlightColor}
                  onChange={(e) => update({ highlightColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-xs font-mono text-slate-600 uppercase">
                  {config.highlightColor}
                </span>
              </div>
            </label>

            <label className="block">
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                Other Countries
              </span>
              <div className="flex items-center space-x-2 px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50">
                <input
                  type="color"
                  aria-label="Other countries base colour"
                  value={config.baseColor}
                  onChange={(e) => update({ baseColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-xs font-mono text-slate-600 uppercase">
                  {config.baseColor}
                </span>
              </div>
            </label>
          </>
        ) : (
          <label className="block">
            <span className="block text-xs font-semibold text-slate-700 mb-1.5">
              Country Fill Colour
            </span>
            <div className="flex items-center space-x-2 px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50">
              <input
                type="color"
                aria-label="Country fill colour"
                value={config.fillColor}
                disabled={config.renderMode === 'outline'}
                onChange={(e) => update({ fillColor: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0 disabled:opacity-40"
              />
              <span className="text-xs font-mono text-slate-600 uppercase">
                {config.renderMode === 'outline' ? 'NONE' : config.fillColor}
              </span>
            </div>
          </label>
        )}

        {isCountryWithStates ? (
          <>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                State Boundary
              </span>
              <div className="flex items-center space-x-2 px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50">
                <input
                  type="color"
                  aria-label="State boundary colour"
                  value={config.stateBorderColor || '#a7f3d0'}
                  onChange={(e) => update({ stateBorderColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-xs font-mono text-slate-600 uppercase">
                  {config.stateBorderColor || '#A7F3D0'}
                </span>
              </div>
            </label>

            <label className="block col-span-2">
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                Country Outer Border Colour
              </span>
              <div className="flex items-center space-x-2 px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50">
                <input
                  type="color"
                  aria-label="Country outer border colour"
                  value={config.outerBorderColor || '#064e3b'}
                  onChange={(e) => update({ outerBorderColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-xs font-mono text-slate-600 uppercase">
                  {config.outerBorderColor || '#064E3B'}
                </span>
              </div>
            </label>
          </>
        ) : (
          <label className="block">
            <span className="block text-xs font-semibold text-slate-700 mb-1.5">Border Colour</span>
            <div className="flex items-center space-x-2 px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50">
              <input
                type="color"
                aria-label="Border colour"
                value={config.borderColor}
                onChange={(e) => update({ borderColor: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
              />
              <span className="text-xs font-mono text-slate-600 uppercase">
                {config.borderColor}
              </span>
            </div>
          </label>
        )}
      </div>

      {/* Border Toggle & Thickness */}
      {isCountryWithStates ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                State Boundary Thickness
              </span>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                {(config.stateBorderWidth ?? 0.75).toFixed(2)}px
              </span>
            </div>
            <input
              type="range"
              aria-label="State boundary thickness"
              min={0.3}
              max={2.5}
              step={0.05}
              value={config.stateBorderWidth ?? 0.75}
              onChange={(e) => update({ stateBorderWidth: parseFloat(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showBorders}
                  onChange={(e) => update({ showBorders: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Country Outer Border</span>
              </label>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                {(config.outerBorderWidth ?? 1.5).toFixed(1)}px
              </span>
            </div>
            <input
              type="range"
              aria-label="Country outer border thickness"
              min={0.5}
              max={4}
              step={0.1}
              value={config.outerBorderWidth ?? 1.5}
              disabled={!config.showBorders && config.renderMode !== 'outline'}
              onChange={(e) => update({ outerBorderWidth: parseFloat(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer disabled:opacity-40"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showBorders}
                onChange={(e) => update({ showBorders: e.target.checked })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Show Borders</span>
            </label>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              {config.borderWidth.toFixed(1)}px
            </span>
          </div>
          <input
            type="range"
            aria-label="Border thickness"
            min={0.2}
            max={4}
            step={0.1}
            value={config.borderWidth}
            disabled={!config.showBorders && config.renderMode !== 'outline'}
            onChange={(e) => update({ borderWidth: parseFloat(e.target.value) })}
            className="w-full accent-emerald-600 cursor-pointer disabled:opacity-40"
          />
        </div>
      )}

      {/* Background Colour & Transparency */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={config.transparentBackground}
              onChange={(e) => update({ transparentBackground: e.target.checked })}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Transparent Background</span>
          </label>
        </div>

        {!config.transparentBackground && (
          <label className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50">
            <span className="text-xs font-medium text-slate-600">Canvas Background</span>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                aria-label="Background colour"
                value={config.backgroundColor}
                onChange={(e) => update({ backgroundColor: e.target.value })}
                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
              />
              <span className="text-xs font-mono text-slate-600 uppercase">
                {config.backgroundColor}
              </span>
            </div>
          </label>
        )}
      </div>

      {/* Country Labels */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={config.showLabels}
            onChange={(e) => update({ showLabels: e.target.checked })}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span>{mode === 'country' ? 'Show Country Title' : 'Show Country Labels'}</span>
        </label>

        {config.showLabels && (
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'name', label: 'Name' },
                { id: 'iso', label: 'ISO' },
                { id: 'both', label: 'Both' },
              ] as { id: MapLabelMode; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => update({ labelMode: opt.id })}
                className={`py-1 px-2 rounded-md text-xs font-semibold transition-colors ${
                  config.labelMode === opt.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {(mode === 'world' || mode === 'custom-highlight') && (
          <label className="flex items-center space-x-2 text-xs font-medium text-slate-600 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={config.includeAntarctica}
              onChange={(e) => update({ includeAntarctica: e.target.checked })}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Include Antarctica</span>
          </label>
        )}
      </div>

      {/* Aspect Ratio & PNG Size */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div>
          <span className="block text-xs font-semibold text-slate-700 mb-1.5">Aspect Ratio</span>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => update({ aspectRatio: ratio })}
                className={`py-1 px-2 rounded-md text-xs font-semibold tabular-nums transition-colors ${
                  config.aspectRatio === ratio
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="block text-xs font-semibold text-slate-700 mb-1.5">
            PNG Export Width
          </span>
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg">
            {RESOLUTIONS.map((res) => (
              <button
                key={res}
                type="button"
                onClick={() => onResolutionChange(res)}
                className={`py-1 px-1 rounded-md text-[11px] font-semibold tabular-nums transition-colors ${
                  pngResolution === res
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {res}px
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
