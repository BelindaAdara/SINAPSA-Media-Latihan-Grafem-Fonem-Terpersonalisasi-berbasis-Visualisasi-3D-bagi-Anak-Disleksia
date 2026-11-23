function randomTargets(eligibleSymbols, currentTargets = [], count = 3, random = Math.random) {
  const pool = [...new Set(eligibleSymbols)];
  const targetCount = Math.min(count, pool.length);
  const shuffled = pool.slice();

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }

  const targets = shuffled.slice(0, targetCount);
  const current = new Set(currentTargets);
  const repeatsCurrentSet = targets.length === current.size && targets.every((symbol) => current.has(symbol));

  if (repeatsCurrentSet && shuffled.length > targetCount) {
    const replacement = shuffled.slice(targetCount).find((symbol) => !current.has(symbol));
    if (replacement) targets[targetCount - 1] = replacement;
  }

  return targets;
}

module.exports = { randomTargets };
