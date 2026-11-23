import {
  geoNaturalEarth1,
  geoMercator,
  geoAlbers,
  geoAlbersUsa,
  geoStereographic,
  geoPath,
  geoCentroid,
  geoArea,
  type GeoProjection,
} from 'd3-geo';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import type { MapCountry, MapContinent } from '../data/worldMaps';
import type { AdminBoundaryDataset } from '../data/adminBoundaries';
import { svgToPngBlob, downloadFile } from './flagUtils';

export type MapRenderMode = 'filled' | 'outline' | 'silhouette';
export type MapLabelMode = 'name' | 'iso' | 'both';
export type MapAspectRatio = '16:9' | '4:3' | '1:1';
export type MapPngResolution = 512 | 1024 | 2048 | 4096;

export interface MapStyleConfig {
  fillColor: string;
  borderColor: string;
  borderWidth: number;
  backgroundColor: string;
  transparentBackground: boolean;
  showLabels: boolean;
  labelMode: MapLabelMode;
  aspectRatio: MapAspectRatio;
  renderMode: MapRenderMode;
  showBorders: boolean;
  highlightColor: string;
  baseColor: string;
  includeAntarctica: boolean;
  // Administrative boundary (ADM1) layer settings
  showStateBoundaries?: boolean;
  showStateLabels?: boolean;
  stateBorderColor?: string;
  stateBorderWidth?: number;
  outerBorderColor?: string;
  outerBorderWidth?: number;
}

export interface MapThemePreset {
  id: string;
  name: string;
  fillColor: string;
  highlightColor: string;
  baseColor: string;
  borderColor: string;
  borderWidth: number;
  backgroundColor: string;
  renderMode: MapRenderMode;
  stateBorderColor: string;
  stateBorderWidth: number;
  outerBorderColor: string;
  outerBorderWidth: number;
}

export const MAP_THEMES: MapThemePreset[] = [
  {
    id: 'emerald',
    name: 'Atlas Emerald',
    fillColor: '#059669',
    highlightColor: '#059669',
    baseColor: '#e2e8f0',
    borderColor: '#ffffff',
    borderWidth: 0.9,
    backgroundColor: '#ffffff',
    renderMode: 'filled',
    stateBorderColor: '#a7f3d0',
    stateBorderWidth: 0.75,
    outerBorderColor: '#064e3b',
    outerBorderWidth: 1.5,
  },
  {
    id: 'navy',
    name: 'Executive Navy',
    fillColor: '#1e3a5f',
    highlightColor: '#1d4ed8',
    baseColor: '#e2e8f0',
    borderColor: '#ffffff',
    borderWidth: 0.9,
    backgroundColor: '#ffffff',
    renderMode: 'filled',
    stateBorderColor: '#93c5fd',
    stateBorderWidth: 0.7,
    outerBorderColor: '#0f172a',
    outerBorderWidth: 1.5,
  },
  {
    id: 'slate',
    name: 'Corporate Slate',
    fillColor: '#e2e8f0',
    highlightColor: '#0f172a',
    baseColor: '#f1f5f9',
    borderColor: '#475569',
    borderWidth: 0.9,
    backgroundColor: '#ffffff',
    renderMode: 'filled',
    stateBorderColor: '#94a3b8',
    stateBorderWidth: 0.75,
    outerBorderColor: '#1e293b',
    outerBorderWidth: 1.6,
  },
  {
    id: 'cobalt',
    name: 'Consulting Blue',
    fillColor: '#2563eb',
    highlightColor: '#2563eb',
    baseColor: '#e2e8f0',
    borderColor: '#ffffff',
    borderWidth: 0.9,
    backgroundColor: '#ffffff',
    renderMode: 'filled',
    stateBorderColor: '#bfdbfe',
    stateBorderWidth: 0.75,
    outerBorderColor: '#1e3a8a',
    outerBorderWidth: 1.5,
  },
  {
    id: 'outline',
    name: 'Vector Outline',
    fillColor: '#059669',
    highlightColor: '#059669',
    baseColor: '#f1f5f9',
    borderColor: '#0f172a',
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
    renderMode: 'outline',
    stateBorderColor: '#64748b',
    stateBorderWidth: 0.75,
    outerBorderColor: '#0f172a',
    outerBorderWidth: 1.6,
  },
  {
    id: 'terracotta',
    name: 'Editorial Ochre',
    fillColor: '#c2410c',
    highlightColor: '#ea580c',
    baseColor: '#e7e5e4',
    borderColor: '#ffffff',
    borderWidth: 0.9,
    backgroundColor: '#ffffff',
    renderMode: 'filled',
    stateBorderColor: '#fed7aa',
    stateBorderWidth: 0.75,
    outerBorderColor: '#7c2d12',
    outerBorderWidth: 1.5,
  },
];

