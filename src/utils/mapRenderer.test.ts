import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getMapCountries,
  getMapCountryByCode,
  filterMapCountries,
  MAP_CONTINENTS,
} from '../data/worldMaps';
import {
  DEFAULT_MAP_STYLE,
  generateCountryMapSvg,
  generateWorldMapSvg,
  generateContinentMapSvg,
  generateCustomHighlightMapSvg,
  getMapDimensions,
} from './mapRenderer';

test('world-atlas 50m loads 200+ mapped countries including India, USA, UK, Germany, Japan', () => {
  const countries = getMapCountries();
  assert.ok(countries.length >= 220, `Expected >=220 mapped countries, got ${countries.length}`);

  for (const code of ['in', 'us', 'gb', 'de', 'jp', 'fr', 'br', 'au', 'ca', 'cn']) {
    const match = getMapCountryByCode(code);
    assert.ok(match, `Expected country map for ISO code "${code}"`);
    assert.ok(match.feature.geometry, `Expected geometry for "${code}"`);
  }
});

test('filterMapCountries supports aliases USA, UK, and continent filtering', () => {
  const countries = getMapCountries();
  const usa = filterMapCountries(countries, {
    continent: 'All',
    searchQuery: 'USA',
    sortOrder: 'asc',
  });
  assert.ok(usa.some((c) => c.code === 'us'));

  const uk = filterMapCountries(countries, {
    continent: 'All',
    searchQuery: 'UK',
    sortOrder: 'asc',
  });
  assert.ok(uk.some((c) => c.code === 'gb'));

  const europe = filterMapCountries(countries, {
    continent: 'Europe',
    searchQuery: '',
    sortOrder: 'asc',
  });
  assert.ok(europe.length >= 40);
  assert.ok(europe.every((c) => c.continent === 'Europe'));
});

test('individual country SVG generation produces valid SVG paths without NaN', () => {
  for (const code of ['in', 'us', 'gb', 'de', 'jp', 'ru', 'fr', 'aq']) {
    const country = getMapCountryByCode(code);
    assert.ok(country, `Missing country ${code}`);
    const svg = generateCountryMapSvg(country, {
      ...DEFAULT_MAP_STYLE,
      showLabels: true,
      labelMode: 'both',
    });
    assert.ok(svg.startsWith('<svg '), `Invalid SVG start for ${code}`);
    assert.ok(svg.includes('<path d="M'), `Missing vector path for ${code}`);
    assert.ok(!svg.includes('NaN'), `NaN detected in SVG for ${code}`);
    assert.ok(svg.includes(country.code.toUpperCase()), `Missing ISO label for ${code}`);
  }
});

test('outline mode, silhouette mode, and transparent background work accurately', () => {
  const india = getMapCountryByCode('in')!;

  const outlineSvg = generateCountryMapSvg(india, {
    ...DEFAULT_MAP_STYLE,
    renderMode: 'outline',
    borderColor: '#1e3a5f',
    transparentBackground: true,
  });
  assert.ok(outlineSvg.includes('fill="none"'));
  assert.ok(outlineSvg.includes('stroke="#1e3a5f"'));
  assert.ok(!outlineSvg.includes('<rect '));

  const silhouetteSvg = generateCountryMapSvg(india, {
    ...DEFAULT_MAP_STYLE,
    renderMode: 'silhouette',
    fillColor: '#0f172a',
    transparentBackground: false,
    backgroundColor: '#ffffff',
  });
  assert.ok(silhouetteSvg.includes('fill="#0f172a"'));
  assert.ok(silhouetteSvg.includes('stroke="none"'));
  assert.ok(silhouetteSvg.includes('<rect width="800" height="450" fill="#ffffff"'));
});

test('world map, all 6 continent maps, and custom highlight map render valid SVGs', () => {
  const countries = getMapCountries();

  const worldSvg = generateWorldMapSvg(countries, {
    ...DEFAULT_MAP_STYLE,
    showLabels: true,
  });
  assert.ok(worldSvg.includes('<g id="world-countries">'));
  assert.ok(worldSvg.includes('data-code="in"'));
  assert.ok(worldSvg.includes('data-code="us"'));
  assert.ok(!worldSvg.includes('NaN'));

  for (const continent of MAP_CONTINENTS) {
    const contSvg = generateContinentMapSvg(continent, countries, DEFAULT_MAP_STYLE);
    assert.ok(contSvg.includes('<path '), `Empty continent SVG for ${continent}`);
    assert.ok(!contSvg.includes('NaN'), `NaN in continent SVG for ${continent}`);
  }

  const customSvg = generateCustomHighlightMapSvg(
    countries,
    new Set(['in', 'us', 'gb', 'de']),
    {
      ...DEFAULT_MAP_STYLE,
      highlightColor: '#2563eb',
      baseColor: '#e2e8f0',
      showLabels: true,
      labelMode: 'name',
    }
  );
  assert.ok(customSvg.includes('data-code="in" data-highlighted="true"'));
  assert.ok(customSvg.includes('data-code="us" data-highlighted="true"'));
  assert.ok(customSvg.includes('data-code="gb" data-highlighted="true"'));
  assert.ok(customSvg.includes('data-code="de" data-highlighted="true"'));
  assert.ok(customSvg.includes('fill="#2563eb"'));
  assert.ok(customSvg.includes('fill="#e2e8f0"'));
  assert.ok(customSvg.includes('India'));
  assert.ok(customSvg.includes('Germany'));
});

test('getMapDimensions computes 16:9, 4:3, and 1:1 PNG dimensions accurately', () => {
  assert.deepEqual(getMapDimensions('16:9', 4096), { width: 4096, height: 2304 });
  assert.deepEqual(getMapDimensions('4:3', 2048), { width: 2048, height: 1536 });
  assert.deepEqual(getMapDimensions('1:1', 1024), { width: 1024, height: 1024 });
});
