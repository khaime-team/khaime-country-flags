const { test } = require('node:test');
const assert = require('node:assert/strict');
const { existsSync } = require('node:fs');
const { join } = require('node:path');

const lib = require('../dist/index.js');

test('every country has a bundled SVG matching hasFlag', () => {
  for (const c of lib.countries) {
    const present = existsSync(join(__dirname, '..', 'flags', `${c.code.toLowerCase()}.svg`));
    assert.equal(c.hasFlag, present, `${c.code} hasFlag=${c.hasFlag} but file present=${present}`);
  }
});

test('flagEmoji computes glyphs without a lookup table', () => {
  assert.equal(lib.flagEmoji('NG'), '\u{1F1F3}\u{1F1EC}');
  assert.equal(lib.flagEmoji('gb'), '\u{1F1EC}\u{1F1E7}');
  assert.equal(lib.flagEmoji(''), '');
  assert.equal(lib.flagEmoji(null), '');
  assert.equal(lib.flagEmoji('XYZ'), '');
});

test('flagUrl builds a path and tolerates a trailing slash', () => {
  assert.equal(lib.flagUrl('NG'), '/flags/ng.svg');
  assert.equal(lib.flagUrl('NG', { basePath: '/assets/flags/' }), '/assets/flags/ng.svg');
  assert.equal(lib.flagUrl(null), '');
});

test('lookups resolve', () => {
  assert.equal(lib.getCountryByCode('ng').name, 'Nigeria');
  assert.equal(lib.getCountryByCode('NG').dialCode, '+234');
  assert.equal(lib.getCountryByName('nigeria').code, 'NG');
  assert.equal(lib.getCountryByCode('zz'), undefined);
});

test('longest dial code wins so +1 does not shadow +1242', () => {
  assert.equal(lib.getCountryByPhoneNumber('+12425551234').code, 'US', 'NANP shares a bare +1; the primary country wins');
  assert.equal(lib.getCountryByPhoneNumber('+12125551234').dialCode, '+1');
  assert.equal(lib.getCountryByPhoneNumber('+2348012345678').code, 'NG');
});

test('shared dial codes are all reachable', () => {
  const plusOne = lib.getCountriesByDialCode('1');
  assert.ok(plusOne.length > 2);
  assert.ok(plusOne.some((c) => c.code === 'US'));
  assert.ok(plusOne.some((c) => c.code === 'CA'));
});

test('EUR resolves to Germany for country data but the EU flag for display', () => {
  assert.equal(lib.getCountryForCurrency('EUR').code, 'DE');
  assert.equal(lib.currencyFlagCode('EUR'), 'EU');
  assert.equal(lib.currencyFlagUrl('EUR'), '/flags/eu.svg');
  assert.equal(lib.currencyFlagEmoji('EUR'), '\u{1F1EA}\u{1F1FA}');
});

test('non-euro currencies use their own country flag', () => {
  assert.equal(lib.currencyFlagCode('NGN'), 'NG');
  assert.equal(lib.currencyFlagUrl('ngn'), '/flags/ng.svg');
  assert.equal(lib.currencyFlagEmoji('USD'), '\u{1F1FA}\u{1F1F8}');
  assert.equal(lib.currencyFlagCode('ZZZ'), undefined);
});

test('withPriority puts the given codes first, in order', () => {
  const ordered = lib.withPriority(['NG', 'US', 'GB']);
  assert.deepEqual(ordered.slice(0, 3).map((c) => c.code), ['NG', 'US', 'GB']);
  assert.equal(ordered.length, lib.countries.length);
});

test('searchCountries matches name and dial code', () => {
  assert.ok(lib.searchCountries('niger').some((c) => c.code === 'NG'));
  assert.ok(lib.searchCountries('+234').some((c) => c.code === 'NG'));
  assert.equal(lib.searchCountries('').length, lib.countries.length);
});

test('every mapped currency points at a known country', () => {
  for (const [currency, code] of Object.entries(lib.CURRENCY_TO_COUNTRY)) {
    assert.ok(lib.getCountryByCode(code), `${currency} maps to unknown country ${code}`);
  }
});

test('shared dial codes resolve to their primary country', () => {
  assert.equal(lib.getCountryByDialCode('+1').code, 'US');
  assert.equal(lib.getCountryByDialCode('44').code, 'GB');
  assert.equal(lib.getCountryByDialCode('+234').code, 'NG');
});

test('exactly one primary country per dial code', () => {
  const byDial = new Map();
  for (const c of lib.countries) {
    if (c.isPrimaryForDialCode) byDial.set(c.dialCode, (byDial.get(c.dialCode) ?? 0) + 1);
  }
  for (const [dial, count] of byDial) {
    assert.equal(count, 1, `${dial} has ${count} primary countries`);
  }
  const dialCodes = new Set(lib.countries.map((c) => c.dialCode));
  assert.equal(byDial.size, dialCodes.size, 'every dial code has a primary');
});
