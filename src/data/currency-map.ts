/**
 * Currency to country, for picking a real country from a currency: dial codes,
 * address defaults, tax guesses. EUR resolves to DE here because a phone input
 * needs a country that actually has a calling code.
 *
 * Seeded from the four copies of this map that previously lived in
 * khaime-business-customer (phone-input, storefront-navbar, order-card,
 * quote-card) and khaime-custom-sites (currency-context).
 */
export const CURRENCY_TO_COUNTRY: Readonly<Record<string, string>> = Object.freeze({
  AED: 'AE', ARS: 'AR', AUD: 'AU', BDT: 'BD', BRL: 'BR', CAD: 'CA', CHF: 'CH',
  CLP: 'CL', CNY: 'CN', COP: 'CO', CZK: 'CZ', DKK: 'DK', EGP: 'EG', ETB: 'ET',
  EUR: 'DE', GBP: 'GB', GHS: 'GH', HKD: 'HK', HUF: 'HU', IDR: 'ID', INR: 'IN',
  JPY: 'JP', KES: 'KE', KRW: 'KR', MAD: 'MA', MXN: 'MX', MYR: 'MY', NGN: 'NG',
  NOK: 'NO', NZD: 'NZ', PEN: 'PE', PHP: 'PH', PKR: 'PK', PLN: 'PL', RON: 'RO',
  RUB: 'RU', RWF: 'RW', SAR: 'SA', SEK: 'SE', SGD: 'SG', THB: 'TH', TRY: 'TR',
  TZS: 'TZ', UGX: 'UG', USD: 'US', VND: 'VN', XAF: 'CM', XOF: 'SN', ZAR: 'ZA',
  ZMW: 'ZM',
});

/**
 * Currencies whose *flag* should not be the flag of {@link CURRENCY_TO_COUNTRY}.
 * The euro is the only real case: the eurozone is not Germany, so a currency
 * switcher showing 🇩🇪 next to EUR is wrong even though DE is the right country
 * to derive a dial code from.
 */
export const CURRENCY_FLAG_OVERRIDES: Readonly<Record<string, string>> = Object.freeze({
  EUR: 'EU',
});
