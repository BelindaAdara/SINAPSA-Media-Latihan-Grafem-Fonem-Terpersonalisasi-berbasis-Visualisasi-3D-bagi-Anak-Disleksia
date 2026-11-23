function dateInTimezone(value, timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const part = (type) => parts.find((entry) => entry.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function shiftDate(date, offset) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

function calculateStreak(sessions, timezone = 'Asia/Jakarta', today = new Date()) {
  const dates = new Set(sessions.map((session) => dateInTimezone(session.started_at || session.ended_at, timezone)));
  if (dates.size === 0) return { current: 0, longest: 0 };

  const ordered = [...dates].sort();
  let longest = 1;
  let run = 1;
  for (let index = 1; index < ordered.length; index += 1) {
    run = ordered[index] === shiftDate(ordered[index - 1], 1) ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const todayDate = dateInTimezone(today, timezone);
  let cursor = dates.has(todayDate) ? todayDate : shiftDate(todayDate, -1);
  let current = 0;
  while (dates.has(cursor)) {
    current += 1;
    cursor = shiftDate(cursor, -1);
  }
  return { current, longest };
}

module.exports = { dateInTimezone, shiftDate, calculateStreak };
