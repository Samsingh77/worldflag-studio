import test from 'node:test';
import assert from 'node:assert/strict';
import { COUNTRIES } from '../data/countries';
import {
  buildCountriesCsv,
  computeContinentCounts,
  filterAndSortCountries,
  sanitizeFilename,
  MAX_ZIP_SELECTION,
  toggleZipSelection,
} from './flagLogic';

test('COUNTRIES loads complete flag-icons dataset (271 entries)', () => {
  assert.equal(COUNTRIES.length, 271);
  assert.ok(COUNTRIES.some((c) => c.code === 'in' && c.name === 'India'));
  assert.ok(COUNTRIES.some((c) => c.code === 'us'));
  assert.ok(COUNTRIES.some((c) => c.code === 'gb'));
  assert.ok(COUNTRIES.some((c) => c.code === 'jp' && c.name === 'Japan'));
  assert.ok(COUNTRIES.some((c) => c.code === 'de' && c.name === 'Germany'));
});

test('search finds India, USA, UK, Japan, and Germany', () => {
  const queries = [
    { q: 'India', expectedCode: 'in' },
    { q: 'USA', expectedCode: 'us' },
    { q: 'UK', expectedCode: 'gb' },
    { q: 'Japan', expectedCode: 'jp' },
    { q: 'Germany', expectedCode: 'de' },
    { q: 'de', expectedCode: 'de' },
  ];

  for (const { q, expectedCode } of queries) {
    const matches = filterAndSortCountries(COUNTRIES, {
      activeTab: 'All',
      searchQuery: q,
      sortOrder: 'asc',
    });
    assert.ok(
      matches.some((c) => c.code === expectedCode),
      `Expected search "${q}" to match code "${expectedCode}"`
    );
  }
});

test('continent filter and A-Z / Z-A sorting work accurately', () => {
  const asiaAsc = filterAndSortCountries(COUNTRIES, {
    activeTab: 'Asia',
    searchQuery: '',
    sortOrder: 'asc',
  });
  const asiaDesc = filterAndSortCountries(COUNTRIES, {
    activeTab: 'Asia',
    searchQuery: '',
    sortOrder: 'desc',
  });

  assert.ok(asiaAsc.length > 40);
  assert.ok(asiaAsc.every((c) => c.continent === 'Asia'));
  assert.equal(asiaAsc[0].code, asiaDesc[asiaDesc.length - 1].code);
});

test('sanitizeFilename produces clean meaningful filenames', () => {
  assert.equal(sanitizeFilename('India', 'in', 'svg'), 'India-IN.svg');
  assert.equal(sanitizeFilename('Côte d’Ivoire', 'ci', 'png'), 'Cote-d-Ivoire-CI.png');
});

test('buildCountriesCsv and computeContinentCounts cover all entries', () => {
  const counts = computeContinentCounts(COUNTRIES);
  assert.equal(counts.All, 271);

  const csv = buildCountriesCsv(COUNTRIES.slice(0, 2));
  assert.ok(csv.startsWith('Country Name,ISO Code,Continent\n'));
  assert.equal(csv.trim().split('\n').length, 3);
});

test('toggleZipSelection enforces maximum of 5 items', () => {
  assert.equal(MAX_ZIP_SELECTION, 5);
  let set = new Set<string>();
  
  // Add 5 items
  for (const code of ['in', 'us', 'gb', 'de', 'jp']) {
    const res = toggleZipSelection(set, code);
    set = res.next;
    assert.equal(res.limitReached, false);
  }
  assert.equal(set.size, 5);

  // Attempt 6th item
  const res6 = toggleZipSelection(set, 'fr');
  assert.equal(res6.limitReached, true);
  assert.equal(res6.next.size, 5);

  // Deselect 1 item
  const resDesel = toggleZipSelection(set, 'jp');
  set = resDesel.next;
  assert.equal(resDesel.limitReached, false);
  assert.equal(set.size, 4);

  // Now adding 'fr' should succeed
  const resFr = toggleZipSelection(set, 'fr');
  assert.equal(resFr.limitReached, false);
  assert.equal(resFr.next.size, 5);
});

