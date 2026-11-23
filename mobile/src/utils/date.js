export function dateInTimezone(value, timezone = 'Asia/Jakarta') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function weekLabel(date) {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString('id-ID', { weekday: 'short', timeZone: 'UTC' });
}
