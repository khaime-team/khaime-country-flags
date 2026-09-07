import * as React from 'react';
import { flagUrl, flagEmoji } from '../flags';
import { currencyFlagCode } from '../index';

export interface CountryFlagProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** ISO 3166-1 alpha-2 code, or `"EU"`. Ignored when `currency` is given. */
  code?: string;
  /** ISO 4217 code. Resolves to the right flag, including `EUR` to the EU flag. */
  currency?: string;
  /** Where the app serves this package's `flags/` directory from. Defaults to `/flags`. */
  basePath?: string;
  /** Render the Unicode glyph instead of the SVG. Falls back to the SVG if the code has no glyph. */
  as?: 'img' | 'emoji';
}

/**
 * Renders a country flag.
 *
 * `alt` defaults to empty because a flag almost always sits beside the country
 * or currency name it duplicates. Pass an explicit `alt` when it stands alone.
 */
export function CountryFlag({
  code,
  currency,
  basePath,
  as = 'img',
  alt = '',
  ...rest
}: CountryFlagProps) {
  const resolved = currency ? currencyFlagCode(currency) : code;
  if (!resolved) return null;

  if (as === 'emoji') {
    const glyph = flagEmoji(resolved);
    if (glyph) {
      return (
        <span role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={!alt}>
          {glyph}
        </span>
      );
    }
  }

  return <img src={flagUrl(resolved, { basePath })} alt={alt} {...rest} />;
}

export default CountryFlag;
