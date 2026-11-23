import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from 'geojson';
import worldAtlas50m from 'world-atlas/countries-50m.json';
import { COUNTRIES, type CountryFlag } from './countries';
import { ISO_NUMERIC_TO_ALPHA2, NAME_TO_ALPHA2_OVERRIDES } from './isoNumericMap';

export interface MapCountry {
  code: string;
  numericId: string | null;
  name: string;
  continent: string;
  capital?: string;
  aliases?: string[];
  feature: Feature<Polygon | MultiPolygon>;
}

export const MAP_CONTINENTS = [
  'Asia',
  'Europe',
  'Africa',
  'North America',
  'South America',
  'Oceania',
] as const;

export type MapContinent = (typeof MAP_CONTINENTS)[number];

const countryMetaByCode = new Map<string, CountryFlag>(
  COUNTRIES.map((c) => [c.code.toLowerCase(), c])
);

function padNumericId(id: string | number | undefined): string | null {
  if (id === undefined || id === null || id === '') return null;
  return String(id).padStart(3, '0');
}

function mergeGeometries(
  existing: Feature<Polygon | MultiPolygon>,
  incoming: Feature<Polygon | MultiPolygon>
): Feature<MultiPolygon> {
  const toPolygons = (geom: Polygon | MultiPolygon) =>
    geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  return {
    type: 'Feature',
    id: existing.id,
    properties: existing.properties,
    geometry: {
      type: 'MultiPolygon',
      coordinates: [...toPolygons(existing.geometry), ...toPolygons(incoming.geometry)],
    },
  };
}

let cachedMapCountries: MapCountry[] | null = null;

export function getMapCountries(): MapCountry[] {
  if (cachedMapCountries) return cachedMapCountries;

  const topology = worldAtlas50m as unknown as Topology<{
    countries: GeometryCollection<{ name?: string }>;
  }>;
  const geo = feature(topology, topology.objects.countries) as unknown as FeatureCollection<
    Geometry,
    { name?: string }
  >;

  const byCode = new Map<string, MapCountry>();

  for (const feat of geo.features) {
    if (
      !feat.geometry ||
      (feat.geometry.type !== 'Polygon' && feat.geometry.type !== 'MultiPolygon')
    ) {
      continue;
    }

    const rawName = feat.properties?.name || 'Unknown Territory';
    const numericId = padNumericId(feat.id);

    // Skip tiny disputed glacier/unmapped sub-territories without ISO codes unless explicitly mapped
    const alpha2 =
      (numericId ? ISO_NUMERIC_TO_ALPHA2[numericId] : undefined) ||
      NAME_TO_ALPHA2_OVERRIDES[rawName];

    if (!alpha2) continue;

    // Skip non-ISO disputed regions that don't have flag-icons entries except Kosovo (xk)
    const meta = countryMetaByCode.get(alpha2);
    if (!meta && alpha2 !== 'xk') continue;

    const typedFeature = feat as Feature<Polygon | MultiPolygon>;
    const existing = byCode.get(alpha2);

    if (existing) {
      // Combine duplicate numeric entries (e.g., Ashmore and Cartier Is. with Australia 036)
      existing.feature = mergeGeometries(existing.feature, typedFeature);
      continue;
    }

    const name = meta?.name || rawName;
    const continent = meta?.continent || 'Other';

    byCode.set(alpha2, {
      code: alpha2,
      numericId,
      name,
      continent,
      capital: meta?.capital,
      aliases: meta?.aliases,
      feature: typedFeature,
    });
  }

  cachedMapCountries = Array.from(byCode.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  return cachedMapCountries;
}

export function getMapCountryByCode(code: string): MapCountry | undefined {
  const normalized = code.toLowerCase();
  return getMapCountries().find((c) => c.code === normalized);
}

export function filterMapCountries(
  countries: MapCountry[],
  options: {
    continent: string;
    searchQuery: string;
    sortOrder: 'asc' | 'desc';
  }
): MapCountry[] {
  const { continent, searchQuery, sortOrder } = options;
  let result = countries;

  if (continent !== 'All') {
    result = result.filter((c) => c.continent === continent);
  }

  const q = searchQuery.trim().toLowerCase();
  if (q !== '') {
    result = result.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true;
      if (c.code.toLowerCase().includes(q)) return true;
      if (c.capital && c.capital.toLowerCase().includes(q)) return true;
      if (c.aliases && c.aliases.some((alias) => alias.includes(q))) return true;
      return false;
    });
  }

  return [...result].sort((a, b) =>
    sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
  );
}
