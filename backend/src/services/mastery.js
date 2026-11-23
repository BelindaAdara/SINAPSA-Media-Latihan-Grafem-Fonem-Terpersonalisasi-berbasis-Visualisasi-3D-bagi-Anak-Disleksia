function applyMasteryItem(current, item, seenAt) {
  const score = current.score || 0;
  const delta = item.is_correct ? 10 : item.resolved ? 4 : -8;
  return {
    score: Math.max(0, Math.min(100, score + delta)),
    attempts: (current.attempts || 0) + 1,
    correct: (current.correct || 0) + (item.is_correct ? 1 : 0),
    wrong: (current.wrong || 0) + (!item.resolved ? 1 : 0),
    last_seen_at: seenAt,
  };
}

function updateMastery(current, items, seenAt) {
  return items
    .slice()
    .sort((a, b) => a.item_index - b.item_index)
    .reduce((mastery, item) => applyMasteryItem(mastery, item, seenAt), {
      score: current.score || 0,
      attempts: current.attempts || 0,
      correct: current.correct || 0,
      wrong: current.wrong || 0,
      last_seen_at: current.last_seen_at || null,
    });
}

function masteryStatus(mastery = {}) {
  const attempts = mastery.attempts || 0;
  const score = mastery.score || 0;
  if (attempts === 0) return 'unseen';
  if (score < 40) return 'needs_practice';
  if (score < 75 || attempts < 5) return 'learning';
  return 'mastered';
}

function replayMastery(items) {
  return items
    .slice()
    .sort((a, b) => new Date(a.started_at) - new Date(b.started_at) || a.item_index - b.item_index)
    .reduce((mastery, item) => applyMasteryItem(mastery, item, item.ended_at), {
      score: 0,
      attempts: 0,
      correct: 0,
      wrong: 0,
      last_seen_at: null,
    });
}

module.exports = { applyMasteryItem, updateMastery, masteryStatus, replayMastery };
