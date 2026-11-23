import { geoArea } from 'd3-geo';
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson';

export interface AdminDivisionFeature {
  id: string;
  name: string;
  iso: string;
  feature: Feature<Polygon | MultiPolygon>;
}

export interface AdminBoundaryMetadata {
  iso3: string;
  countryName: string;
  canonicalType: string;
  unitCount: number;
  source: string;
  license: string;
  year: string;
}

export interface AdminBoundaryDataset {
  alpha2: string;
  iso3: string;
  metadata: AdminBoundaryMetadata;
  divisions: AdminDivisionFeature[];
  adm0Feature: Feature<Polygon | MultiPolygon> | null;
}

export type AdminBoundaryResult =
  | { status: 'ready'; dataset: AdminBoundaryDataset }
  | { status: 'unavailable'; reason: string };

/**
 * Complete ISO 3166-1 alpha-2 to alpha-3 mapping for geoBoundaries (gbOpen) lookups.
 */
export const ALPHA2_TO_ALPHA3: Record<string, string> = {
  af: 'AFG', al: 'ALB', aq: 'ATA', dz: 'DZA', as: 'ASM', ad: 'AND', ao: 'AGO', ag: 'ATG',
  az: 'AZE', ar: 'ARG', au: 'AUS', at: 'AUT', bs: 'BHS', bh: 'BHR', bd: 'BGD', am: 'ARM',
  bb: 'BRB', be: 'BEL', bm: 'BMU', bt: 'BTN', bo: 'BOL', ba: 'BIH', bw: 'BWA', bv: 'BVT',
  br: 'BRA', bz: 'BLZ', io: 'IOT', sb: 'SLB', vg: 'VGB', bn: 'BRN', bg: 'BGR', mm: 'MMR',
  bi: 'BDI', by: 'BLR', kh: 'KHM', cm: 'CMR', ca: 'CAN', cv: 'CPV', ky: 'CYM', cf: 'CAF',
  lk: 'LKA', td: 'TCD', cl: 'CHL', cn: 'CHN', tw: 'TWN', cx: 'CXR', cc: 'CCK', co: 'COL',
  km: 'COM', yt: 'MYT', cg: 'COG', cd: 'COD', ck: 'COK', cr: 'CRI', hr: 'HRV', cu: 'CUB',
  cy: 'CYP', cz: 'CZE', bj: 'BEN', dk: 'DNK', dm: 'DMA', do: 'DOM', ec: 'ECU', sv: 'SLV',
  gq: 'GNQ', et: 'ETH', er: 'ERI', ee: 'EST', fo: 'FRO', fk: 'FLK', gs: 'SGS', fj: 'FJI',
  fi: 'FIN', ax: 'ALA', fr: 'FRA', gf: 'GUF', pf: 'PYF', tf: 'ATF', dj: 'DJI', ga: 'GAB',
  ge: 'GEO', gm: 'GMB', ps: 'PSE', de: 'DEU', gh: 'GHA', gi: 'GIB', ki: 'KIR', gr: 'GRC',
  gl: 'GRL', gd: 'GRD', gp: 'GLP', gu: 'GUM', gt: 'GTM', gn: 'GIN', gy: 'GUY', ht: 'HTI',
  hm: 'HMD', va: 'VAT', hn: 'HND', hk: 'HKG', hu: 'HUN', is: 'ISL', in: 'IND', id: 'IDN',
  ir: 'IRN', iq: 'IRQ', ie: 'IRL', il: 'ISR', it: 'ITA', ci: 'CIV', jm: 'JAM', jp: 'JPN',
  kz: 'KAZ', jo: 'JOR', ke: 'KEN', kp: 'PRK', kr: 'KOR', kw: 'KWT', kg: 'KGZ', la: 'LAO',
  lb: 'LBN', ls: 'LSO', lv: 'LVA', lr: 'LBR', ly: 'LBY', li: 'LIE', lt: 'LTU', lu: 'LUX',
  mo: 'MAC', mg: 'MDG', mw: 'MWI', my: 'MYS', mv: 'MDV', ml: 'MLI', mt: 'MLT', mq: 'MTQ',
  mr: 'MRT', mu: 'MUS', mx: 'MEX', mc: 'MCO', mn: 'MNG', md: 'MDA', me: 'MNE', ms: 'MSR',
  ma: 'MAR', mz: 'MOZ', om: 'OMN', na: 'NAM', nr: 'NRU', np: 'NPL', nl: 'NLD', cw: 'CUW',
  aw: 'ABW', sx: 'SXM', bq: 'BES', nc: 'NCL', vu: 'VUT', nz: 'NZL', ni: 'NIC', ne: 'NER',
  ng: 'NGA', nu: 'NIU', nf: 'NFK', no: 'NOR', mp: 'MNP', um: 'UMI', fm: 'FSM', mh: 'MHL',
  pw: 'PLW', pk: 'PAK', pa: 'PAN', pg: 'PNG', py: 'PRY', pe: 'PER', ph: 'PHL', pn: 'PCN',
  pl: 'POL', pt: 'PRT', gw: 'GNB', tl: 'TLS', pr: 'PRI', qa: 'QAT', re: 'REU', ro: 'ROU',
  ru: 'RUS', rw: 'RWA', bl: 'BLM', sh: 'SHN', kn: 'KNA', ai: 'AIA', lc: 'LCA', mf: 'MAF',
  pm: 'SPM', vc: 'VCT', sm: 'SMR', st: 'STP', sa: 'SAU', sn: 'SEN', rs: 'SRB', sc: 'SYC',
  sl: 'SLE', sg: 'SGP', sk: 'SVK', vn: 'VNM', si: 'SVN', so: 'SOM', za: 'ZAF', zw: 'ZWE',
  es: 'ESP', ss: 'SSD', sd: 'SDN', eh: 'ESH', sr: 'SUR', sj: 'SJM', sz: 'SWZ', se: 'SWE',
  ch: 'CHE', sy: 'SYR', tj: 'TJK', th: 'THA', tg: 'TGO', tk: 'TKL', to: 'TON', tt: 'TTO',
  ae: 'ARE', tn: 'TUN', tr: 'TUR', tm: 'TKM', tc: 'TCA', tv: 'TUV', ug: 'UGA', ua: 'UKR',
  mk: 'MKD', eg: 'EGY', gb: 'GBR', gg: 'GGY', je: 'JEY', im: 'IMN', tz: 'TZA', us: 'USA',
  vi: 'VIR', bf: 'BFA', uy: 'URY', uz: 'UZB', ve: 'VEN', wf: 'WLF', ws: 'WSM', ye: 'YEM',
  zm: 'ZMB', xk: 'XKX',
};

