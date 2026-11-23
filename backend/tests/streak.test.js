const { calculateStreak, dateInTimezone } = require('../src/services/streak');

describe('streak calculation', () => {
  test('groups sessions by local calendar day and keeps yesterday active', () => {
    const sessions = [
      { started_at: '2026-11-20T18:30:00.000Z' },
      { started_at: '2026-11-21T18:30:00.000Z' },
      { started_at: '2026-11-22T18:30:00.000Z' },
      { started_at: '2026-11-23T18:30:00.000Z' },
    ];
    const today = new Date('2026-11-24T02:00:00.000Z');
    expect(dateInTimezone(sessions[0].started_at, 'Asia/Jakarta')).toBe('2026-11-21');
    expect(calculateStreak(sessions, 'Asia/Jakarta', today)).toEqual({ current: 4, longest: 4 });
  });

  test('returns zero for no history and detects a broken run', () => {
    expect(calculateStreak([], 'Asia/Jakarta', new Date('2026-11-23T00:00:00Z'))).toEqual({ current: 0, longest: 0 });
    const sessions = [
      { started_at: '2026-11-18T04:00:00Z' },
      { started_at: '2026-11-20T04:00:00Z' },
      { started_at: '2026-11-21T04:00:00Z' },
    ];
    expect(calculateStreak(sessions, 'Asia/Jakarta', new Date('2026-11-22T10:00:00Z'))).toEqual({ current: 2, longest: 2 });
  });
});
