import { countries } from './data/countries.generated';
import { CURRENCY_TO_COUNTRY, CURRENCY_FLAG_OVERRIDES } from './data/currency-map';
import { flagEmoji, flagUrl } from './flags';
import type { Country, FlagUrlOptions } from './types';

export { countries, flagEmoji, flagUrl, CURRENCY_TO_COUNTRY, CURRENCY_FLAG_OVERRIDES };
export { fromApiCurrencies, DEFAULT_CURRENCY_PRIORITY } from './api';
export type { Country, FlagUrlOptions };
export type { ApiCurrency, ResolvedCurrency, FromApiOptions } from './api';

const byCode = new Map(countries.map((c) => [c.code, c]));

/** Look up a country by ISO 3166-1 alpha-2 code. Case-insensitive. */
export function getCountryByCode(code: string | null | undefined): Country | undefined {
  if (!code) return undefined;
  return byCode.get(code.toUpperCase());
}

/**
 * Look up a country by E.164 calling code, with or without the leading `+`.
 *
 * 25 countries share `+1` and none of them carry the area code that would tell
 * them apart, so this returns the calling code's primary country (US for `+1`,
 * GB for `+44`). Use {@link getCountriesByDialCode} to see them all.
 */
export function getCountryByDialCode(dialCode: string | null | undefined): Country | undefined {
  const matches = getCountriesByDialCode(dialCode);
  return matches.find((c) => c.isPrimaryForDialCode) ?? matches[0];
}

/** Every country sharing a calling code, ordered by name. */
export function getCountriesByDialCode(dialCode: string | null | undefined): Country[] {
  if (!dialCode) return [];
  const normalised = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  return countries.filter((c) => c.dialCode === normalised);
}

/** Look up a country by exact English name. Case-insensitive. */
export function getCountryByName(name: string | null | undefined): Country | undefined {
  if (!name) return undefined;
  const needle = name.trim().toLowerCase();
  return countries.find((c) => c.name.toLowerCase() === needle);
}

/**
 * Resolve a country from a number a user is typing, for a phone input that
 * updates its flag as they go.
 *
 * Matches the longest dial code the number starts with. No dial code in this
 * dataset is currently a prefix of another, so that only matters if a future
 * regeneration introduces one — but it costs nothing and stops `+1` quietly
 * winning over a hypothetical `+1242`. Where a code is shared, the primary
 * country wins, so a US number gives US and not American Samoa.
 */
export function getCountryByPhoneNumber(phone: string | null | undefined): Country | undefined {
  if (!phone) return undefined;
  const trimmed = phone.replace(/[\s-]/g, '');
  let best: Country | undefined;
  for (const c of countries) {
    if (!trimmed.startsWith(c.dialCode)) continue;
    if (!best || c.dialCode.length > best.dialCode.length) best = c;
    else if (c.dialCode.length === best.dialCode.length && c.isPrimaryForDialCode) best = c;
  }
  return best;
}

/** Countries whose name or dial code contains `query`. Empty query returns all. */
export function searchCountries(query: string | null | undefined): Country[] {
  if (!query?.trim()) return [...countries];
  const needle = query.trim().toLowerCase();
  return countries.filter(
    (c) => c.name.toLowerCase().includes(needle) || c.dialCode.includes(needle)
  );
}

/**
 * `countries` reordered so `codes` come first, in the order given. Everything
 * else keeps its alphabetical order. For "popular countries at the top of the
 * dropdown" lists.
 */
export function withPriority(codes: readonly string[]): Country[] {
  const wanted = codes.map((c) => c.toUpperCase());
  const rank = new Map(wanted.map((c, i) => [c, i]));
  const head: Country[] = [];
  const tail: Country[] = [];
  for (const c of countries) (rank.has(c.code) ? head : tail).push(c);
  head.sort((a, b) => rank.get(a.code)! - rank.get(b.code)!);
  return [...head, ...tail];
}

/**
 * The country to derive real country data from for a currency — dial code,
 * address default. `EUR` gives Germany, because the eurozone has no calling
 * code of its own. For the flag to *show* next to a currency, use
 * {@link currencyFlagCode} instead.
 */
export function getCountryForCurrency(currency: string | null | undefined): Country | undefined {
  if (!currency) return undefined;
  return getCountryByCode(CURRENCY_TO_COUNTRY[currency.toUpperCase()]);
}

/**
 * The flag code to display for a currency: the currency's country, except
 * where a bloc flag is more accurate (`EUR` gives `EU`, not `DE`).
 */
export function currencyFlagCode(currency: string | null | undefined): string | undefined {
  if (!currency) return undefined;
  const upper = currency.toUpperCase();
  return CURRENCY_FLAG_OVERRIDES[upper] ?? CURRENCY_TO_COUNTRY[upper];
}

/** Flag glyph for a currency. `EUR` gives 🇪🇺. */
export function currencyFlagEmoji(currency: string | null | undefined): string {
  return flagEmoji(currencyFlagCode(currency));
}

/** Bundled-SVG URL for a currency's flag. */
export function currencyFlagUrl(
  currency: string | null | undefined,
  options?: FlagUrlOptions
): string {
  return flagUrl(currencyFlagCode(currency), options);
}
