'use strict';
// Regression smoke test (P1-1): cli.js must load and print usage for an
// unknown command instead of dying with a ReferenceError or connecting.
const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

test('cli loads and prints usage on unknown command', () => {
  const cli = path.join(__dirname, '..', 'src', 'cli.js');
  const r = spawnSync(process.execPath, [cli, '__smoke_unknown__'], { encoding: 'utf8', timeout: 20000 });
  assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}: ${r.stderr}`);
  assert.match(r.stderr + r.stdout, /usage: cli\.js/);
});
