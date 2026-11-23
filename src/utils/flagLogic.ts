import type { CountryFlag } from '../data/countries';

export type SortOrder = 'asc' | 'desc';

export const MAX_ZIP_SELECTION = 5;

export function toggleZipSelection(
  current: Set<string>,
  code: string,
  max = MAX_ZIP_SELECTION
): { next: Set<string>; limitReached: boolean } {
  const next = new Set(current);
  if (next.has(code)) {
    next.delete(code);
    return { next, limitReached: false };
  }
  if (next.size >= max) {
    return { next: current, limitReached: true };
  }
  next.add(code);
  return { next, limitReached: false };
}

export function sanitizeFilename(name: string, code: string, extension: string): string {
  const cleanedName = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const cleanCode = code.toUpperCase();
  return `${cleanedName || cleanCode}-${cleanCode}.${extension}`;
}

export function computeContinentCounts(countries: CountryFlag[]): Record<string, number> {
  const counts: Record<string, number> = { All: countries.length };
  for (const country of countries) {
    counts[country.continent] = (counts[country.continent] || 0) + 1;
  }
  return counts;
}

export function filterAndSortCountries(
  countries: CountryFlag[],
  options: {
    activeTab: string;
    searchQuery: string;
    sortOrder: SortOrder;
  }
): CountryFlag[] {
  const { activeTab, searchQuery, sortOrder } = options;
  let result = countries;

  if (activeTab !== 'All' && activeTab !== 'PowerPoint') {
    if (activeTab === 'International') {
      result = result.filter(
        (c) => c.continent === 'International' || c.continent === 'Antarctica'
      );
    } else {
      result = result.filter((c) => c.continent === activeTab);
    }
  }

  const query = searchQuery.trim().toLowerCase();
  if (query !== '') {
    result = result.filter((c) => {
      if (c.name.toLowerCase().includes(query)) return true;
      if (c.code.toLowerCase().includes(query)) return true;
      if (c.capital && c.capital.toLowerCase().includes(query)) return true;
      if (c.aliases && c.aliases.some((alias) => alias.includes(query))) return true;
      return false;
    });
  }

  return [...result].sort((a, b) =>
    sortOrder === 'asc'
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name)
  );
}

export function buildCountriesCsv(countries: CountryFlag[]): string {
  const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;
  const lines = ['Country Name,ISO Code,Continent'];
  for (const c of countries) {
    lines.push(
      `${escapeCsv(c.name)},${escapeCsv(c.code.toUpperCase())},${escapeCsv(c.continent)}`
    );
  }
  return lines.join('\n') + '\n';
}

