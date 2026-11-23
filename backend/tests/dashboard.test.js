const request = require('supertest');
const { createApp } = require('../src/app');

const childId = 'c2cbba68-39a4-4a0f-95fa-cad38d9f9e35';
const session = {
  id: 'session-one',
  child_id: childId,
  name: 'Latihan pagi',
  exercise_type: 'listen_choose',
  started_at: '2026-11-23T01:10:00.000Z',
  ended_at: '2026-11-23T01:16:30.000Z',
  duration_seconds: 390,
  total_items: 1,
  correct_items: 1,
  score: 100,
};
const letters = [{ symbol: 'a', difficulty: 1, sort_order: 1 }];
const item = {
  session_id: session.id,
  item_index: 0,
  letter: 'a',
  is_correct: true,
  resolved: true,
  attempts: 1,
  response_ms: 1200,
  chosen_value: 'a',
};

function repository() {
  return {
    getChild: async () => ({ id: childId, name: 'Rara', age: 7, weekly_target: 5, avatar_key: 'bintang', timezone: 'Asia/Jakarta' }),
    getAllSessions: async () => [session],
    getItemsForChild: async () => [item],
    getLetters: async () => letters,
    getMasteryForChild: async () => [],
    getConfusions: async () => [],
  };
}

describe('dashboard and progress API', () => {
  const now = () => new Date('2026-11-23T05:00:00.000Z');

  test('returns a Monday-first week and a child-friendly last-session card', async () => {
    const response = await request(createApp({ repository: repository(), now }))
      .get(`/api/v1/dashboard/${childId}`)
      .expect(200);
    expect(response.body.data.week.start).toBe('2026-11-23');
    expect(response.body.data.week.days).toHaveLength(7);
    expect(response.body.data.week.days[0]).toMatchObject({ label: 'Sen', sessions: 1, trained: true });
    expect(response.body.data.week.sessions_count).toBe(1);
    expect(response.body.data.last_session.id).toBe(session.id);
  });

  test('aggregates progress and rejects invalid query values', async () => {
    const app = createApp({ repository: repository(), now });
    const response = await request(app).get(`/api/v1/progress/${childId}?month=2026-11`).expect(200);
    expect(response.body.data.totals).toEqual({ sessions: 1, correct_items: 1, study_seconds: 390 });
    expect(response.body.data.weekly_accuracy).toHaveLength(8);
    expect(response.body.data.heatmap).toHaveLength(84);
    expect(response.body.data.mastery_map).toEqual([{ letter: 'a', score: 0, attempts: 0, status: 'unseen' }]);
    await request(app).get(`/api/v1/progress/${childId}?month=November`).expect(400);
    await request(app).get('/api/v1/dashboard/not-a-uuid').expect(400);
  });
});
