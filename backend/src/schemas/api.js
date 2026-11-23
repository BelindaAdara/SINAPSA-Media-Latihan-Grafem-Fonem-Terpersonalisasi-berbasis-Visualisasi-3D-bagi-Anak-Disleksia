const { z } = require('zod');

const uuid = z.string().uuid();
const childId = z.object({ id: uuid });
const dashboardChildId = z.object({ childId: uuid });
const sessionId = z.object({ id: uuid });
const letterSymbol = z.object({ symbol: z.string().regex(/^[a-z]$/) });
const exerciseId = z.object({ id: z.string().min(1) });
const avatar = z.enum(['bintang', 'awan', 'bulan', 'daun', 'roket', 'kucing']);
const childCreate = z.object({
  name: z.string().trim().min(1).max(30),
  age: z.number().int().min(3).max(15),
  avatar_key: avatar.default('bintang'),
});
const childUpdate = z.object({
  name: z.string().trim().min(1).max(30).optional(),
  age: z.number().int().min(3).max(15).optional(),
  avatar_key: avatar.optional(),
  weekly_target: z.number().int().min(1).max(14).optional(),
}).refine((value) => Object.keys(value).length > 0, 'Isi setidaknya satu data untuk diubah.');
const childSettings = z.object({
  font_scale: z.number().min(0.85).max(1.5).optional(),
  letter_spacing: z.number().min(0).max(0.3).optional(),
  speech_rate: z.number().min(0.4).max(1.2).optional(),
  choice_count: z.number().int().min(2).max(4).optional(),
  session_length: z.number().int().min(5).max(20).optional(),
}).refine((value) => Object.keys(value).length > 0, 'Isi setidaknya satu pengaturan.');

const sessionItem = z.object({
  item_index: z.number().int().min(0).max(32767),
  letter: z.string().regex(/^[a-z]$/),
  is_correct: z.boolean(),
  resolved: z.boolean(),
  attempts: z.number().int().min(1).max(3),
  hint_used: z.boolean(),
  response_ms: z.number().int().min(0).max(120000).nullable().optional(),
  chosen_value: z.string().max(20).nullable().optional(),
}).superRefine((item, context) => {
  if (item.is_correct && (!item.resolved || item.attempts !== 1 || item.hint_used)) {
    context.addIssue({ code: 'custom', message: 'Jawaban benar langsung harus selesai pada percobaan pertama.' });
  }
  if (!item.is_correct && item.resolved && item.attempts < 2) {
    context.addIssue({ code: 'custom', message: 'Jawaban yang akhirnya benar memerlukan percobaan ulang.' });
  }
  if (!item.resolved && (item.attempts !== 3 || !item.hint_used)) {
    context.addIssue({ code: 'custom', message: 'Jawaban perlu ditampilkan setelah tiga percobaan dan petunjuk.' });
  }
});
const createSession = z.object({
  child_id: uuid,
  name: z.string().trim().min(1).max(60),
  exercise_type: z.string().min(1),
  started_at: z.string().datetime({ offset: true }),
  ended_at: z.string().datetime({ offset: true }),
  mood: z.enum(['happy', 'neutral', 'sad']).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  items: z.array(sessionItem).min(1).max(30),
}).refine((value) => Date.parse(value.ended_at) >= Date.parse(value.started_at), {
  message: 'Waktu selesai harus sama atau setelah waktu mulai.',
  path: ['ended_at'],
}).refine((value) => new Set(value.items.map((item) => item.item_index)).size === value.items.length, {
  message: 'Nomor item tidak boleh berulang.',
  path: ['items'],
});
const updateSession = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  note: z.string().max(500).nullable().optional(),
  mood: z.enum(['happy', 'neutral', 'sad']).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, 'Isi setidaknya satu data untuk diubah.');

const listLetters = z.object({
  category: z.enum(['vowel', 'consonant']).optional(),
  lookalike: z.enum(['true', 'false']).optional(),
  q: z.string().trim().max(50).optional(),
  child_id: uuid.optional(),
});
const letterDetailQuery = z.object({ child_id: uuid.optional() });
const listWords = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50) });
const listSessions = z.object({
  child_id: uuid,
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
}).refine((value) => !value.from || !value.to || Date.parse(value.from) <= Date.parse(value.to), {
  message: 'Tanggal awal harus sama atau sebelum tanggal akhir.',
  path: ['from'],
});
const listRecommendations = z.object({ limit: z.coerce.number().int().min(1).max(8).default(3) });
const progressQuery = z.object({ month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional() });

module.exports = {
  childId, dashboardChildId, sessionId, letterSymbol, exerciseId, childCreate, childUpdate, childSettings,
  createSession, updateSession, listLetters, letterDetailQuery, listWords, listSessions, listRecommendations, progressQuery,
};
