import test from 'node:test';
import assert from 'node:assert/strict';
import { geoArea } from 'd3-geo';
import type { Feature, Polygon } from 'geojson';
import {
  getIso3FromAlpha2,
  getAdminClassificationLabel,
  optimizeAdminFeatures,
  resolveCorsGeoJsonUrl,
  type AdminBoundaryDataset,
} from '../data/adminBoundaries';
import {
  DEFAULT_MAP_STYLE,
  buildCountryMapFilename,
  generateCountryWithStatesSvg,
  generateCountryDetailSvg,
} from './mapRenderer';
import type { MapCountry } from '../data/worldMaps';

function makeRfc7946RectFeature(
  name: string,
  iso: string,
  minLon: number,
  minLat: number,
  maxLon: number,
  maxLat: number
): Feature<Polygon> {
  // RFC 7946 counter-clockwise exterior ring (just like geoBoundaries GeoJSON)
  return {
    type: 'Feature',
    properties: { shapeName: name, shapeISO: iso, shapeID: `id-${iso}` },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [minLon, minLat],
          [maxLon, minLat],
          [maxLon, maxLat],
          [minLon, maxLat],
          [minLon, minLat],
        ],
      ],
    },
  };
}

const rawSyntheticDivisions = [
  makeRfc7946RectFeature('Rajasthan', 'IN-RJ', 70, 23, 78, 30),
  makeRfc7946RectFeature('Maharashtra', 'IN-MH', 72, 16, 80, 22),
  makeRfc7946RectFeature('Tamil Nadu', 'IN-TN', 76, 8, 80, 13),
];

const optimizedSyntheticDivisions = optimizeAdminFeatures(rawSyntheticDivisions, 'in');
const optimizedAdm0 = optimizeAdminFeatures(
  [makeRfc7946RectFeature('India', 'IND', 70, 8, 80, 30)],
  'in'
)[0].feature;

const syntheticIndiaCountry: MapCountry = {
  code: 'in',
  name: 'India',
  continent: 'Asia',
  numericId: '356',
  feature: optimizedAdm0,
};

const syntheticIndiaDataset: AdminBoundaryDataset = {
  alpha2: 'in',
  iso3: 'IND',
  metadata: {
    iso3: 'IND',
    countryName: 'India',
    canonicalType: 'States & Union Territories',
    unitCount: optimizedSyntheticDivisions.length,
    source: 'geoBoundaries',
    license: 'CC BY 4.0',
    year: '2024',
  },
  divisions: optimizedSyntheticDivisions,
  adm0Feature: optimizedAdm0,
};

test('getIso3FromAlpha2 maps priority and global countries accurately', () => {
  assert.equal(getIso3FromAlpha2('in'), 'IND');
  assert.equal(getIso3FromAlpha2('IN'), 'IND');
  assert.equal(getIso3FromAlpha2('us'), 'USA');
  assert.equal(getIso3FromAlpha2('ca'), 'CAN');
  assert.equal(getIso3FromAlpha2('au'), 'AUS');
  assert.equal(getIso3FromAlpha2('de'), 'DEU');
  assert.equal(getIso3FromAlpha2('br'), 'BRA');
  assert.equal(getIso3FromAlpha2('cn'), 'CHN');
  assert.equal(getIso3FromAlpha2('gb'), 'GBR');
  assert.equal(getIso3FromAlpha2('jp'), 'JPN');
  assert.equal(getIso3FromAlpha2('zz'), null);
});

test('resolveCorsGeoJsonUrl rewrites GitHub raw URLs to CORS-enabled media.githubusercontent.com URLs', () => {
  assert.equal(
    resolveCorsGeoJsonUrl(
      'https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/IND/ADM1/geoBoundaries-IND-ADM1_simplified.geojson'
    ),
    'https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/IND/ADM1/geoBoundaries-IND-ADM1_simplified.geojson'
  );
  assert.equal(
    resolveCorsGeoJsonUrl('https://www.geoboundaries.org/data/IND.geojson'),
    'https://www.geoboundaries.org/data/IND.geojson'
  );
});

test('getAdminClassificationLabel respects official country terminology and falls back gracefully', () => {
  assert.equal(getAdminClassificationLabel('in'), 'States & Union Territories');
  assert.equal(getAdminClassificationLabel('ca'), 'Provinces & Territories');
  assert.equal(getAdminClassificationLabel('au'), 'States & Territories');
  assert.equal(getAdminClassificationLabel('de'), 'Federal States (Länder)');
  assert.equal(getAdminClassificationLabel('br'), 'States & Federal District');
  assert.equal(getAdminClassificationLabel('cn'), 'Provincial-Level Divisions');
  assert.equal(getAdminClassificationLabel('xx', 'Governorates'), 'Governorates');
  assert.equal(getAdminClassificationLabel('xx', 'NaN'), 'Administrative Divisions');
  assert.equal(getAdminClassificationLabel('xx'), 'Administrative Divisions');
});