/**
 * Curated administrative division classifications respecting each country's official terminology.
 * Falls back to geoBoundaries' live `boundaryCanonical` value for all other countries.
 */
const COUNTRY_ADMIN_CLASSIFICATION: Record<string, string> = {
  in: 'States & Union Territories',
  us: 'States & District of Columbia',
  ca: 'Provinces & Territories',
  au: 'States & Territories',
  de: 'Federal States (Länder)',
  br: 'States & Federal District',
  cn: 'Provincial-Level Divisions',
  gb: 'Nations & Regions',
  fr: 'Regions',
  it: 'Regions',
  es: 'Autonomous Communities',
  jp: 'Prefectures',
  mx: 'States',
  ru: 'Federal Subjects',
  ch: 'Cantons',
  nl: 'Provinces',
  za: 'Provinces',
  ar: 'Provinces',
  id: 'Provinces',
  pk: 'Provinces & Territories',
  ng: 'States',
  tr: 'Provinces',
  kr: 'Provinces & Metropolitan Cities',
  nz: 'Regions',
};

export function getAdminClassificationLabel(alpha2: string, apiCanonical?: string): string {
  const code = alpha2.toLowerCase();
  if (COUNTRY_ADMIN_CLASSIFICATION[code]) {
    return COUNTRY_ADMIN_CLASSIFICATION[code];
  }
  if (apiCanonical && apiCanonical.trim() && apiCanonical.toLowerCase() !== 'nan') {
    return apiCanonical.trim();
  }
  return 'Administrative Divisions';
}

export function getIso3FromAlpha2(alpha2: string): string | null {
  return ALPHA2_TO_ALPHA3[alpha2.toLowerCase()] || null;
}

// Distant overseas territories excluded from mainland ADM1 framing so primary country divisions fill the viewport cleanly
const USA_EXCLUDED_TERRITORIES = new Set([
  'Guam',
  'American Samoa',
  'Puerto Rico',
  'United States Virgin Islands',
  'Commonwealth of the Northern Mariana Islands',
]);

const FRANCE_OVERSEAS_REGIONS = new Set([
  'Guyane',
  'Guadeloupe',
  'Martinique',
  'La Réunion',
  'Réunion',
  'Mayotte',
]);

