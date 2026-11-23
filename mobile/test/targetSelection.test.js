const assert = require('node:assert/strict');
const test = require('node:test');
const { randomTargets } = require('../src/exercises/targetSelection');

test('randomizes recommendation targets without repeating the current set', () => {
  const pool = ['a', 'b', 'c', 'd', 'e'];
  const current = ['a', 'b', 'c'];
  const targets = randomTargets(pool, current, 3, () => 0);

  assert.equal(targets.length, 3);
  assert.equal(new Set(targets).size, 3);
  assert.ok(targets.every((symbol) => pool.includes(symbol)));
  assert.notDeepEqual([...targets].sort(), [...current].sort());
});

test('returns every available target when fewer than the requested count exist', () => {
  const targets = randomTargets(['b', 'd'], [], 3, () => 0);
  assert.equal(targets.length, 2);
  assert.deepEqual(new Set(targets), new Set(['b', 'd']));
});
