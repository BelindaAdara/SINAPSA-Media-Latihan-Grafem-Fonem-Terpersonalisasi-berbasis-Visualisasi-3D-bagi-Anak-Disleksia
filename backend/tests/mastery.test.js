const { updateMastery, masteryStatus, replayMastery } = require('../src/services/mastery');

describe('mastery rules', () => {
  test('applies direct, assisted, and unresolved item changes in item order with bounds', () => {
    const updated = updateMastery(
      { score: 97, attempts: 2, correct: 1, wrong: 0 },
      [
        { item_index: 2, is_correct: false, resolved: false },
        { item_index: 0, is_correct: true, resolved: true },
        { item_index: 1, is_correct: false, resolved: true },
      ],
      '2026-11-23T10:00:00.000Z',
    );
    expect(updated).toEqual({
      score: 92,
      attempts: 5,
      correct: 2,
      wrong: 1,
      last_seen_at: '2026-11-23T10:00:00.000Z',
    });
    expect(updateMastery({ score: 3 }, [{ item_index: 0, is_correct: false, resolved: false }], null).score).toBe(0);
  });

  test('derives mastery status and replays items chronologically', () => {
    expect(masteryStatus({ attempts: 0 })).toBe('unseen');
    expect(masteryStatus({ attempts: 2, score: 39 })).toBe('needs_practice');
    expect(masteryStatus({ attempts: 4, score: 80 })).toBe('learning');
    expect(masteryStatus({ attempts: 5, score: 75 })).toBe('mastered');
    const result = replayMastery([
      { started_at: '2026-11-02T00:00:00Z', ended_at: '2026-11-02T00:01:00Z', item_index: 0, is_correct: false, resolved: false },
      { started_at: '2026-11-01T00:00:00Z', ended_at: '2026-11-01T00:01:00Z', item_index: 0, is_correct: true, resolved: true },
    ]);
    expect(result.score).toBe(2);
    expect(result.attempts).toBe(2);
    expect(result.wrong).toBe(1);
  });
});
