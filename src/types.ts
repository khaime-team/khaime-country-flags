/**
 * A single country record.
 *
 * Note the field names: `code` is the ISO code and `emoji` is the flag glyph.
 * Khaime's older call sites named the ISO code `flag`, which made comparisons
 * like `country.flag === 'NG'` read as if they compared images.
 */
export interface Country {
  /** ISO 3166-1 alpha-2, uppercase. e.g. `"NG"` */
  code: string;
  /** English country name. e.g. `"Nigeria"` */
  name: string;
  /** E.164 calling code including the leading `+`. e.g. `"+234"` */
  dialCode: string;
  /** ISO 4217 currency code, uppercase. Undefined when not mapped. e.g. `"NGN"` */
  currency?: string;
  /** Unicode regional-indicator flag glyph. e.g. `"🇳🇬"` */
  emoji: string;
  /** Whether this package bundles an SVG for `code`. */
  hasFlag: boolean;
  /**
   * Whether this is the main country for {@link dialCode}. 25 countries share
   * `+1` and 4 share `+44`; libphonenumber names one of each as primary (US and
   * GB here), and lookups by dial code return it.
   */
  isPrimaryForDialCode: boolean;
}

/** Options for {@link flagUrl}. */
export interface FlagUrlOptions {
  /**
   * Public path the flag SVGs are served from. Defaults to `/flags`.
   * Set this to wherever the consuming app copied the bundled `flags/` directory.
   */
  basePath?: string;
}
