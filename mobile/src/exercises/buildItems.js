function shuffled(values, random) {
  const result = values.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function avoidAdjacentSymbols(values) {
  const result = values.slice();
  for (let index = 1; index < result.length; index += 1) {
    if (result[index].symbol === result[index - 1].symbol) {
      const alternative = result.findIndex((entry, nextIndex) => nextIndex > index && entry.symbol !== result[index - 1].symbol);
      if (alternative !== -1) [result[index], result[alternative]] = [result[alternative], result[index]];
    }
  }
  return result;
}

function chooseMany(values, count, random) {
  return shuffled(values, random).slice(0, count);
}

function choicesFor(target, letters, count, random) {
  const bySymbol = new Map(letters.map((letter) => [letter.symbol, letter]));
  const similar = (target.similar_to || []).map((symbol) => bySymbol.get(symbol)).filter(Boolean);
  const sameCategory = letters.filter((letter) => letter.category === target.category && letter.symbol !== target.symbol);
  const remaining = letters.filter((letter) => letter.symbol !== target.symbol);
  const selected = [target];
  for (const candidate of [...chooseMany(similar, similar.length, random), ...chooseMany(sameCategory, sameCategory.length, random), ...chooseMany(remaining, remaining.length, random)]) {
    if (!selected.some((entry) => entry.symbol === candidate.symbol)) selected.push(candidate);
    if (selected.length >= count) break;
  }
  if (selected.length < count) throw new Error('Pilihan huruf belum cukup untuk latihan ini.');
  return shuffled(selected, random).map((letter) => ({ symbol: letter.symbol, mirrored: false }));
}

function buildItems(exerciseType, targetLetters, settings, lettersData, wordsData = [], random = Math.random) {
  if (!Array.isArray(targetLetters) || targetLetters.length === 0) throw new Error('Pilih setidaknya satu huruf target.');
  if (!settings || !Number.isInteger(settings.session_length) || settings.session_length < 1 || settings.session_length > 30) {
    throw new Error('Jumlah item latihan harus antara 1 dan 30.');
  }
  if (!Number.isInteger(settings.choice_count) || settings.choice_count < 2 || settings.choice_count > 4) {
    throw new Error('Jumlah pilihan harus antara 2 dan 4.');
  }
  if (!Array.isArray(lettersData) || lettersData.length === 0) throw new Error('Data huruf belum tersedia.');
  if (exerciseType === 'syllable_build' && (!Array.isArray(wordsData) || wordsData.length === 0)) {
    throw new Error('Kata latihan belum tersedia.');
  }
  const bySymbol = new Map(lettersData.map((letter) => [letter.symbol, letter]));
  let targets = targetLetters.map((value) => bySymbol.get(typeof value === 'string' ? value : value.symbol)).filter(Boolean);
  if (exerciseType === 'discriminate') targets = targets.filter((letter) => letter.is_lookalike);
  if (exerciseType === 'syllable_build') {
    targets = targets.filter((letter) => wordsData.some((word) => word.word.startsWith(letter.symbol)));
  }
  if (!targets.length) throw new Error('Belum ada huruf yang cocok untuk latihan ini.');

  const count = settings.session_length;
  const sequence = Array.from({ length: count }, (_, index) => targets[index % targets.length]);
  const orderedTargets = avoidAdjacentSymbols(shuffled(sequence, random));
  const choiceCount = settings.choice_count;

  return orderedTargets.map((target, itemIndex) => {
    const base = {
      item_index: itemIndex,
      letter: target.symbol,
      exercise_type: exerciseType,
      strokes: target.strokes,
      attempts: 0,
    };
    if (exerciseType === 'listen_choose') {
      return {
        ...base,
        choices: choicesFor(target, lettersData, choiceCount, random),
        correct_value: target.symbol,
        tts_syllable: target.tts_syllable,
      };
    }
    if (exerciseType === 'discriminate') {
      const candidateSymbols = (target.similar_to || []).filter((symbol) => bySymbol.has(symbol));
      const distractors = chooseMany(candidateSymbols.map((symbol) => bySymbol.get(symbol)), Math.max(0, choiceCount - 1), random);
      const choices = [
        { symbol: target.symbol, mirrored: false },
        ...distractors.map((letter) => ({ symbol: letter.symbol, mirrored: false })),
      ];
      if (choices.length < choiceCount && !choices.some((choice) => choice.symbol === target.symbol && choice.mirrored)) {
        choices.push({ symbol: target.symbol, mirrored: true });
      }
      while (choices.length < choiceCount) {
        const fallback = lettersData.find((letter) => letter.symbol !== target.symbol && !choices.some((choice) => choice.symbol === letter.symbol));
        if (!fallback) break;
        choices.push({ symbol: fallback.symbol, mirrored: false });
      }
      return { ...base, choices: shuffled(choices, random), correct_value: target.symbol, target };
    }
    if (exerciseType === 'match_pairs') {
      const candidates = chooseMany(lettersData.filter((letter) => letter.symbol !== target.symbol), 3, random);
      if (candidates.length < 3) throw new Error('Minimal empat huruf diperlukan untuk latihan pasangan.');
      const pairs = shuffled([target, ...candidates].map((letter) => ({
        symbol: letter.symbol,
        sound: letter.tts_syllable,
      })), random);
      return {
        ...base,
        pairs,
        correct_value: target.symbol,
        tts_syllable: target.tts_syllable,
      };
    }
    if (exerciseType === 'trace') {
      if (!Array.isArray(target.strokes?.strokes) || target.strokes.strokes.length === 0) {
        throw new Error(`Data goresan huruf ${target.symbol} belum tersedia.`);
      }
      return { ...base, correct_value: target.symbol, tts_syllable: target.tts_syllable };
    }
    if (exerciseType === 'syllable_build') {
      if (!wordsData.length) throw new Error('Kata latihan belum tersedia.');
      const matchingWords = wordsData.filter((word) => word.word.startsWith(target.symbol));
      const word = chooseMany(matchingWords, 1, random)[0];
      return {
        ...base,
        word,
        tiles: shuffled(word.word.split('').map((letter, index) => ({ id: `${letter}-${index}`, letter })), random),
        correct_value: word.word,
        tts_syllable: word.syllables.join(' '),
      };
    }
    throw new Error(`Jenis latihan ${exerciseType} belum dikenali.`);
  });
}

module.exports = { buildItems };
