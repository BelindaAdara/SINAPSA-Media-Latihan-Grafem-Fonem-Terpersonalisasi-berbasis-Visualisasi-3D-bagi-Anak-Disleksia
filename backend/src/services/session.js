const { updateMastery } = require('./mastery');

function summarizeSession(payload) {
  const totalItems = payload.items.length;
  const correctItems = payload.items.filter((item) => item.is_correct).length;
  const started = Date.parse(payload.started_at);
  const ended = Date.parse(payload.ended_at);
  return {
    total_items: totalItems,
    correct_items: correctItems,
    score: Math.round((correctItems / totalItems) * 100),
    duration_seconds: Math.round((ended - started) / 1000),
  };
}

async function createSession(payload, repository) {
  const [child, exercise, letters] = await Promise.all([
    repository.getChild(payload.child_id),
    repository.getExerciseType(payload.exercise_type),
    repository.getLettersBySymbols([...new Set(payload.items.map((item) => item.letter))]),
  ]);
  if (!child) return { notFound: 'Child not found' };
  if (!exercise) return { notFound: 'Exercise type not found' };
  if (!exercise.is_active) return { validationError: 'Jenis latihan ini belum tersedia.' };
  if (letters.length !== new Set(payload.items.map((item) => item.letter)).size) {
    return { validationError: 'Ada huruf yang belum tersedia.' };
  }
  const metrics = summarizeSession(payload);
  const session = {
    child_id: payload.child_id,
    name: payload.name,
    exercise_type: payload.exercise_type,
    started_at: payload.started_at,
    ended_at: payload.ended_at,
    ...metrics,
    mood: payload.mood || null,
    note: payload.note || null,
  };
  const masteryUpdates = [];
  for (const letter of new Set(payload.items.map((item) => item.letter))) {
    const matchingItems = payload.items.filter((item) => item.letter === letter);
    const current = await repository.getMastery(payload.child_id, letter) || { score: 0, attempts: 0, correct: 0, wrong: 0 };
    const next = updateMastery(current, matchingItems, payload.ended_at);
    masteryUpdates.push({
      letter,
      score_before: current.score || 0,
      score_after: next.score,
      values: next,
    });
  }
  const created = await repository.createSessionAtomic(
    session,
    payload.items,
    masteryUpdates.map(({ letter, values }) => ({ letter, ...values })),
  );
  return {
    data: {
      session: {
        id: created.id,
        score: metrics.score,
        total_items: metrics.total_items,
        correct_items: metrics.correct_items,
        duration_seconds: metrics.duration_seconds,
      },
      mastery_updates: masteryUpdates.map(({ values, ...entry }) => entry),
    },
  };
}

module.exports = { summarizeSession, createSession };