export const DEFAULT_MAP_STYLE: MapStyleConfig = {
  fillColor: '#059669',
  borderColor: '#ffffff',
  borderWidth: 0.9,
  backgroundColor: '#ffffff',
  transparentBackground: false,
  showLabels: false,
  labelMode: 'name',
  aspectRatio: '16:9',
  renderMode: 'filled',
  showBorders: true,
  highlightColor: '#059669',
  baseColor: '#e2e8f0',
  includeAntarctica: false,
  showStateBoundaries: false,
  showStateLabels: false,
  stateBorderColor: '#a7f3d0',
  stateBorderWidth: 0.75,
  outerBorderColor: '#064e3b',
  outerBorderWidth: 1.5,
};

export function getMapDimensions(
  aspectRatio: MapAspectRatio,
  width = 1200
): { width: number; height: number } {
  switch (aspectRatio) {
    case '1:1':
      return { width, height: width };
    case '4:3':
      return { width, height: Math.round((width * 3) / 4) };
    case '16:9':
    default:
      return { width, height: Math.round((width * 9) / 16) };
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Extracts the largest polygon of a MultiPolygon so labels and center-longitude
 * calculations focus on the mainland (e.g. Continental US, Metropolitan France, Mainland Russia).
 */
function getMainlandFeature(
  feat: Feature<Polygon | MultiPolygon>
): Feature<Polygon> {
  if (feat.geometry.type === 'Polygon') {
    return feat as Feature<Polygon>;
  }
  let largestCoords = feat.geometry.coordinates[0];
  let maxArea = -1;
  for (const coords of feat.geometry.coordinates) {
    const polyFeat: Feature<Polygon> = {
      type: 'Feature',
      properties: feat.properties,
      geometry: { type: 'Polygon', coordinates: coords },
    };
    const area = geoArea(polyFeat);
    if (area > maxArea) {
      maxArea = area;
      largestCoords = coords;
    }
  }
  return {
    type: 'Feature',
    properties: feat.properties,
    geometry: { type: 'Polygon', coordinates: largestCoords },
  };
}

/**
 * For countries with distant overseas territories (France, Netherlands, USA remote Pacific islands, etc.)
 * or antimeridian crossings (Russia, USA, Fiji, New Zealand), choose an optimal projection rotation
 * and focus feature for fitting so silhouettes never stretch awkwardly across 360°.
 */
const COUNTRY_ROTATION_OVERRIDES: Record<string, number> = {
  us: 100, // Rotate so Alaska + Continental US + Hawaii stay together cleanly on the left/center
  ru: -100, // Rotate so Chukotka doesn't split across the antimeridian
  fj: -178,
  nz: -172,
  ki: 170,
  fr: -2,
};

function createCountryProjection(
  country: MapCountry,
  width: number,
  height: number,
  padding: number
): GeoProjection {
  if (country.code === 'aq') {
    return geoStereographic()
      .rotate([0, 90])
      .fitExtent(
        [
          [padding, padding],
          [width - padding, height - padding],
        ],
        country.feature
      );
  }

  const mainland = getMainlandFeature(country.feature);
  const [lon, lat] = geoCentroid(mainland);
  const rotateLon =
    COUNTRY_ROTATION_OVERRIDES[country.code] !== undefined
      ? COUNTRY_ROTATION_OVERRIDES[country.code]
      : Number.isFinite(lon)
      ? -lon
      : 0;

  // For France (which includes French Guiana in South America in Natural Earth 50m),
  // fit to Metropolitan France + Corsica so the silhouette is immediately recognizable
  const fitTarget =
    country.code === 'fr' ? mainland : country.feature;

  const useMercator = Number.isFinite(lat) && Math.abs(lat) < 58 && country.code !== 'ru' && country.code !== 'ca' && country.code !== 'us';
  const projection = useMercator
    ? geoMercator().rotate([rotateLon, 0])
    : geoNaturalEarth1().rotate([rotateLon, 0]);

  return projection.fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    fitTarget
  );
}

function formatLabel(country: MapCountry, mode: MapLabelMode): string {
  const iso = country.code.toUpperCase();
  if (mode === 'iso') return iso;
  if (mode === 'both') return `${country.name} (${iso})`;
  return country.name;
}

function resolveFillAndStroke(config: MapStyleConfig): {
  fill: string;
  stroke: string;
  strokeWidth: number;
} {
  if (config.renderMode === 'outline') {
    return {
      fill: 'none',
      stroke: config.borderColor === '#ffffff' ? '#0f172a' : config.borderColor,
      strokeWidth: Math.max(config.borderWidth, 1.2),
    };
  }
  if (config.renderMode === 'silhouette') {
    return {
      fill: config.fillColor,
      stroke: 'none',
      strokeWidth: 0,
    };
  }
  return {
    fill: config.fillColor,
    stroke: config.showBorders ? config.borderColor : 'none',
    strokeWidth: config.showBorders ? config.borderWidth : 0,
  };
}

/**
 * Generates a standalone vector SVG for an individual country silhouette.
 */
export function generateCountryMapSvg(
  country: MapCountry,
  config: MapStyleConfig,
  options?: { width?: number; padding?: number }
): string {
  const baseWidth = options?.width ?? 800;
  const { width, height } = getMapDimensions(config.aspectRatio, baseWidth);
  const padding = options?.padding ?? Math.round(Math.min(width, height) * 0.1);

  const projection = createCountryProjection(country, width, height, padding);
  const pathGen = geoPath(projection);
  const targetFeature = country.code === 'fr' ? getMainlandFeature(country.feature) : country.feature;
  const d = pathGen(targetFeature) || '';

  const { fill, stroke, strokeWidth } = resolveFillAndStroke(config);
  const bgRect = config.transparentBackground
    ? ''
    : `<rect width="${width}" height="${height}" fill="${escapeXml(config.backgroundColor)}" />`;

  let labelSvg = '';
  if (config.showLabels) {
    const labelText = escapeXml(formatLabel(country, config.labelMode));
    const fontSize = Math.max(14, Math.round(width * 0.032));
    const textFill = config.renderMode === 'outline' ? '#0f172a' : '#0f172a';
    labelSvg = `<text x="${width / 2}" y="${height - Math.max(18, Math.round(padding * 0.45))}" text-anchor="middle" font-family="Plus Jakarta Sans, DM Sans, sans-serif" font-size="${fontSize}" font-weight="600" fill="${textFill}">${labelText}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(country.name)} map">${bgRect}<g id="country-${escapeXml(country.code)}"><path d="${d}" fill="${escapeXml(fill)}" stroke="${escapeXml(stroke)}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round" /></g>${labelSvg}</svg>`;
}

/**
 * Generates a lightweight thumbnail SVG path string for gallery cards.
 */
export function generateCountryThumbnailPath(
  country: MapCountry,
  width = 240,
  height = 170
): string {
  const projection = createCountryProjection(country, width, height, 14);
  const pathGen = geoPath(projection);
  const targetFeature = country.code === 'fr' ? getMainlandFeature(country.feature) : country.feature;
  return pathGen(targetFeature) || '';
}

/**
 * Generates a full World Map SVG with international boundaries.
 */
export function generateWorldMapSvg(
  countries: MapCountry[],
  config: MapStyleConfig,
  options?: { width?: number }
): string {
  const baseWidth = options?.width ?? 1200;
  const { width, height } = getMapDimensions(config.aspectRatio, baseWidth);
  const padding = Math.round(Math.min(width, height) * 0.04);

  const visibleCountries = config.includeAntarctica
    ? countries
    : countries.filter((c) => c.code !== 'aq');

  const collection: FeatureCollection = {
    type: 'FeatureCollection',
    features: visibleCountries.map((c) => c.feature),
  };

  const projection = geoNaturalEarth1().fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    collection
  );
  const pathGen = geoPath(projection);

  const { fill, stroke, strokeWidth } = resolveFillAndStroke(config);
  const bgRect = config.transparentBackground
    ? ''
    : `<rect width="${width}" height="${height}" fill="${escapeXml(config.backgroundColor)}" />`;

  const paths: string[] = [];
  const labels: string[] = [];

  for (const country of visibleCountries) {
    const d = pathGen(country.feature);
    if (!d) continue;
    paths.push(
      `<path id="country-${escapeXml(country.code)}" data-code="${escapeXml(country.code)}" data-name="${escapeXml(country.name)}" d="${d}" fill="${escapeXml(fill)}" stroke="${escapeXml(stroke)}" stroke-width="${strokeWidth}" stroke-linejoin="round" />`
    );

    if (config.showLabels) {
      const mainland = getMainlandFeature(country.feature);
      // Only label larger countries on world view to prevent illegible text collisions
      if (geoArea(mainland) > 0.0025) {
        const centroid = pathGen.centroid(mainland);
        if (Number.isFinite(centroid[0]) && Number.isFinite(centroid[1])) {
          const text = escapeXml(
            config.labelMode === 'iso' ? country.code.toUpperCase() : country.name
          );
          labels.push(
            `<text x="${centroid[0].toFixed(1)}" y="${centroid[1].toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="Plus Jakarta Sans, DM Sans, sans-serif" font-size="8.5" font-weight="600" fill="#0f172a" stroke="#ffffff" stroke-width="2.2" paint-order="stroke">${text}</text>`
          );
        }
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="World map">${bgRect}<g id="world-countries">${paths.join('')}</g>${labels.length ? `<g id="world-labels">${labels.join('')}</g>` : ''}</svg>`;
}

const CONTINENT_ROTATIONS: Record<MapContinent, number> = {
  Asia: -92,
  Europe: -15,
  Africa: -18,
  'North America': 98,
  'South America': 60,
  Oceania: -148,
};

/**
 * Generates an individual Continent Map SVG.
 */
export function generateContinentMapSvg(
  continent: MapContinent,
  allCountries: MapCountry[],
  config: MapStyleConfig,
  options?: { width?: number }
): string {
  const baseWidth = options?.width ?? 1200;
  const { width, height } = getMapDimensions(config.aspectRatio, baseWidth);
  const padding = Math.round(Math.min(width, height) * 0.06);

  const continentCountries = allCountries.filter((c) => c.continent === continent);

  // Use mainland features for fit computation so overseas territories (e.g. French Guiana in Europe)
  // don't distort continent framing
  const fitFeatures = continentCountries.map((c) =>
    c.code === 'fr' || c.code === 'nl' || c.code === 'no'
      ? getMainlandFeature(c.feature)
      : c.feature
  );

  const fitCollection: FeatureCollection = {
    type: 'FeatureCollection',
    features: fitFeatures,
  };

  const projection = geoNaturalEarth1()
    .rotate([CONTINENT_ROTATIONS[continent], 0])
    .fitExtent(
      [
        [padding, padding],
        [width - padding, height - padding],
      ],
      fitCollection
    );

  const pathGen = geoPath(projection);
  const { fill, stroke, strokeWidth } = resolveFillAndStroke(config);
  const bgRect = config.transparentBackground
    ? ''
    : `<rect width="${width}" height="${height}" fill="${escapeXml(config.backgroundColor)}" />`;

  const paths: string[] = [];
  const labels: string[] = [];

  for (const country of continentCountries) {
    const geomFeature =
      continent === 'Europe' && (country.code === 'fr' || country.code === 'nl')
        ? getMainlandFeature(country.feature)
        : country.feature;

    const d = pathGen(geomFeature);
    if (!d) continue;

    paths.push(
      `<path id="country-${escapeXml(country.code)}" data-code="${escapeXml(country.code)}" d="${d}" fill="${escapeXml(fill)}" stroke="${escapeXml(stroke)}" stroke-width="${strokeWidth}" stroke-linejoin="round" />`
    );

    if (config.showLabels) {
      const mainland = getMainlandFeature(geomFeature);
      if (geoArea(mainland) > 0.0004) {
        const centroid = pathGen.centroid(mainland);
        if (Number.isFinite(centroid[0]) && Number.isFinite(centroid[1])) {
          const text = escapeXml(formatLabel(country, config.labelMode));
          labels.push(
            `<text x="${centroid[0].toFixed(1)}" y="${centroid[1].toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="Plus Jakarta Sans, DM Sans, sans-serif" font-size="10" font-weight="600" fill="#0f172a" stroke="#ffffff" stroke-width="2.5" paint-order="stroke">${text}</text>`
          );
        }
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(continent)} map">${bgRect}<g id="continent-${escapeXml(continent.toLowerCase().replace(/\s+/g, '-'))}">${paths.join('')}</g>${labels.length ? `<g id="continent-labels">${labels.join('')}</g>` : ''}</svg>`;
}

/**
 * Generates a Custom Highlight World Map where selected countries are shown in highlightColor
 * and non-selected countries are shown in light grey baseColor.
 */
export function generateCustomHighlightMapSvg(
  countries: MapCountry[],
  highlightedCodes: Set<string>,
  config: MapStyleConfig,
  options?: { width?: number }
): string {
  const baseWidth = options?.width ?? 1200;
  const { width, height } = getMapDimensions(config.aspectRatio, baseWidth);
  const padding = Math.round(Math.min(width, height) * 0.04);

  const visibleCountries = config.includeAntarctica
    ? countries
    : countries.filter((c) => c.code !== 'aq');

  const collection: FeatureCollection = {
    type: 'FeatureCollection',
    features: visibleCountries.map((c) => c.feature),
  };

  const projection = geoNaturalEarth1().fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    collection
  );
  const pathGen = geoPath(projection);

  const bgRect = config.transparentBackground
    ? ''
    : `<rect width="${width}" height="${height}" fill="${escapeXml(config.backgroundColor)}" />`;

  const stroke = config.showBorders ? config.borderColor : 'none';
  const strokeWidth = config.showBorders ? config.borderWidth : 0;

  const basePaths: string[] = [];
  const highlightPaths: string[] = [];
  const rawLabels: { x: number; y: number; text: string }[] = [];

  for (const country of visibleCountries) {
    const d = pathGen(country.feature);
    if (!d) continue;
    const isHighlighted = highlightedCodes.has(country.code);
    const fill = isHighlighted ? config.highlightColor : config.baseColor;

    const pathEl = `<path id="country-${escapeXml(country.code)}" data-code="${escapeXml(country.code)}" data-highlighted="${isHighlighted}" d="${d}" fill="${escapeXml(fill)}" stroke="${escapeXml(stroke)}" stroke-width="${strokeWidth}" stroke-linejoin="round" />`;

    if (isHighlighted) {
      highlightPaths.push(pathEl);
    } else {
      basePaths.push(pathEl);
    }

    if (config.showLabels && isHighlighted) {
      const mainland = getMainlandFeature(country.feature);
      const centroid = pathGen.centroid(mainland);
      if (Number.isFinite(centroid[0]) && Number.isFinite(centroid[1])) {
        rawLabels.push({
          x: centroid[0],
          y: centroid[1],
          text: formatLabel(country, config.labelMode),
        });
      }
    }
  }

  // Collision-avoidance pass so nearby highlighted labels (e.g. UK + Germany) stay cleanly separated
  const placedBoxes: { left: number; right: number; top: number; bottom: number }[] = [];
  const labels: string[] = [];
  const sortedLabels = [...rawLabels].sort((a, b) => a.y - b.y || a.x - b.x);

  for (const item of sortedLabels) {
    const halfW = Math.max(24, item.text.length * 3.4);
    const halfH = 7.5;
    let y = item.y;

    for (let attempt = 0; attempt < 6; attempt++) {
      const box = {
        left: item.x - halfW,
        right: item.x + halfW,
        top: y - halfH,
        bottom: y + halfH,
      };
      const overlaps = placedBoxes.some(
        (b) => !(box.right < b.left || box.left > b.right || box.bottom < b.top || box.top > b.bottom)
      );
      if (!overlaps) {
        placedBoxes.push(box);
        break;
      }
      // Alternate nudging down then up to keep label anchored near its country
      const step = Math.ceil((attempt + 1) / 2) * 14;
      y = attempt % 2 === 0 ? item.y + step : item.y - step;
      if (attempt === 5) {
        placedBoxes.push({
          left: item.x - halfW,
          right: item.x + halfW,
          top: y - halfH,
          bottom: y + halfH,
        });
      }
    }

    labels.push(
      `<text x="${item.x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="Plus Jakarta Sans, DM Sans, sans-serif" font-size="11" font-weight="700" fill="#0f172a" stroke="#ffffff" stroke-width="3" paint-order="stroke">${escapeXml(item.text)}</text>`
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Custom highlighted world map">${bgRect}<g id="base-countries">${basePaths.join('')}</g><g id="highlighted-countries">${highlightPaths.join('')}</g>${labels.length ? `<g id="highlight-labels">${labels.join('')}</g>` : ''}</svg>`;
}

/**
 * Produces clean, presentation-ready filenames such as:
 * - India_Country_Only.svg
 * - India_With_State_Boundaries.svg
 * - India_With_State_Boundaries_2048px.png
 */
export function buildCountryMapFilename(
  countryName: string,
  withStateBoundaries: boolean,
  ext: 'svg' | 'png',
  resolution?: MapPngResolution
): string {
  const cleanName = countryName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const modeSuffix = withStateBoundaries ? 'With_State_Boundaries' : 'Country_Only';
  const sizeSuffix = ext === 'png' && resolution ? `_${resolution}px` : '';
  return `${cleanName || 'Country'}_${modeSuffix}${sizeSuffix}.${ext}`;
}

function roundSvgPath(d: string): string {
  if (!d) return '';
  return d.replace(/(-?\d+\.\d)\d+/g, '$1');
}

function sanitizeSvgId(raw: string): string {
  return raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Selects an optimal cartographic projection for rendering a country and its ADM1 subdivisions.
 * Uses Albers USA for the United States (clean 50 states + DC with Alaska/Hawaii insets),
 * Albers Conic for Canada, and centered Mercator/NaturalEarth1 for other countries.
 */
function createAdminProjection(
  alpha2: string,
  fitCollection: FeatureCollection<Polygon | MultiPolygon>,
  width: number,
  height: number,
  padding: number
): GeoProjection {
  const code = alpha2.toLowerCase();
  const extent: [[number, number], [number, number]] = [
    [padding, padding],
    [width - padding, height - padding],
  ];

  if (code === 'us') {
    return geoAlbersUsa().fitExtent(extent, fitCollection);
  }
  if (code === 'ca') {
    return geoAlbers().rotate([96, 0]).parallels([49, 77]).fitExtent(extent, fitCollection);
  }
  if (code === 'in') {
    return geoMercator().rotate([-82.5, 0]).fitExtent(extent, fitCollection);
  }
  if (code === 'au') {
    return geoMercator().rotate([-134, 0]).fitExtent(extent, fitCollection);
  }
  if (code === 'de') {
    return geoMercator().rotate([-10.5, 0]).fitExtent(extent, fitCollection);
  }
  if (code === 'br') {
    return geoMercator().rotate([53, 0]).fitExtent(extent, fitCollection);
  }
  if (code === 'aq') {
    return geoStereographic().rotate([0, 90]).fitExtent(extent, fitCollection);
  }

  const [lon, lat] = geoCentroid(fitCollection);
  const rotateLon =
    COUNTRY_ROTATION_OVERRIDES[code] !== undefined
      ? COUNTRY_ROTATION_OVERRIDES[code]
      : Number.isFinite(lon)
      ? -lon
      : 0;

  const useMercator = Number.isFinite(lat) && Math.abs(lat) < 58 && code !== 'ru';
  const projection = useMercator
    ? geoMercator().rotate([rotateLon, 0])
    : geoNaturalEarth1().rotate([rotateLon, 0]);

  return projection.fitExtent(extent, fitCollection);
}

/**
 * Generates a vector SVG of a country with its actual ADM1 administrative divisions
 * (states, provinces, regions, territories) from geoBoundaries.
 * - Zero labels are rendered unless `config.showStateLabels === true`.
 * - Every internal division is emitted as a genuine editable SVG `<path>` inside `#administrative-divisions`.
 * - Outer country boundary aligns precisely with the internal subdivision polygons.
 */
export function generateCountryWithStatesSvg(
  country: MapCountry,
  adminData: AdminBoundaryDataset,
  config: MapStyleConfig,
  options?: { width?: number; padding?: number }
): string {
  const baseWidth = options?.width ?? 900;
  const { width, height } = getMapDimensions(config.aspectRatio, baseWidth);
  const padding = options?.padding ?? Math.round(Math.min(width, height) * 0.08);

  const fitCollection: FeatureCollection<Polygon | MultiPolygon> = {
    type: 'FeatureCollection',
    features: adminData.divisions.map((d) => d.feature),
  };

  const projection = createAdminProjection(country.code, fitCollection, width, height, padding);
  const pathGen = geoPath(projection);

  const bgRect = config.transparentBackground
    ? ''
    : `<rect width="${width}" height="${height}" fill="${escapeXml(config.backgroundColor)}" />`;

  const isOutline = config.renderMode === 'outline';
  const isSilhouette = config.renderMode === 'silhouette';

  const fill = isOutline ? 'none' : config.fillColor;
  const stateStroke =
    config.stateBorderColor ||
    (isOutline ? '#64748b' : '#ffffff');
  const stateStrokeWidth = Math.max(0.3, config.stateBorderWidth ?? 0.75);

  const outerStroke =
    config.outerBorderColor ||
    (isOutline ? '#0f172a' : '#064e3b');
  const outerStrokeWidth = Math.max(0.5, config.outerBorderWidth ?? 1.5);
  const showOuterBorder = !isSilhouette && (config.showBorders !== false || isOutline);

  const divisionPaths: string[] = [];
  const haloPaths: string[] = [];
  const rawLabels: { x: number; y: number; text: string; area: number }[] = [];

  for (const division of adminData.divisions) {
    const rawD = pathGen(division.feature);
    if (!rawD) continue;
    const d = roundSvgPath(rawD);
    if (!d) continue;

    const divId = sanitizeSvgId(division.iso || division.name || division.id);
    divisionPaths.push(
      `<path id="adm1-${escapeXml(divId)}" data-name="${escapeXml(division.name)}"${
        division.iso ? ` data-iso="${escapeXml(division.iso)}"` : ''
      } d="${d}" fill="${escapeXml(fill)}" stroke="${escapeXml(stateStroke)}" stroke-width="${stateStrokeWidth}" stroke-linejoin="round" stroke-linecap="round" />`
    );

    if (showOuterBorder && !adminData.adm0Feature && !isOutline) {
      haloPaths.push(
        `<path d="${d}" fill="none" stroke="${escapeXml(outerStroke)}" stroke-width="${(
          outerStrokeWidth * 2
        ).toFixed(2)}" stroke-linejoin="round" stroke-linecap="round" />`
      );
    }

    if (config.showStateLabels) {
      const mainland = getMainlandFeature(division.feature);
      const centroid = pathGen.centroid(mainland);
      if (Number.isFinite(centroid[0]) && Number.isFinite(centroid[1])) {
        rawLabels.push({
          x: centroid[0],
          y: centroid[1],
          text: division.name,
          area: geoArea(mainland),
        });
      }
    }
  }

  // Outer boundary layer: exact ADM0 stroke on top when available, or outer stroke halo underneath opaque fills
  let outerBorderUnder = '';
  let outerBorderOver = '';

  if (showOuterBorder) {
    if (adminData.adm0Feature) {
      const adm0Raw = pathGen(adminData.adm0Feature);
      if (adm0Raw) {
        const adm0D = roundSvgPath(adm0Raw);
        outerBorderOver = `<g id="country-outer-border"><path id="country-outline-${escapeXml(
          country.code
        )}" d="${adm0D}" fill="none" stroke="${escapeXml(
          outerStroke
        )}" stroke-width="${outerStrokeWidth}" stroke-linejoin="round" stroke-linecap="round" /></g>`;
      }
    } else if (haloPaths.length > 0) {
      outerBorderUnder = `<g id="country-outer-border">${haloPaths.join('')}</g>`;
    }
  }

  // Optional state/province labels (disabled by default; collision-avoiding when enabled)
  let stateLabelsGroup = '';
  if (config.showStateLabels && rawLabels.length > 0) {
    const placedBoxes: { left: number; right: number; top: number; bottom: number }[] = [];
    const labelEls: string[] = [];
    // Prioritize larger divisions first so major states anchor cleanly and tiny territories don't collide
    const sorted = [...rawLabels].sort((a, b) => b.area - a.area);
    const fontSize = Math.max(8, Math.round(width * 0.011));

    for (const item of sorted) {
      const halfW = Math.max(16, item.text.length * (fontSize * 0.31));
      const halfH = fontSize * 0.62;
      const box = {
        left: item.x - halfW,
        right: item.x + halfW,
        top: item.y - halfH,
        bottom: item.y + halfH,
      };
      const overlaps = placedBoxes.some(
        (b) => !(box.right < b.left || box.left > b.right || box.bottom < b.top || box.top > b.bottom)
      );
      if (overlaps) continue;
      placedBoxes.push(box);
      labelEls.push(
        `<text x="${item.x.toFixed(1)}" y="${item.y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="Plus Jakarta Sans, DM Sans, sans-serif" font-size="${fontSize}" font-weight="600" fill="#0f172a" stroke="#ffffff" stroke-width="2.4" paint-order="stroke">${escapeXml(
          item.text
        )}</text>`
      );
    }
    if (labelEls.length > 0) {
      stateLabelsGroup = `<g id="administrative-labels">${labelEls.join('')}</g>`;
    }
  }

  // Optional country title label (off by default)
  let countryTitleSvg = '';
  if (config.showLabels) {
    const labelText = escapeXml(formatLabel(country, config.labelMode));
    const fontSize = Math.max(14, Math.round(width * 0.03));
    countryTitleSvg = `<text x="${width / 2}" y="${
      height - Math.max(16, Math.round(padding * 0.38))
    }" text-anchor="middle" font-family="Plus Jakarta Sans, DM Sans, sans-serif" font-size="${fontSize}" font-weight="600" fill="#0f172a">${labelText}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(
    country.name
  )} map with ${escapeXml(adminData.metadata.canonicalType)}">${bgRect}${outerBorderUnder}<g id="administrative-divisions">${divisionPaths.join(
    ''
  )}</g>${outerBorderOver}${stateLabelsGroup}${countryTitleSvg}</svg>`;
}

/**
 * Unified single-country detail renderer supporting both:
 * - Mode 1: Country Only (default, zero internal boundaries)
 * - Mode 2: Country + States/Provinces (genuine ADM1 vector paths from geoBoundaries)
 */
export function generateCountryDetailSvg(
  country: MapCountry,
  adminData: AdminBoundaryDataset | null,
  config: MapStyleConfig,
  options?: { width?: number; padding?: number }
): string {
  if (config.showStateBoundaries && adminData && adminData.divisions.length > 0) {
    return generateCountryWithStatesSvg(country, adminData, config, options);
  }

  // Mode 1: Country Only — if ADM0 was already loaded for this country, project it with identical framing
  // so toggling between Country Only and Country + States never shifts the silhouette!
  if (adminData?.adm0Feature) {
    const baseWidth = options?.width ?? 900;
    const { width, height } = getMapDimensions(config.aspectRatio, baseWidth);
    const padding = options?.padding ?? Math.round(Math.min(width, height) * 0.08);

    const fitCollection: FeatureCollection<Polygon | MultiPolygon> = {
      type: 'FeatureCollection',
      features: adminData.divisions.map((d) => d.feature),
    };
    const projection = createAdminProjection(country.code, fitCollection, width, height, padding);
    const pathGen = geoPath(projection);
    const d = roundSvgPath(pathGen(adminData.adm0Feature) || '');

    const { fill, stroke, strokeWidth } = resolveFillAndStroke(config);
    const bgRect = config.transparentBackground
      ? ''
      : `<rect width="${width}" height="${height}" fill="${escapeXml(config.backgroundColor)}" />`;

    let labelSvg = '';
    if (config.showLabels) {
      const labelText = escapeXml(formatLabel(country, config.labelMode));
      const fontSize = Math.max(14, Math.round(width * 0.03));
      labelSvg = `<text x="${width / 2}" y="${
        height - Math.max(16, Math.round(padding * 0.38))
      }" text-anchor="middle" font-family="Plus Jakarta Sans, DM Sans, sans-serif" font-size="${fontSize}" font-weight="600" fill="#0f172a">${labelText}</text>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(
      country.name
    )} map">${bgRect}<g id="country-${escapeXml(
      country.code
    )}"><path d="${d}" fill="${escapeXml(fill)}" stroke="${escapeXml(
      stroke
    )}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round" /></g>${labelSvg}</svg>`;
  }

  return generateCountryMapSvg(country, config, options);
}

/**
 * Exports any generated SVG map to a transparent or styled PNG at 512px, 1024px, 2048px, or 4096px.
 */
export async function downloadMapPng(
  svgString: string,
  filename: string,
  resolutionWidth: MapPngResolution,
  aspectRatio: MapAspectRatio
): Promise<void> {
  const { width, height } = getMapDimensions(aspectRatio, resolutionWidth);
  const blob = await svgToPngBlob(svgString, width, height);
  downloadFile(blob, filename);
}
