import rawCountries from 'flag-icons/country.json';

export interface CountryFlag {
  code: string;
  name: string;
  continent: string;
  capital?: string;
  iso: boolean;
  aliases?: string[];
}

interface RawFlagIconCountry {
  code: string;
  name: string;
  continent?: string;
  capital?: string;
  iso?: boolean;
  flag_1x1?: string;
  flag_4x3?: string;
}

const CONTINENT_OVERRIDES: Record<string, string> = {
  'es-pv': 'Europe',
  'es-ct': 'Europe',
  'es-ga': 'Europe',
  ic: 'Europe',
  aq: 'Antarctica',
  bv: 'Antarctica',
  hm: 'Antarctica',
  eu: 'International',
  un: 'International',
  asean: 'International',
  arab: 'International',
  cefta: 'International',
  eac: 'International',
  pc: 'International',
  cp: 'International',
  dg: 'International',
  xx: 'International',
};

const SEARCH_ALIASES: Record<string, string[]> = {
  us: ['usa', 'united states', 'america', 'u.s.', 'u.s.a.'],
  gb: ['uk', 'britain', 'great britain', 'u.k.'],
  ae: ['uae', 'emirates'],
  in: ['bharat'],
  de: ['deutschland'],
  jp: ['nippon'],
  kr: ['korea', 'rok'],
  nl: ['holland'],
  ch: ['swiss'],
  cn: ['prc'],
  cz: ['czechia'],
  tr: ['turkiye', 'türkiye'],
};

export const COUNTRIES: CountryFlag[] = (rawCountries as RawFlagIconCountry[]).map((item) => {
  const code = item.code.toLowerCase();
  const continent = item.continent || CONTINENT_OVERRIDES[code] || 'International';
  return {
    code,
    name: item.name,
    continent,
    capital: item.capital,
    iso: Boolean(item.iso),
    aliases: SEARCH_ALIASES[code],
  };
});

export type FlagAspect = '4x3' | '1x1';

export function getFlagSvgUrl(code: string, aspect: FlagAspect = '4x3'): string {
  return `flags/${aspect}/${code.toLowerCase()}.svg`;
}

export function createFallbackFlagSvg(code: string): string {
  const safeCode = code.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase().slice(0, 6);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><rect width="640" height="480" fill="#e2e8f0"/><text x="320" y="255" font-family="sans-serif" font-size="72" font-weight="700" text-anchor="middle" fill="#475569">${safeCode}</text></svg>`;
}

export function getFallbackFlagDataUrl(code: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(createFallbackFlagSvg(code))}`;
}

export async function getFlagSvgContent(
  code: string,
  aspect: FlagAspect = '4x3'
): Promise<string> {
  try {
    const res = await fetch(getFlagSvgUrl(code, aspect));
    if (res.ok) {
      const text = await res.text();
      if (text.trim().startsWith('<svg') || text.includes('<svg')) {
        return text;
      }
    }
  } catch {
    // Fall through to safe local fallback SVG
  }
  return createFallbackFlagSvg(code);
}