test('buildCountryMapFilename produces clean, descriptive filenames for both modes and formats', () => {
  assert.equal(buildCountryMapFilename('India', false, 'svg'), 'India_Country_Only.svg');
  assert.equal(buildCountryMapFilename('India', true, 'svg'), 'India_With_State_Boundaries.svg');
  assert.equal(
    buildCountryMapFilename('India', true, 'png', 2048),
    'India_With_State_Boundaries_2048px.png'
  );
  assert.equal(
    buildCountryMapFilename('United States', true, 'png', 1024),
    'United_States_With_State_Boundaries_1024px.png'
  );
  assert.equal(
    buildCountryMapFilename("Côte d'Ivoire", false, 'svg'),
    'Cote_d_Ivoire_Country_Only.svg'
  );
});

test('optimizeAdminFeatures rewinds RFC 7946 polygons for d3-geo and excludes distant overseas territories', () => {
  const usRaw = [
    makeRfc7946RectFeature('California', 'US-CA', -124, 32, -114, 42),
    makeRfc7946RectFeature('Texas', 'US-TX', -106, 26, -93, 36),
    makeRfc7946RectFeature('Guam', 'US-GU', 144.6, 13.2, 145, 13.7),
    makeRfc7946RectFeature('Puerto Rico', 'US-PR', -67.3, 17.9, -65.2, 18.5),
  ];
  const usOptimized = optimizeAdminFeatures(usRaw, 'us');
  assert.equal(usOptimized.length, 2);
  assert.deepEqual(
    usOptimized.map((d) => d.name),
    ['California', 'Texas']
  );
  for (const div of usOptimized) {
    const area = geoArea(div.feature);
    assert.ok(area > 0 && area < 0.5, `Expected small rewound area for ${div.name}, got ${area}`);
  }

  const auRaw = [
    makeRfc7946RectFeature('New South Wales', 'AU-NSW', 141, -37, 153, -29),
    makeRfc7946RectFeature('Other Territories', 'AU-OT', 96, -12, 168, -29),
  ];
  const auOptimized = optimizeAdminFeatures(auRaw, 'au');
  assert.equal(auOptimized.length, 1);
  assert.equal(auOptimized[0].name, 'New South Wales');
});

test('Mode 1 (Country Only) is default and renders no internal divisions or labels', () => {
  assert.equal(DEFAULT_MAP_STYLE.showStateBoundaries, false);
  assert.equal(DEFAULT_MAP_STYLE.showStateLabels, false);
  assert.equal(DEFAULT_MAP_STYLE.showLabels, false);

  const svgWithoutCache = generateCountryDetailSvg(syntheticIndiaCountry, null, DEFAULT_MAP_STYLE);
  assert.match(svgWithoutCache, /<g id="country-in">/);
  assert.doesNotMatch(svgWithoutCache, /administrative-divisions/);
  assert.doesNotMatch(svgWithoutCache, /<text/);
  assert.doesNotMatch(svgWithoutCache, /NaN/);

  const svgWithCache = generateCountryDetailSvg(
    syntheticIndiaCountry,
    syntheticIndiaDataset,
    DEFAULT_MAP_STYLE
  );
  assert.match(svgWithCache, /<g id="country-in">/);
  assert.doesNotMatch(svgWithCache, /administrative-divisions/);
  assert.doesNotMatch(svgWithCache, /<text/);
  assert.doesNotMatch(svgWithCache, /NaN/);
});

test('Mode 2 (Country + States/Provinces) emits genuine vector paths, outer border, and zero labels by default', () => {
  const mode2Config = {
    ...DEFAULT_MAP_STYLE,
    showStateBoundaries: true,
    showStateLabels: false,
  };

  const svg = generateCountryDetailSvg(syntheticIndiaCountry, syntheticIndiaDataset, mode2Config);
  assert.match(svg, /<g id="administrative-divisions">/);
  assert.match(svg, /id="adm1-in-rj"/);
  assert.match(svg, /data-name="Rajasthan"/);
  assert.match(svg, /id="adm1-in-mh"/);
  assert.match(svg, /id="adm1-in-tn"/);
  assert.match(svg, /<g id="country-outer-border">/);
  assert.match(svg, /id="country-outline-in"/);
  assert.doesNotMatch(svg, /<text/);
  assert.doesNotMatch(svg, /NaN/);
});

test('Mode 2 supports optional state labels, transparent background, and halo outer border when adm0Feature is null', () => {
  const datasetNoAdm0: AdminBoundaryDataset = {
    ...syntheticIndiaDataset,
    adm0Feature: null,
  };

  const svgWithLabelsAndTransparent = generateCountryWithStatesSvg(
    syntheticIndiaCountry,
    datasetNoAdm0,
    {
      ...DEFAULT_MAP_STYLE,
      showStateBoundaries: true,
      showStateLabels: true,
      transparentBackground: true,
    }
  );

  assert.doesNotMatch(svgWithLabelsAndTransparent, /<rect /);
  assert.match(svgWithLabelsAndTransparent, /<g id="country-outer-border">/);
  assert.match(svgWithLabelsAndTransparent, /<g id="administrative-divisions">/);
  assert.match(svgWithLabelsAndTransparent, /<g id="administrative-labels">/);
  assert.match(svgWithLabelsAndTransparent, />Rajasthan<\/text>/);
  assert.doesNotMatch(svgWithLabelsAndTransparent, /NaN/);
});
