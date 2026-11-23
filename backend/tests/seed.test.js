const fs = require('node:fs');
const path = require('node:path');
const { generateStrokes, generateSeedSql, letters } = require('../db/generate-strokes');

function transform(strokes, pointTransform) {
  return strokes.map((stroke) => ({
    ...stroke,
    points: stroke.points.map(pointTransform),
  }));
}

describe('generated seed data', () => {
  test('contains 26 distinct lower-case letters and ordered stroke data', () => {
    const strokes = generateStrokes();
    expect(letters).toHaveLength(26);
    expect(new Set(letters.map(([symbol]) => symbol)).size).toBe(26);
    for (const [symbol] of letters) {
      expect(strokes[symbol].length).toBeGreaterThan(0);
      expect(strokes[symbol].map((stroke) => stroke.order)).toEqual(
        strokes[symbol].map((_, index) => index + 1),
      );
      expect(strokes[symbol].every((stroke) => stroke.points.length > 0)).toBe(true);
    }
  });

  test('derives b, d, p, and q from exact geometric transforms and keeps seed generated', () => {
    const strokes = generateStrokes();
    expect(strokes.d).toEqual(transform(strokes.b, ([x, y]) => [1 - x, y]));
    expect(strokes.p).toEqual(transform(strokes.b, ([x, y]) => [x, 0.6 - y]));
    expect(strokes.q).toEqual(transform(strokes.b, ([x, y]) => [1 - x, 0.6 - y]));
    const seedPath = path.join(__dirname, '..', 'db', 'seed.sql');
    expect(fs.readFileSync(seedPath, 'utf8')).toBe(generateSeedSql());
  });

  test('activates all five implemented exercise types in the generated seed', () => {
    const section = generateSeedSql().split('insert into exercise_types')[1].split('on conflict')[0];
    for (const id of ['listen_choose', 'discriminate', 'match_pairs', 'trace', 'syllable_build']) {
      expect(section).toMatch(new RegExp(`\\('${id}',[^\\n]*, true, \\d+\\)`));
    }
    expect(section).not.toMatch(/,\s*false,\s*\d+\)/);
  });
});
