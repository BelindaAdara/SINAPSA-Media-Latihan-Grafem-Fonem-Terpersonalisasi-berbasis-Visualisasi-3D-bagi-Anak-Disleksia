const assert = require('node:assert/strict');
const test = require('node:test');
const { buildItems } = require('../src/exercises/buildItems');

const letters = [
  { symbol: 'a', category: 'vowel', similar_to: ['e', 'o'], is_lookalike: false, tts_syllable: 'a', strokes: [] },
  { symbol: 'b', category: 'consonant', similar_to: ['d', 'p'], is_lookalike: true, tts_syllable: 'ba', strokes: { strokes: [{ order: 1, type: 'line', points: [[0.2, 0], [0.2, 1]] }] } },
  { symbol: 'd', category: 'consonant', similar_to: ['b', 'q'], is_lookalike: true, tts_syllable: 'da', strokes: [] },
  { symbol: 'e', category: 'vowel', similar_to: ['a'], is_lookalike: false, tts_syllable: 'e', strokes: [] },
  { symbol: 'o', category: 'vowel', similar_to: ['a'], is_lookalike: false, tts_syllable: 'o', strokes: [] },
  { symbol: 'p', category: 'consonant', similar_to: ['q', 'b'], is_lookalike: true, tts_syllable: 'pa', strokes: [] },
  { symbol: 'q', category: 'consonant', similar_to: ['p', 'd'], is_lookalike: true, tts_syllable: 'ka', strokes: [] },
];
const settings = { session_length: 6, choice_count: 3 };
const random = () => 0.3;

test('builds the configured number of shuffled listen questions without mutating input', () => {
  const targets = ['a', 'b'];
  const items = buildItems('listen_choose', targets, settings, letters, [], random);
  assert.equal(items.length, 6);
  assert.deepEqual(targets, ['a', 'b']);
  assert.ok(items.every((item) => item.choices.length === 3 && item.choices.some((choice) => choice.symbol === item.letter)));
  assert.ok(items.every((item, index) => index === 0 || item.letter !== items[index - 1].letter));
});

test('builds lookalike, four-pair, trace, and word items', () => {
  const discriminate = buildItems('discriminate', ['a', 'b'], settings, letters, [], random);
  assert.ok(discriminate.every((item) => ['b', 'd'].includes(item.letter)));
  assert.ok(discriminate.every((item) => item.choices.some((choice) => choice.symbol === item.letter && !choice.mirrored)));
  const pairs = buildItems('match_pairs', ['b'], settings, letters, [], random);
  assert.equal(pairs[0].pairs.length, 4);
  const trace = buildItems('trace', ['b'], settings, letters, [], random);
  assert.equal(trace[0].letter, 'b');
  const syllables = buildItems('syllable_build', ['b'], settings, letters, [{ word: 'baju', syllables: ['ba', 'ju'] }], random);
  assert.equal(syllables[0].correct_value, 'baju');
  assert.notDeepEqual(syllables[0].tiles.map((tile) => tile.letter), ['b', 'a', 'j', 'u']);
});

test('rejects empty or unsupported target sets', () => {
  assert.throws(() => buildItems('listen_choose', [], settings, letters), /Pilih setidaknya satu/);
  assert.throws(() => buildItems('discriminate', ['a'], settings, letters), /Belum ada huruf/);
  assert.throws(() => buildItems('listen_choose', ['a'], { ...settings, session_length: 0 }, letters), /antara 1 dan 30/);
  assert.throws(() => buildItems('listen_choose', ['a'], { ...settings, choice_count: 5 }, letters), /antara 2 dan 4/);
  assert.throws(() => buildItems('syllable_build', ['z'], settings, letters, [{ word: 'baju' }]), /Belum ada huruf/);
});
