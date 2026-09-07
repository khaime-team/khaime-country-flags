/**
 * Runnable demo of the three jobs this package was built to replace: a country
 * picker, a phone input that resolves its own flag, and a currency switcher fed
 * from GET /currencies.
 *
 * Flags load from ../flags, so the example exercises the same SVGs the package
 * publishes rather than a copy.
 */
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
  fromApiCurrencies,
  getCountryByCode,
  getCountryByPhoneNumber,
  searchCountries,
  withPriority,
  DEFAULT_CURRENCY_PRIORITY,
  type ApiCurrency,
  type Country,
} from '../src/index';
import { CountryFlag } from '../src/react/index';

const BASE_PATH = '../flags';

/** Khaime's own storefronts put these first. */
const PRIORITY = ['NG', 'GH', 'KE', 'ZA', 'US', 'GB'];

/**
 * Stands in for GET /currencies. The awkward rows are the point: KES arrives
 * with a null country_code, XPF maps to nothing at all, and SEK is inactive.
 */
const API_RESPONSE: ApiCurrency[] = [
  { currency_iso: 'USD', currency_symbol: '$', country_code: 'US', country_name: 'United States', is_active: true },
  { currency_iso: 'EUR', currency_symbol: '€', country_code: 'DE', country_name: 'Germany', is_active: true },
  { currency_iso: 'KES', currency_symbol: 'KSh', country_code: null, country_name: null, is_active: true },
  { currency_iso: 'NGN', currency_symbol: '₦', country_code: 'NG', country_name: 'Nigeria', is_active: true },
  { currency_iso: 'SEK', currency_symbol: 'kr', country_code: 'SE', country_name: 'Sweden', is_active: false },
  { currency_iso: 'XPF', currency_symbol: '₣', country_code: null, country_name: null, is_active: true },
  { currency_iso: 'GBP', currency_symbol: '£', country_code: 'GB', country_name: 'United Kingdom', is_active: true },
];

