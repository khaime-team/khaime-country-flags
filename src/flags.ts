import type { FlagUrlOptions } from './types';

const DEFAULT_BASE_PATH = '/flags';

/**
 * Regional-indicator flag glyph for an ISO 3166-1 alpha-2 code.
 *
 * Computed from the code points, so it covers every code without a lookup
 * table, `"EU"` (🇪🇺) included. Returns `''` for anything that is not two ASCII
 * letters.
 */
export function flagEmoji(code: string | null | undefined): string {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return '';
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

/**
 * Public URL for a bundled flag SVG.
 *
 * `basePath` must point at wherever the app copied this package's `flags/`
 * directory — see `npx khaime-country-flags copy <dir>`.
 */
export function flagUrl(
  code: string | null | undefined,
  { basePath = DEFAULT_BASE_PATH }: FlagUrlOptions = {}
): string {
  if (!code) return '';
  return `${basePath.replace(/\/+$/, '')}/${code.toLowerCase()}.svg`;
}
