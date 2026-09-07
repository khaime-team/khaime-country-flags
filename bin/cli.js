#!/usr/bin/env node
/**
 * Copies the bundled flag SVGs into an app's public directory.
 *
 *   npx khaime-country-flags copy public/flags
 *
 * Apps run this in a build or postinstall step; the SVGs are static, so
 * committing the copy is fine too.
 */
const { cpSync, mkdirSync } = require('node:fs');
const { join, resolve } = require('node:path');

const [command, target] = process.argv.slice(2);

if (command !== 'copy' || !target) {
  console.error('usage: khaime-country-flags copy <destination-directory>');
  process.exit(1);
}

const source = join(__dirname, '..', 'flags');
const destination = resolve(process.cwd(), target);

mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });

console.log(`Copied flag SVGs to ${destination}`);