function CountryPicker() {
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState('NG');

  const results = React.useMemo(() => {
    const matches = searchCountries(query);
    if (query.trim()) return matches;
    // No query: show Khaime's markets first, then everyone else.
    const ordered = withPriority(PRIORITY);
    return ordered.filter((c) => matches.includes(c));
  }, [query]);

  const country = getCountryByCode(selected);

  return (
    <section className="panel">
      <h2>Country picker</h2>
      <p className="hint">
        <code>searchCountries</code> and <code>withPriority</code>. Empty search
        puts Khaime's markets on top.
      </p>

      <label htmlFor="country-search">Search by name or dial code</label>
      <input
        id="country-search"
        value={query}
        placeholder="Ghana, or +233"
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="list" role="listbox" aria-label="Countries">
        {results.length === 0 && <p className="empty">No country matches “{query}”.</p>}
        {results.slice(0, 60).map((c: Country) => (
          <button
            key={c.code}
            type="button"
            role="option"
            aria-selected={c.code === selected}
            onClick={() => setSelected(c.code)}
          >
            <CountryFlag code={c.code} basePath={BASE_PATH} className="flag" />
            <span className="name">{c.name}</span>
            <span className="dial" style={{ marginLeft: 'auto' }}>{c.dialCode}</span>
          </button>
        ))}
      </div>

      {country && (
        <div className="readout">
          <CountryFlag code={country.code} basePath={BASE_PATH} className="flag flag-lg" />
          <div>
            <div className="label">
              {country.code} · {country.dialCode}
              {country.currency ? ` · ${country.currency}` : ''}
            </div>
            <div className="value">
              {country.emoji} {country.name}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function PhoneInput() {
  const [value, setValue] = React.useState('+1 415 555 0132');
  const country = getCountryByPhoneNumber(value);

  return (
    <section className="panel">
      <h2>Phone input</h2>
      <p className="hint">
        <code>getCountryByPhoneNumber</code> resolves the flag as you type.
      </p>

      <label htmlFor="phone">Phone number</label>
      <div className="row">
        {country ? (
          <CountryFlag code={country.code} basePath={BASE_PATH} className="flag flag-lg" />
        ) : (
          <span className="flag flag-lg" aria-hidden="true" />
        )}
        <input
          id="phone"
          value={value}
          placeholder="+234 801 234 5678"
          onChange={(e) => setValue(e.target.value)}
        />
      </div>

      <div className="readout">
        <div>
          <div className="label">Resolved country</div>
          <div className="value">
            {country ? `${country.emoji} ${country.name} (${country.dialCode})` : 'None yet'}
          </div>
        </div>
      </div>

      <p className="note">
        Try <strong>+1</strong>. Twenty-five countries share it with no area code
        to tell them apart, so this returns the <strong>United States</strong> —
        the primary country libphonenumber names for <code>+1</code>. Sorting
        alphabetically instead would answer American Samoa.
      </p>
    </section>
  );
}

function CurrencySwitcher() {
  const currencies = React.useMemo(
    () => fromApiCurrencies(API_RESPONSE, { priority: DEFAULT_CURRENCY_PRIORITY, basePath: BASE_PATH }),
    []
  );
  const [selected, setSelected] = React.useState('NGN');
  const active = currencies.find((c) => c.code === selected);
  const dropped = API_RESPONSE.filter((r) => !currencies.some((c) => c.code === r.currency_iso));

  return (
    <section className="panel">
      <h2>Currency switcher</h2>
      <p className="hint">
        <code>fromApiCurrencies</code> over a mock <code>GET /currencies</code>.
      </p>

      <label htmlFor="currency">Currency</label>
      <div className="row">
        {active?.flagUrl ? (
          <img src={active.flagUrl} alt="" className="flag flag-lg" />
        ) : (
          <span className="flag flag-lg" aria-hidden="true" />
        )}
        <select id="currency" value={selected} onChange={(e) => setSelected(e.target.value)}>
          {currencies.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.name} ({c.symbol})
            </option>
          ))}
        </select>
      </div>

      <div className="scroll-x">
        <table>
          <thead>
            <tr>
              <th>Flag</th>
              <th>Code</th>
              <th>country_code</th>
              <th>flagCode</th>
            </tr>
          </thead>
          <tbody>
            {currencies.map((c) => (
              <tr key={c.code}>
                <td>
                  {c.flagUrl ? (
                    <img src={c.flagUrl} alt="" className="flag" />
                  ) : (
                    <span className="dial">—</span>
                  )}
                </td>
                <td>{c.code}</td>
                <td className="mono">{c.countryCode ?? 'null'}</td>
                <td className="mono">{c.flagCode ?? 'null'}</td>
              </tr>
            ))}
            {dropped.map((r) => (
              <tr key={r.currency_iso} className="dropped">
                <td>
                  <span className="dial">—</span>
                </td>
                <td>{r.currency_iso}</td>
                <td className="mono">{r.country_code ?? 'null'}</td>
                <td className="mono">inactive</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="note">
        <strong>EUR</strong> arrives as <code>DE</code> and keeps it as its
        country, but displays the <strong>EU</strong> flag — a euro price beside
        a German flag is wrong. <strong>KES</strong> arrives with a null
        <code> country_code</code> and still finds Kenya through the static
        fallback. <strong>XPF</strong> maps to nothing and degrades to no flag
        without disturbing its neighbours. <strong>SEK</strong> is inactive and
        never reaches the list.
      </p>
    </section>
  );
}

function App() {
  return (
    <div className="wrap">
      <header>
        <h1>@khaime-team/country-flags</h1>
        <p>
          One source of country, dial-code, currency and flag data. Every flag
          below is a bundled SVG from <code>flags/</code> — no CDN, no network.
        </p>
      </header>
      <div className="grid">
        <CountryPicker />
        <PhoneInput />
        <CurrencySwitcher />
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
