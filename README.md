# @khaime-team/country-flags

One source of country, dial-code, currency and flag data for Khaime storefronts.

Before this package, flags were handled four different ways across two repos:
254 self-hosted SVGs and a 50-country emoji table in `khaime-custom-sites`,
`flagcdn.com` URLs and two duplicated emoji maps in `khaime-business-customer`.
The currency-to-country mapping existed in five places and disagreed with itself.

- **243 countries** — ISO code, English name, E.164 dial code, currency, emoji
- **255 flag SVGs** bundled, including `eu.svg` for the eurozone
- **No runtime dependencies.** Data is generated at build time and checked in

## Install

The package is published to GitHub Packages. Add to the consuming repo's `.npmrc`:

```
@khaime-team:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
npm install @khaime-team/country-flags
```

Then copy the SVGs into whatever directory the app serves static files from:

```bash
npx khaime-country-flags copy public/flags
```

The SVGs are static, so committing that copy is fine. `flagUrl` defaults to a
`/flags` base path; pass `basePath` if you put them elsewhere.

## Usage

```ts
import {
  getCountryByCode,
  getCountryByPhoneNumber,
  currencyFlagUrl,
  flagEmoji,
  withPriority,
} from '@khaime-team/country-flags';

getCountryByCode('ng');
// { code: 'NG', name: 'Nigeria', dialCode: '+234', currency: 'NGN', emoji: '🇳🇬', ... }

getCountryByPhoneNumber('+234 801 234 5678').code; // 'NG'
currencyFlagUrl('NGN');                            // '/flags/ng.svg'
flagEmoji('NG');                                   // '🇳🇬'

// Popular countries first, everything else alphabetical.
withPriority(['NG', 'GH', 'KE', 'US', 'GB']);
```

React:

```tsx
import { CountryFlag } from '@khaime-team/country-flags/react';

<CountryFlag code="NG" className="w-5 h-4 object-cover" />
<CountryFlag currency="EUR" />          {/* the EU flag, not Germany's */}
<CountryFlag code="NG" as="emoji" />
```

## Backend currencies

The package does no fetching. Pass it whatever your HTTP client returned from
`GET /currencies` and it handles the shape:

```ts
import { fromApiCurrencies, DEFAULT_CURRENCY_PRIORITY } from '@khaime-team/country-flags';

const currencies = fromApiCurrencies(response.data.data, {
  priority: DEFAULT_CURRENCY_PRIORITY,
});
// [{ code: 'NGN', symbol: '₦', name: 'Nigeria', countryCode: 'NG',
//    flagCode: 'NG', flagUrl: '/flags/ng.svg', emoji: '🇳🇬' }, ...]
```

Each app keeps its own client, caching and error handling; this owns only the
normalisation both were reimplementing. It drops `is_active: false` rows (a
missing `is_active` counts as active), de-duplicates by currency, uppercases
codes, and sorts `priority` codes to the front while leaving the rest in the
API's order.

`country_code` is nullable and this handles it. khaime-custom-sites typed it
non-null and called `.toLowerCase()` on it unguarded, so a single null row threw
inside the `.map`, the `catch` swallowed it, and the entire currency list
collapsed to the four hardcoded `DEFAULT_CURRENCIES`. Here an unresolvable row
degrades to an empty `flagUrl` and leaves its neighbours alone.

Where the API and this package disagree, each wins the question it is
authoritative on: the API's `country_code` wins for `countryCode`, because the
backend decides which country issues a currency; the bloc overrides win for
`flagCode`, because that is a display question the backend is not answering.
So a `EUR` row with `country_code: 'DE'` yields `countryCode: 'DE'` and
`flagCode: 'EU'`.

## Two things worth knowing

**`code` is the ISO code, `emoji` is the glyph.** The old call sites named the
ISO code `flag`, so `country.flag === 'NG'` read as if it compared images. If
you are migrating code that does that, it wants `code`.

**A currency's country and a currency's flag are not the same thing.** `EUR`
needs Germany to produce a dial code, but showing 🇩🇪 beside a euro price is
wrong. So:

```ts
getCountryForCurrency('EUR');  // Germany — use for dial codes, address defaults
currencyFlagCode('EUR');       // 'EU'    — use for display
```

`khaime-business-customer` currently disagrees with itself here: its phone input
maps `EUR → DE` while its navbar maps `EUR → eu`. This package settles it.

## API

| Function | Returns |
| --- | --- |
| `countries` | All 243, alphabetical by name |
| `getCountryByCode(code)` | By ISO alpha-2, case-insensitive |
| `getCountryByName(name)` | By exact English name, case-insensitive |
| `getCountryByDialCode(dial)` | Primary country for a calling code |
| `getCountriesByDialCode(dial)` | Every country sharing a calling code |
| `getCountryByPhoneNumber(phone)` | Longest dial-code match, primary preferred |
| `searchCountries(query)` | Name or dial-code substring match |
| `withPriority(codes)` | `countries` reordered, given codes first |
| `getCountryForCurrency(currency)` | The country to take real data from |
| `currencyFlagCode(currency)` | The flag code to display |
| `currencyFlagUrl(currency, opts?)` | SVG URL for a currency's flag |
| `currencyFlagEmoji(currency)` | Glyph for a currency's flag |
| `flagEmoji(code)` | Glyph for an ISO code |
| `flagUrl(code, opts?)` | SVG URL for an ISO code |
| `fromApiCurrencies(rows, opts?)` | `GET /currencies` rows, ready to render |

### Dial codes are shared

25 countries share `+1` and 4 share `+44`, and none of them carry the area code
that would tell them apart. `getCountryByDialCode('+1')` returns the US because
libphonenumber names it the primary for that code — captured as
`isPrimaryForDialCode` at generation time. Reach for `getCountriesByDialCode`
when the caller has to disambiguate.

### Currency coverage

86 of 243 countries carry a `currency`. The first 50 are Khaime's own curated
list, lifted from `@khaime/address`; the rest cover the eurozone, the CFA franc
blocs and the African markets Khaime sells into. Countries outside that get
`currency: undefined` rather than a guess. Add to `COUNTRY_CURRENCY` in
`scripts/generate-countries.mts` and re-run `npm run generate`.

## Regenerating the data

`src/data/countries.generated.ts` is checked in and built from
`libphonenumber-js` (dial codes) and `i18n-iso-countries` (names), both
devDependencies:

```bash
npm run generate
```

CI re-runs this and fails if the committed file has drifted, so bumping either
source package surfaces as a diff rather than a silent data change.

## Flag asset provenance

The SVGs in `flags/` were inherited from
`khaime-custom-sites/apps/storefront/public/flags/`, which shipped them with no
LICENSE or attribution file. Their origin has not been established. Common flag
sets are permissively licensed (flag-icons is MIT, flagpedia is public domain),
and flag designs themselves are generally not copyrightable, but a specific
drawing of one can be — so this should be confirmed before the package is
distributed any more widely than Khaime's own apps. `eu.svg` is the exception:
it is generated from the published EU specification (12 stars on a circle of
radius ⅓ the hoist, `#039` field, `#FC0` stars).

## Development

```bash
npm install
npm run generate   # rebuild the country data
npm run build      # tsc to dist/
npm test           # runs against dist/
npm run typecheck
```
