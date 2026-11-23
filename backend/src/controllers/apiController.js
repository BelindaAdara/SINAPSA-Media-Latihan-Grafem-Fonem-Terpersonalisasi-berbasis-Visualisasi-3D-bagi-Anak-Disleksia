const { AppError } = require('../errors');
const { recommendLetters } = require('../services/recommendation');
const { calculateStreak, dateInTimezone, shiftDate } = require('../services/streak');
const { buildProgress, mondayOf } = require('../services/progress');
const { createSession } = require('../services/session');
const { replayMastery } = require('../services/mastery');

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function missing(message = 'Data yang dicari belum ada.') {
  return new AppError(404, 'NOT_FOUND', message);
}

function validation(message) {
  return new AppError(400, 'VALIDATION_ERROR', message);
}

function recommended(repository, childId, limit, now) {
  return Promise.all([
    repository.getLetters(),
    repository.getMasteryForChild(childId),
    repository.getConfusions(childId),
  ]).then(([letters, mastery, confusions]) =>
    recommendLetters({ letters, mastery, confusions, limit, now }));
}

function createApiController(repository, now = () => new Date()) {
  return {
    health: (req, res) => res.json({ data: { status: 'ok' } }),
    listLetters: async (req, res) => {
      const filters = { ...req.query };
      if (filters.lookalike !== undefined && filters.lookalike !== null) filters.lookalike = filters.lookalike === 'true';
      const letters = await repository.getLetters(filters);
      if (req.query.child_id) {
        const mastery = await repository.getMasteryForChild(req.query.child_id);
        const byLetter = new Map(mastery.map((entry) => [entry.letter, entry]));
        letters.forEach((letter) => { letter.mastery = byLetter.get(letter.symbol) || null; });
      }
      res.json({ data: letters });
    },
    getLetter: async (req, res) => {
      const letter = await repository.getLetter(req.params.symbol);
      if (!letter) throw missing('Huruf yang dicari belum ada.');
      if (req.query.child_id) {
        const [mastery, confusions] = await Promise.all([
          repository.getMastery(req.query.child_id, letter.symbol),
          repository.getConfusions(req.query.child_id),
        ]);
        letter.mastery = mastery || null;
        letter.confusions = confusions
          .filter((entry) => entry.target === letter.symbol && entry.count > 0)
          .sort((a, b) => b.count - a.count);
      }
      res.json({ data: letter });
    },
    listWords: async (req, res) => {
      res.json({ data: await repository.getWords(req.query.limit) });
    },
    listExercises: async (req, res) => {
      res.json({ data: await repository.getExercises() });
    },
    getExercise: async (req, res) => {
      const exercise = await repository.getExerciseType(req.params.id);
      if (!exercise) throw missing('Jenis latihan yang dicari belum ada.');
      res.json({ data: exercise });
    },
    createChild: async (req, res) => {
      const child = await repository.createChild(req.body);
      res.status(201).json({ data: child });
    },
    getChild: async (req, res) => {
      const child = await repository.getChild(req.params.id);
      if (!child) throw missing('Profil anak belum ada.');
      res.json({ data: child });
    },
    updateChild: async (req, res) => {
      const child = await repository.updateChild(req.params.id, req.body);
      if (!child) throw missing('Profil anak belum ada.');
      res.json({ data: child });
    },
    updateChildSettings: async (req, res) => {
      const settings = await repository.updateChildSettings(req.params.id, req.body);
      if (!settings) throw missing('Pengaturan profil belum ada.');
      res.json({ data: settings });
    },
    createSession: async (req, res) => {
      const result = await createSession(req.body, repository);
      if (result.notFound) throw missing(result.notFound);
      if (result.validationError) throw validation(result.validationError);
      res.status(201).json({ data: result.data });
    },
    listSessions: async (req, res) => {
      const result = await repository.listSessions(req.query);
      res.json({ data: result.data, meta: { total: result.count, limit: req.query.limit, offset: req.query.offset } });
    },
    getSession: async (req, res) => {
      const session = await repository.getSession(req.params.id);
      if (!session) throw missing('Sesi yang dicari belum ada.');
      const items = await repository.getItemsForSession(session.id);
      res.json({ data: { ...session, items } });
    },
    updateSession: async (req, res) => {
      const session = await repository.updateSession(req.params.id, req.body);
      if (!session) throw missing('Sesi yang dicari belum ada.');
      res.json({ data: session });
    },
    deleteSession: async (req, res) => {
      const session = await repository.getSession(req.params.id);
      if (!session) throw missing('Sesi yang dicari belum ada.');
      const items = await repository.getItemsForSession(session.id);
      await repository.deleteSession(session.id);
      for (const letter of new Set(items.map((item) => item.letter))) {
        const remaining = await repository.getItemsForLetter(session.child_id, letter);
        if (remaining.length === 0) {
          await repository.deleteMastery(session.child_id, letter);
        } else {
          await repository.upsertMastery(session.child_id, letter, replayMastery(remaining));
        }
      }
      res.json({ data: { deleted: true } });
    },
    dashboard: async (req, res) => {
      const child = await repository.getChild(req.params.childId);
      if (!child) throw missing('Profil anak belum ada.');
      const timezone = child.timezone || 'Asia/Jakarta';
      const today = now();
      const todayLocal = dateInTimezone(today, timezone);
      const weekStart = mondayOf(todayLocal);
      const sessions = await repository.getAllSessions(child.id);
      const daySessions = new Map();
      for (const session of sessions) {
        const date = dateInTimezone(session.started_at, timezone);
        daySessions.set(date, [...(daySessions.get(date) || []), session]);
      }
      const days = Array.from({ length: 7 }, (_, index) => {
        const date = shiftDate(weekStart, index);
        const matching = daySessions.get(date) || [];
        const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
        return {
          date,
          label: DAY_LABELS[weekday],
          sessions: matching.length,
          duration_seconds: matching.reduce((sum, session) => sum + session.duration_seconds, 0),
          trained: matching.length > 0,
        };
      });
      const weekSessions = sessions.filter((session) => {
        const date = dateInTimezone(session.started_at, timezone);
        return date >= weekStart && date < shiftDate(weekStart, 7);
      });
      const recent = sessions.slice().sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at))[0] || null;
      const recommendedLetters = await recommended(repository, child.id, 3, today);
      res.json({
        data: {
          child: { id: child.id, name: child.name, weekly_target: child.weekly_target, avatar_key: child.avatar_key },
          week: {
            start: weekStart,
            days,
            sessions_count: weekSessions.length,
            duration_seconds: weekSessions.reduce((sum, session) => sum + session.duration_seconds, 0),
          },
          streak: calculateStreak(sessions, timezone, today),
          last_session: recent && {
            id: recent.id,
            name: recent.name,
            exercise_type: recent.exercise_type,
            score: recent.score,
            started_at: recent.started_at,
          },
          recommended_letters: recommendedLetters,
        },
      });
    },
    progress: async (req, res) => {
      const child = await repository.getChild(req.params.childId);
      if (!child) throw missing('Profil anak belum ada.');
      const [sessions, items, mastery, letters] = await Promise.all([
        repository.getAllSessions(child.id),
        repository.getItemsForChild(child.id),
        repository.getMasteryForChild(child.id),
        repository.getLetters(),
      ]);
      res.json({ data: buildProgress({ child, sessions, items, mastery, letters, month: req.query.month, now: now() }) });
    },
    recommendations: async (req, res) => {
      const child = await repository.getChild(req.params.childId);
      if (!child) throw missing('Profil anak belum ada.');
      res.json({ data: await recommended(repository, child.id, req.query.limit, now()) });
    },
  };
}

module.exports = { createApiController };
