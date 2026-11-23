const request = require('supertest');
const { createApp } = require('../src/app');

const childId = 'c2cbba68-39a4-4a0f-95fa-cad38d9f9e35';
const sessionPayload = {
  child_id: childId,
  name: 'Latihan pagi',
  exercise_type: 'listen_choose',
  started_at: '2026-11-23T01:10:00.000Z',
  ended_at: '2026-11-23T01:16:30.000Z',
  mood: 'happy',
  items: [
    { item_index: 0, letter: 'b', is_correct: true, resolved: true, attempts: 1, hint_used: false, response_ms: 2300, chosen_value: 'b' },
    { item_index: 1, letter: 'd', is_correct: false, resolved: true, attempts: 2, hint_used: false, response_ms: 4100, chosen_value: 'b' },
  ],
};

function makeRepository(overrides = {}) {
  const methods = {
    getChild: jest.fn(async () => ({ id: childId })),
    getExerciseType: jest.fn(async () => ({ id: 'listen_choose', is_active: true })),
    getLettersBySymbols: jest.fn(async (symbols) => symbols.map((symbol) => ({ symbol }))),
    createSessionAtomic: jest.fn(async () => ({ id: 'session-id' })),
    getMastery: jest.fn(async () => null),
    upsertMastery: jest.fn(async (_childId, letter, values) => ({ letter, ...values })),
  };
  return { ...methods, ...overrides };
}

describe('POST /api/v1/sessions', () => {
  test('calculates session metrics on the server and saves session/items atomically', async () => {
    const repository = makeRepository();
    const response = await request(createApp({ repository }))
      .post('/api/v1/sessions')
      .send(sessionPayload)
      .expect(201);

    expect(repository.createSessionAtomic).toHaveBeenCalledTimes(1);
    const [session, items] = repository.createSessionAtomic.mock.calls[0];
    expect(session).toMatchObject({
      total_items: 2,
      correct_items: 1,
      score: 50,
      duration_seconds: 390,
    });
    expect(items).toHaveLength(2);
    expect(response.body.data.session).toMatchObject({ id: 'session-id', score: 50, duration_seconds: 390 });
    expect(response.body.data.mastery_updates).toEqual([
      { letter: 'b', score_before: 0, score_after: 10 },
      { letter: 'd', score_before: 0, score_after: 4 },
    ]);
  });

  test('rejects duplicate item indexes and checks active exercise and known letters', async () => {
    const duplicate = structuredClone(sessionPayload);
    duplicate.items[1].item_index = 0;
    await request(createApp({ repository: makeRepository() }))
      .post('/api/v1/sessions').send(duplicate).expect(400);

    const inactive = makeRepository({ getExerciseType: jest.fn(async () => ({ is_active: false })) });
    await request(createApp({ repository: inactive }))
      .post('/api/v1/sessions').send(sessionPayload).expect(400);

    const unknownLetter = makeRepository({
      getLettersBySymbols: jest.fn(async () => [{ symbol: 'b' }]),
    });
    const result = await request(createApp({ repository: unknownLetter }))
      .post('/api/v1/sessions').send(sessionPayload).expect(400);
    expect(result.body.error.code).toBe('VALIDATION_ERROR');
    expect(unknownLetter.createSessionAtomic).not.toHaveBeenCalled();
  });

  test('rejects item outcomes that conflict with the three-attempt rule', async () => {
    const invalid = structuredClone(sessionPayload);
    invalid.items[0] = {
      ...invalid.items[0],
      is_correct: false,
      resolved: false,
      attempts: 2,
      hint_used: false,
    };
    const response = await request(createApp({ repository: makeRepository() }))
      .post('/api/v1/sessions').send(invalid).expect(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('wraps unknown routes and database errors in the documented error shape', async () => {
    const repository = makeRepository({
      getChild: jest.fn(async () => { throw new Error('private database detail'); }),
    });
    const response = await request(createApp({ repository }))
      .post('/api/v1/sessions').send(sessionPayload).expect(500);
    expect(response.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Ada kendala di server. Coba lagi ya.', details: [] },
    });
    expect(JSON.stringify(response.body)).not.toContain('private database detail');
    await request(createApp({ repository: makeRepository() })).get('/api/v1/missing').expect(404);
  });
});
