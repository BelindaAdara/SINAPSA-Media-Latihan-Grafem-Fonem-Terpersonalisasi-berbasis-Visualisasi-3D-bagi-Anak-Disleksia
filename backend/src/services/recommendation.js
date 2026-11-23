function daysBetween(later, earlier) {
  return Math.max(0, (Date.parse(later) - Date.parse(earlier)) / 86400000);
}

function recommendLetters({ letters, mastery = [], confusions = [], now = new Date(), limit = 3 }) {
  const masteryByLetter = new Map(mastery.map((entry) => [entry.letter, entry]));
  const confusionCounts = new Map();
  for (const entry of confusions) {
    const key = `${entry.target}:${entry.chosen}`;
    confusionCounts.set(key, (confusionCounts.get(key) || 0) + entry.count);
  }

  const allUnseen = letters.every((letter) => (masteryByLetter.get(letter.symbol)?.attempts || 0) === 0);
  const ranked = letters.map((letter) => {
    const entry = masteryByLetter.get(letter.symbol) || {};
    const attempts = entry.attempts || 0;
    const score = attempts === 0 ? 50 : entry.score || 0;
    const errorRate = attempts === 0 ? 0 : (entry.wrong || 0) / attempts;
    const recency = entry.last_seen_at
      ? Math.min(daysBetween(now.toISOString(), entry.last_seen_at), 14) / 14
      : 1;
    const priority = 0.5 * (1 - score / 100) + 0.3 * errorRate + 0.2 * recency;
    return { ...letter, mastery: entry, attempts, score, recency, priority };
  });

  ranked.sort((a, b) => {
    if (allUnseen && a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
    if (allUnseen && a.difficulty === b.difficulty) return a.sort_order - b.sort_order;
    return b.priority - a.priority || a.sort_order - b.sort_order;
  });
  const selected = ranked.slice(0, limit);
  if (selected.length > 0) {
    const top = selected[0];
    const topConfusion = confusions
      .filter((entry) => entry.target === top.symbol && entry.count >= 2)
      .sort((a, b) => b.count - a.count)[0];
    if (topConfusion && !selected.some((entry) => entry.symbol === topConfusion.chosen)) {
      const confusedLetter = ranked.find((entry) => entry.symbol === topConfusion.chosen);
      if (confusedLetter) selected[selected.length - 1] = confusedLetter;
    }
  }

  return selected.map((entry) => {
    const confusion = confusions
      .filter((item) => item.target === entry.symbol && item.count >= 2)
      .sort((a, b) => b.count - a.count)[0];
    let reason;
    if (entry.attempts === 0) reason = 'belum pernah dicoba';
    else if (confusion) reason = `sering tertukar dengan ${confusion.chosen}`;
    else if (entry.score < 40) reason = 'perlu diulang';
    else if (entry.recency >= 0.5) reason = 'sudah lama tidak dilatih';
    else reason = 'latihan lagi supaya makin lancar';
    return { letter: entry.symbol, score: entry.score, reason };
  });
}

module.exports = { recommendLetters };
