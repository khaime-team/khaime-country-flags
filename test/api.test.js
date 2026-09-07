const { test } = require('node:test');
const assert = require('node:assert/strict');

const { fromApiCurrencies, DEFAULT_CURRENCY_PRIORITY } = require('../dist/index.js');

const row = (over = {}) => ({
  currency_iso: 'NGN',
  currency_symbol: '₦',
  country_code: 'NG',
  country_name: 'Nigeria',
  is_active: true,
  ...over,
});

test('resolves a normal row', () => {
  const [ngn] = fromApiCurrencies([row()]);
  assert.deepEqual(ngn, {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigeria',
    countryCode: 'NG',
    flagCode: 'NG',
    flagUrl: '/flags/ng.svg',
    emoji: '\u{1F1F3}\u{1F1EC}',
  });
});

test('a null country_code does not throw and falls back to the static map', () => {
  const [ngn] = fromApiCurrencies([row({ country_code: null })]);
  assert.equal(ngn.countryCode, 'NG');
  assert.equal(ngn.flagUrl, '/flags/ng.svg');
});

test('one unmappable row does not take out the others', () => {
  const out = fromApiCurrencies([
    row({ currency_iso: 'ZZZ', country_code: null, country_name: null }),
    row(),
  ]);
  assert.equal(out.length, 2);
  assert.equal(out[0].flagUrl, '', 'unmappable row degrades to an empty flag');
  assert.equal(out[0].name, 'ZZZ', 'falls back to the code as a label');
  assert.equal(out[1].flagUrl, '/flags/ng.svg', 'the mappable row is untouched');
});

test('the API wins for countryCode, the bloc override wins for the flag', () => {
  const [eur] = fromApiCurrencies([
    row({ currency_iso: 'EUR', currency_symbol: '€', country_code: 'DE', country_name: 'Germany' }),
  ]);
  assert.equal(eur.countryCode, 'DE');
  assert.equal(eur.flagCode, 'EU');
  assert.equal(eur.flagUrl, '/flags/eu.svg');
});

test('inactive rows are dropped, missing is_active counts as active', () => {
  assert.equal(fromApiCurrencies([row({ is_active: false })]).length, 0);
  assert.equal(fromApiCurrencies([row({ is_active: undefined })]).length, 1);
  assert.equal(fromApiCurrencies([row({ is_active: null })]).length, 1);
  assert.equal(fromApiCurrencies([row({ is_active: false })], { activeOnly: false }).length, 1);
});

test('empty and malformed input is tolerated', () => {
  assert.deepEqual(fromApiCurrencies(null), []);
  assert.deepEqual(fromApiCurrencies(undefined), []);
  assert.deepEqual(fromApiCurrencies([]), []);
  assert.deepEqual(fromApiCurrencies([{ currency_iso: '' }, { currency_iso: '  ' }]), []);
});

test('duplicates keep the first occurrence', () => {
  const out = fromApiCurrencies([row(), row({ currency_symbol: 'N' })]);
  assert.equal(out.length, 1);
  assert.equal(out[0].symbol, '₦');
});

test('codes and country codes are normalised to uppercase', () => {
  const [c] = fromApiCurrencies([row({ currency_iso: 'ngn', country_code: 'ng' })]);
  assert.equal(c.code, 'NGN');
  assert.equal(c.countryCode, 'NG');
});

test('missing symbol falls back to the code', () => {
  assert.equal(fromApiCurrencies([row({ currency_symbol: null })])[0].symbol, 'NGN');
});

test('missing country_name falls back to this package name', () => {
  assert.equal(fromApiCurrencies([row({ country_name: null })])[0].name, 'Nigeria');
});

test('priority sorts to the front and is stable behind it', () => {
  const rows = [
    row({ currency_iso: 'KES', country_code: 'KE' }),
    row({ currency_iso: 'USD', country_code: 'US' }),
    row({ currency_iso: 'ZAR', country_code: 'ZA' }),
    row({ currency_iso: 'NGN' }),
  ];
  const codes = fromApiCurrencies(rows, { priority: DEFAULT_CURRENCY_PRIORITY }).map((c) => c.code);
  assert.deepEqual(codes, ['NGN', 'USD', 'KES', 'ZAR']);

  const unranked = fromApiCurrencies(
    [row({ currency_iso: 'AAA' }), row({ currency_iso: 'BBB' })],
    { priority: ['NGN'] }
  ).map((c) => c.code);
  assert.deepEqual(unranked, ['AAA', 'BBB'], 'equal rank keeps API order');
});

test('basePath threads through to flagUrl', () => {
  const [c] = fromApiCurrencies([row()], { basePath: '/static/flags' });
  assert.equal(c.flagUrl, '/static/flags/ng.svg');
});
