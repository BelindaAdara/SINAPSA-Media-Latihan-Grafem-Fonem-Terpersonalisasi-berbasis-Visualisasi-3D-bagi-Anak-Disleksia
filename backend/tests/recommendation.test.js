const { recommendLetters } = require('../src/services/recommendation');

const letters = [
  { symbol: 'a', difficulty: 1, sort_order: 1 },
  { symbol: 'b', difficulty: 3, sort_order: 2 },
  { symbol: 'c', difficulty: 2, sort_order: 3 },
];

describe('recommendations', () => {
  test('starts unseen children with easier letters and gives a gentle reason', () => {
    expect(recommendLetters({ letters, now: new Date('2026-11-23T00:00:00Z'), limit: 3 })).toEqual([
      { letter: 'a', score: 50, reason: 'belum pernah dicoba' },
      { letter: 'c', score: 50, reason: 'belum pernah dicoba' },
      { letter: 'b', score: 50, reason: 'belum pernah dicoba' },
    ]);
  });

  test('uses error priority and inserts a frequent confusion partner', () => {
    const result = recommendLetters({
      letters,
      mastery: [
        { letter: 'a', score: 20, attempts: 4, wrong: 3, last_seen_at: '2026-11-22T00:00:00Z' },
        { letter: 'b', score: 80, attempts: 5, wrong: 0, last_seen_at: '2026-11-23T00:00:00Z' },
        { letter: 'c', score: 70, attempts: 4, wrong: 1, last_seen_at: '2026-11-23T00:00:00Z' },
      ],
      confusions: [{ target: 'a', chosen: 'b', count: 3 }],
      now: new Date('2026-11-23T12:00:00Z'),
      limit: 2,
    });
    expect(result.map((entry) => entry.letter)).toEqual(['a', 'b']);
    expect(result[0].reason).toBe('sering tertukar dengan b');
  });
});
