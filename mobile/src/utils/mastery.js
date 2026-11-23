export function masteryStatus(mastery) {
  const attempts = mastery?.attempts || 0;
  const score = mastery?.score || 0;
  if (attempts === 0) return 'unseen';
  if (score < 40) return 'needs_practice';
  if (score < 75 || attempts < 5) return 'learning';
  return 'mastered';
}

export function masteryLabel(status) {
  return {
    unseen: 'Belum dicoba',
    needs_practice: 'Perlu diulang',
    learning: 'Sedang belajar',
    mastered: 'Dikuasai',
  }[status] || 'Belum dicoba';
}

export function masteryIcon(status) {
  return {
    unseen: '○',
    needs_practice: '↻',
    learning: '◐',
    mastered: '★',
  }[status] || '○';
}