function ringSpan(ring: Position[]): number {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < ring.length; i++) {
    const x = ring[i][0];
    const y = ring[i][1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return Math.max(maxX - minX, maxY - minY);
}

function simplifyRing(ring: Position[], minDeg: number): Position[] | null {
  if (ring.length <= 4) return ring;
  const minSq = minDeg * minDeg;
  const out: Position[] = [ring[0]];
  let last = ring[0];
  for (let i = 1; i < ring.length - 1; i++) {
    const pt = ring[i];
    const dx = pt[0] - last[0];
    const dy = pt[1] - last[1];
    if (dx * dx + dy * dy >= minSq) {
      out.push(pt);
      last = pt;
    }
  }
  out.push(ring[ring.length - 1]);
  return out.length >= 4 ? out : null;
}

const TWO_PI = 2 * Math.PI;

/**
 * Ensures spherical ring winding matches d3-geo's convention:
 * - Exterior rings: clockwise (standalone spherical geoArea < 2π)
 * - Interior holes: counter-clockwise (standalone spherical geoArea > 2π)
 * RFC 7946 GeoJSON (including geoBoundaries) uses the opposite winding order,
 * which otherwise causes d3-geo to invert polygons over the entire globe.
 */
function ensureD3Winding(ring: Position[], isHole: boolean): Position[] {
  const area = geoArea({ type: 'Polygon', coordinates: [ring] });
  const needsReverse = isHole ? area < TWO_PI : area > TWO_PI;
  return needsReverse ? [...ring].reverse() : ring;
}

/**
 * Computes a fast adaptive simplification over raw GeoJSON features so huge datasets
 * (e.g. Canada's 26MB Arctic coastlines) render in <100ms and export crisp PowerPoint-ready SVGs
 * while keeping every administrative division geographically accurate.
 */
export function optimizeAdminFeatures(
  rawFeatures: Feature[],
  alpha2: string
): AdminDivisionFeature[] {
  const code = alpha2.toLowerCase();

  // Filter to valid Polygon/MultiPolygon geometries belonging to the country's primary extent
  const validFeatures: Feature<Polygon | MultiPolygon>[] = [];
  for (const feat of rawFeatures) {
    if (
      !feat.geometry ||
      (feat.geometry.type !== 'Polygon' && feat.geometry.type !== 'MultiPolygon')
    ) {
      continue;
    }
    const name = String(feat.properties?.shapeName || feat.properties?.NAME_1 || '').trim();
    if (code === 'us' && USA_EXCLUDED_TERRITORIES.has(name)) continue;
    if (code === 'au' && name === 'Other Territories') continue;
    if (code === 'fr' && FRANCE_OVERSEAS_REGIONS.has(name)) continue;

    validFeatures.push(feat as Feature<Polygon | MultiPolygon>);
  }

  // Measure vertex density and geographic span (clamped so antimeridian/islands never over-simplify)
  let totalPts = 0;
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  const scanRing = (ring: Position[]) => {
    totalPts += ring.length;
    for (let i = 0; i < ring.length; i++) {
      const x = ring[i][0];
      const y = ring[i][1];
      if (x < minLon) minLon = x;
      if (x > maxLon) maxLon = x;
      if (y < minLat) minLat = y;
      if (y > maxLat) maxLat = y;
    }
  };

  for (const feat of validFeatures) {
    if (feat.geometry.type === 'Polygon') {
      feat.geometry.coordinates.forEach(scanRing);
    } else {
      feat.geometry.coordinates.forEach((poly) => poly.forEach(scanRing));
    }
  }

  const rawSpan = Math.max(maxLon - minLon, maxLat - minLat);
  const clampedSpan = Number.isFinite(rawSpan) ? Math.min(Math.max(rawSpan, 0.5), 75) : 20;

  const minDeg =
    totalPts > 120000
      ? clampedSpan * 0.0014
      : totalPts > 40000
      ? clampedSpan * 0.0008
      : totalPts > 12000
      ? clampedSpan * 0.00045
      : clampedSpan * 0.00018;

  const minIslandSpan = totalPts > 120000 ? clampedSpan * 0.0032 : 0;

  return validFeatures.map((feat, index) => {
    const props = (feat.properties || {}) as Record<string, unknown>;
    const rawName = String(props.shapeName || props.NAME_1 || props.name || `Division ${index + 1}`).trim();
    const rawIso = String(props.shapeISO || props.HASC_1 || '').trim();
    const rawId = String(props.shapeID || `${code}-adm1-${index + 1}`);

    const simplifyPoly = (poly: Position[][], isLargest: boolean): Position[][] | null => {
      if (!isLargest && minIslandSpan > 0 && ringSpan(poly[0]) < minIslandSpan) {
        return null;
      }
      const outer = simplifyRing(poly[0], minDeg);
      if (!outer) {
        if (!isLargest) return null;
        return [
          ensureD3Winding(poly[0], false),
          ...poly.slice(1).map((h) => ensureD3Winding(h, true)),
        ];
      }
      const holes: Position[][] = [];
      for (let h = 1; h < poly.length; h++) {
        if (minIslandSpan > 0 && ringSpan(poly[h]) < minIslandSpan) continue;
        const sh = simplifyRing(poly[h], minDeg);
        if (sh) holes.push(ensureD3Winding(sh, true));
      }
      return [ensureD3Winding(outer, false), ...holes];
    };

    let geometry: Polygon | MultiPolygon = feat.geometry;
    if (feat.geometry.type === 'Polygon') {
      const p = simplifyPoly(feat.geometry.coordinates, true);
      if (p) geometry = { type: 'Polygon', coordinates: p };
    } else {
      let bestIdx = 0;
      let bestSpan = -1;
      feat.geometry.coordinates.forEach((poly, idx) => {
        const s = ringSpan(poly[0]);
        if (s > bestSpan) {
          bestSpan = s;
          bestIdx = idx;
        }
      });
      const kept: Position[][][] = [];
      feat.geometry.coordinates.forEach((poly, idx) => {
        const p = simplifyPoly(poly, idx === bestIdx);
        if (p) kept.push(p);
      });
      if (kept.length > 0) {
        geometry = { type: 'MultiPolygon', coordinates: kept };
      }
    }

    return {
      id: rawId,
      name: rawName,
      iso: rawIso,
      feature: {
        type: 'Feature',
        properties: { shapeName: rawName, shapeISO: rawIso, shapeID: rawId },
        geometry,
      },
    };
  });
}

function optimizeAdm0Feature(
  fc: FeatureCollection,
  alpha2: string
): Feature<Polygon | MultiPolygon> | null {
  const optimized = optimizeAdminFeatures(fc.features, alpha2);
  if (optimized.length === 0) return null;
  if (optimized.length === 1) return optimized[0].feature;

  const polygons: Position[][][] = [];
  for (const item of optimized) {
    if (item.feature.geometry.type === 'Polygon') {
      polygons.push(item.feature.geometry.coordinates);
    } else {
      polygons.push(...item.feature.geometry.coordinates);
    }
  }
  return {
    type: 'Feature',
    properties: optimized[0].feature.properties,
    geometry: { type: 'MultiPolygon', coordinates: polygons },
  };
}

// Session-level memory cache & in-flight request deduplication
const adminDatasetCache = new Map<string, AdminBoundaryResult>();
const inFlightRequests = new Map<string, Promise<AdminBoundaryResult>>();

interface GeoBoundariesApiMeta {
  boundaryName?: string;
  boundaryISO?: string;
  boundaryCanonical?: string;
  boundarySource?: string;
  boundaryLicense?: string;
  boundaryYearRepresented?: string;
  admUnitCount?: string | number;
  simplifiedGeometryGeoJSON?: string;
  gjDownloadURL?: string;
}

export function getCachedAdminBoundaries(alpha2: string): AdminBoundaryResult | undefined {
  return adminDatasetCache.get(alpha2.toLowerCase());
}

export function clearAdminBoundariesCache(): void {
  adminDatasetCache.clear();
  inFlightRequests.clear();
}

/**
 * Rewrites `https://github.com/<owner>/<repo>/raw/<path>` URLs returned by the geoBoundaries API
 * to `https://media.githubusercontent.com/media/<owner>/<repo>/<path>`, bypassing GitHub's 302
 * LFS redirect (which strips CORS headers in browsers) and hitting GitHub's CORS-enabled media CDN directly.
 */
export function resolveCorsGeoJsonUrl(url: string): string {
  return url.replace(
    /^https:\/\/github\.com\/([^/]+\/[^/]+)\/raw\//i,
    'https://media.githubusercontent.com/media/$1/'
  );
}

/**
 * Lazily fetches ADM1 (and lightweight ADM0 when available) administrative boundaries
 * for a single country from geoBoundaries (https://www.geoboundaries.org/) and caches
 * the optimized dataset for the duration of the session.
 */
export async function fetchAdminBoundaries(alpha2: string): Promise<AdminBoundaryResult> {
  const code = alpha2.toLowerCase();
  const cached = adminDatasetCache.get(code);
  if (cached) return cached;

  const existingPromise = inFlightRequests.get(code);
  if (existingPromise) return existingPromise;

  const task = (async (): Promise<AdminBoundaryResult> => {
    const iso3 = getIso3FromAlpha2(code);
    if (!iso3 || !/^[A-Z]{3}$/.test(iso3)) {
      const result: AdminBoundaryResult = {
        status: 'unavailable',
        reason: 'State or province administrative boundary data is not available for this territory.',
      };
      adminDatasetCache.set(code, result);
      return result;
    }

    try {
      const metaRes = await fetch(
        `https://www.geoboundaries.org/api/current/gbOpen/${iso3}/ADM1/`
      );

      if (!metaRes.ok) {
        const result: AdminBoundaryResult = {
          status: 'unavailable',
          reason: `State/province boundaries (ADM1) are not available in geoBoundaries for this country.`,
        };
        adminDatasetCache.set(code, result);
        return result;
      }

      const meta = (await metaRes.json()) as GeoBoundariesApiMeta;
      const rawGeoUrl = meta.simplifiedGeometryGeoJSON || meta.gjDownloadURL;

      if (!rawGeoUrl) {
        const result: AdminBoundaryResult = {
          status: 'unavailable',
          reason: 'Administrative boundary geometry is currently unavailable for this country.',
        };
        adminDatasetCache.set(code, result);
        return result;
      }

      const geoUrl = resolveCorsGeoJsonUrl(rawGeoUrl);

      // Fetch ADM1 GeoJSON, plus optionally fetch ADM0 if lightweight (< 2.5 MB) for crisp outline-only mode
      const adm1Promise = fetch(geoUrl).then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch ADM1 GeoJSON (${r.status})`);
        return r.json() as Promise<FeatureCollection>;
      });

      const adm0Promise = fetch(
        `https://www.geoboundaries.org/api/current/gbOpen/${iso3}/ADM0/`
      )
        .then(async (res) => {
          if (!res.ok) return null;
          const m0 = (await res.json()) as GeoBoundariesApiMeta;
          const rawUrl0 = m0.simplifiedGeometryGeoJSON;
          if (!rawUrl0) return null;
          const url0 = resolveCorsGeoJsonUrl(rawUrl0);
          // Check Content-Length via HEAD so huge ADM0 files (e.g. Canada 13.8MB) are skipped cleanly
          try {
            const head = await fetch(url0, { method: 'HEAD' });
            const len = Number(head.headers.get('content-length') || '0');
            if (len > 2_500_000) return null;
          } catch {
            // If HEAD fails, skip optional ADM0 to stay fast
            return null;
          }
          const gj0Res = await fetch(url0);
          if (!gj0Res.ok) return null;
          const gj0 = (await gj0Res.json()) as FeatureCollection;
          return optimizeAdm0Feature(gj0, code);
        })
        .catch(() => null);

      const [adm1GeoJson, adm0Feature] = await Promise.all([adm1Promise, adm0Promise]);

      if (
        !adm1GeoJson ||
        adm1GeoJson.type !== 'FeatureCollection' ||
        !Array.isArray(adm1GeoJson.features) ||
        adm1GeoJson.features.length === 0
      ) {
        const result: AdminBoundaryResult = {
          status: 'unavailable',
          reason: 'No internal administrative divisions were found for this country.',
        };
        adminDatasetCache.set(code, result);
        return result;
      }

      const divisions = optimizeAdminFeatures(adm1GeoJson.features, code);
      if (divisions.length === 0) {
        const result: AdminBoundaryResult = {
          status: 'unavailable',
          reason: 'Administrative division geometry could not be parsed for this country.',
        };
        adminDatasetCache.set(code, result);
        return result;
      }

      const dataset: AdminBoundaryDataset = {
        alpha2: code,
        iso3,
        metadata: {
          iso3,
          countryName: meta.boundaryName || code.toUpperCase(),
          canonicalType: getAdminClassificationLabel(code, meta.boundaryCanonical),
          unitCount: divisions.length,
          source: meta.boundarySource || 'geoBoundaries',
          license: meta.boundaryLicense || 'CC BY 4.0 / Open License',
          year: String(meta.boundaryYearRepresented || ''),
        },
        divisions,
        adm0Feature,
      };

      const result: AdminBoundaryResult = { status: 'ready', dataset };
      adminDatasetCache.set(code, result);
      return result;
    } catch {
      return {
        status: 'unavailable',
        reason:
          'Unable to load administrative boundaries right now. Please check your connection and try again.',
      };
    } finally {
      inFlightRequests.delete(code);
    }
  })();

  inFlightRequests.set(code, task);
  return task;
}
