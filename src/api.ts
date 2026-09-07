import { countries } from './data/countries.generated';
import { CURRENCY_TO_COUNTRY, CURRENCY_FLAG_OVERRIDES } from './data/currency-map';
import { flagEmoji, flagUrl } from './flags';
import type { FlagUrlOptions } from './types';

/**
 * A row from Khaime's `GET /currencies`.
 *
 * `country_code` is nullable: khaime-business-customer types it that way and
 * guards it, khaime-custom-sites did not and threw on the first null row,
 * collapsing its whole currency list to the hardcoded defaults.
 */
export interface ApiCurrency {
  currency_iso: string;
  currency_symbol?: string | null;
  country_code?: string | null;
  country_name?: string | null;
  is_active?: boolean | null;
}

/** A currency ready to render: flag resolved, name filled in. */
export interface ResolvedCurrency {
  /** ISO 4217, uppercase. e.g. `"NGN"` */
  code: string;
  /** Symbol from the API, or the code when it has none. e.g. `"₦"` */
  symbol: string;
  /** Display name — the API's country name, this package's, or the code. */
  name: string;
  /** The real country behind the currency, for dial codes and address defaults. */
  countryCode?: string;
  /** The flag to *show*, which is `EU` for the euro rather than any one member. */
  flagCode?: string;
  /** URL for the bundled SVG. `''` when no flag could be resolved. */
  flagUrl: string;
  /** Flag glyph. `''` when no flag could be resolved. */
  emoji: string;
}

export interface FromApiOptions extends FlagUrlOptions {
  /**
   * Drop rows the API marks `is_active: false`. Defaults to `true`. A missing
   * or null `is_active` counts as active, so a payload that omits the field
   * is not silently emptied.
   */
  activeOnly?: boolean;
  /**
   * Currency codes to sort to the front, in this order. Everything else keeps
   * the API's ordering behind them. See {@link DEFAULT_CURRENCY_PRIORITY}.
   */
  priority?: readonly string[];
}

/** The order khaime-custom-sites has been sorting its currency switcher by. */
export const DEFAULT_CURRENCY_PRIORITY: readonly string[] = Object.freeze([
  'NGN', 'USD', 'GBP', 'EUR', 'CAD', 'AUD', 'GHS', 'KES', 'ZAR', 'AED', 'INR',
  'CNY', 'JPY',
]);

const nameByCode = new Map(countries.map((c) => [c.code, c.name]));

/**
 * Turns `GET /currencies` rows into records that are ready to render.
 *
 * Does no fetching — pass it whatever your HTTP client returned. Both apps
 * keep their own caching and client; this owns the shape handling they were
 * each reimplementing.
 *
 * The API's `country_code` wins for {@link ResolvedCurrency.countryCode},
 * since the backend is authoritative about which country issues a currency.
 * The bloc overrides win for {@link ResolvedCurrency.flagCode}, since that is
 * a display question the backend is not answering: a euro price beside a
 * German flag is wrong even when the API says EUR belongs to DE.
 *
 * Rows with no `currency_iso` are dropped, as are duplicates after the first.
 */
export function fromApiCurrencies(
  rows: readonly ApiCurrency[] | null | undefined,
  { activeOnly = true, priority, basePath }: FromApiOptions = {}
): ResolvedCurrency[] {
  if (!rows?.length) return [];

  const seen = new Set<string>();
  const resolved: ResolvedCurrency[] = [];

  for (const row of rows) {
    const code = row?.currency_iso?.trim().toUpperCase();
    if (!code || seen.has(code)) continue;
    if (activeOnly && row.is_active === false) continue;
    seen.add(code);

    const countryCode = row.country_code?.trim().toUpperCase() || CURRENCY_TO_COUNTRY[code];
    const flagCode = CURRENCY_FLAG_OVERRIDES[code] ?? countryCode;

    resolved.push({
      code,
      symbol: row.currency_symbol?.trim() || code,
      name: row.country_name?.trim() || (countryCode && nameByCode.get(countryCode)) || code,
      countryCode,
      flagCode,
      flagUrl: flagCode ? flagUrl(flagCode, { basePath }) : '',
      emoji: flagCode ? flagEmoji(flagCode) : '',
    });
  }

  if (!priority?.length) return resolved;

  const rank = new Map(priority.map((c, i) => [c.toUpperCase(), i]));
  // Index breaks ties so equal-rank rows keep the API's ordering.
  return resolved
    .map((c, index) => ({ c, index, rank: rank.get(c.code) ?? Number.MAX_SAFE_INTEGER }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ c }) => c);
}
