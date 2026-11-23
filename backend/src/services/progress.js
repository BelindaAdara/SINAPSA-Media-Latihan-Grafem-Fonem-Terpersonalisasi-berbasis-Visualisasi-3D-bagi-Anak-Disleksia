const { dateInTimezone, shiftDate, calculateStreak } = require('./streak');
const { masteryStatus } = require('./mastery');

function mondayOf(date) {
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return shiftDate(date, day === 0 ? -6 : 1 - day);
}

function buildProgress({ child, sessions, items, mastery, letters, month, now = new Date() }) {
  const timezone = child.timezone || 'Asia/Jakarta';
  const localToday = dateInTimezone(now, timezone);
  const selectedMonth = month || localToday.slice(0, 7);
  const monthStart = `${selectedMonth}-01`;
  const nextMonth = new Date(`${monthStart}T00:00:00.000Z`);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  const datedSessions = sessions.map((session) => ({
    ...session,
    localDate: dateInTimezone(session.started_at, timezone),
  }));
  const sessionCounts = new Map();
  for (const session of datedSessions) {
    sessionCounts.set(session.localDate, (sessionCounts.get(session.localDate) || 0) + 1);
  }
  const totalCorrect = items.filter((item) => item.is_correct).length;
  const weeklyAccuracy = [];
  const currentWeek = mondayOf(localToday);
  for (let index = 7; index >= 0; index -= 1) {
    const weekStart = shiftDate(currentWeek, -7 * index);
    const weekEnd = shiftDate(weekStart, 7);
    const weekItems = items.filter((item) => {
      const parent = sessionById.get(item.session_id);
      if (!parent) return false;
      const date = dateInTimezone(parent.started_at, timezone);
      return date >= weekStart && date < weekEnd;
    });
    weeklyAccuracy.push({
      week_start: weekStart,
      accuracy: weekItems.length ? weekItems.filter((item) => item.is_correct).length / weekItems.length : null,
      items: weekItems.length,
    });
  }
  const calendar = [];
  for (let date = monthStart; date < nextMonth.toISOString().slice(0, 10); date = shiftDate(date, 1)) {
    calendar.push({ date, sessions: sessionCounts.get(date) || 0 });
  }
  const heatmap = [];
  const heatmapStart = shiftDate(localToday, -83);
  for (let date = heatmapStart; date <= localToday; date = shiftDate(date, 1)) {
    heatmap.push({ date, sessions: sessionCounts.get(date) || 0 });
  }
  const avgResponses = sessions.map((session) => {
    const responseTimes = items
      .filter((item) => item.session_id === session.id && item.response_ms !== null && item.response_ms !== undefined)
      .map((item) => item.response_ms);
    return responseTimes.length ? responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length : null;
  }).filter((value) => value !== null && value !== undefined);
  const confusionCounts = new Map();
  for (const item of items) {
    if (item.chosen_value && item.chosen_value !== item.letter) {
      const key = `${item.letter}:${item.chosen_value}`;
      confusionCounts.set(key, (confusionCounts.get(key) || 0) + 1);
    }
  }
  const topConfusions = [...confusionCounts.entries()]
    .map(([key, count]) => {
      const [target, chosen] = key.split(':');
      return { target, chosen, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totals: {
      sessions: sessions.length,
      correct_items: totalCorrect,
      study_seconds: sessions.reduce((sum, session) => sum + session.duration_seconds, 0),
    },
    weekly_accuracy: weeklyAccuracy,
    calendar,
    heatmap,
    records: {
      longest_streak: calculateStreak(sessions, timezone, now).longest,
      best_score: sessions.length ? Math.max(...sessions.map((session) => session.score)) : 0,
      fastest_avg_response_ms: avgResponses.length ? Math.min(...avgResponses) : null,
    },
    mastery_map: letters.map((letter) => {
      const entry = mastery.find((value) => value.letter === letter.symbol) || { score: 0, attempts: 0 };
      return { letter: letter.symbol, score: entry.score, attempts: entry.attempts, status: masteryStatus(entry) };
    }),
    top_confusions: topConfusions,
  };
}

module.exports = { buildProgress, mondayOf };
