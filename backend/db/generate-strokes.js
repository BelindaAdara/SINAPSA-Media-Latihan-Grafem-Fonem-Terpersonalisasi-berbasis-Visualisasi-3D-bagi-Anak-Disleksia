const fs = require('node:fs');
const path = require('node:path');

const line = (points, closed) => ({ order: 1, type: 'line', closed: Boolean(closed), points });
const dot = (point, order) => ({ order, type: 'dot', closed: false, points: [point] });

const baseStrokes = {
  a: [line([[0.72, 0.6], [0.48, 0.58], [0.25, 0.43], [0.22, 0.2], [0.38, 0.04], [0.62, 0.04], [0.78, 0.2], [0.76, 0.43], [0.62, 0.56], [0.38, 0.58]]), line([[0.76, 0.58], [0.76, 0.02]])],
  b: [line([[0.22, 1], [0.22, 0]]), line([[0.22, 0.35], [0.36, 0.55], [0.58, 0.6], [0.78, 0.46], [0.82, 0.25], [0.72, 0.08], [0.52, 0.02], [0.34, 0.1], [0.22, 0.25]])],
  c: [line([[0.78, 0.48], [0.62, 0.59], [0.4, 0.58], [0.22, 0.43], [0.19, 0.2], [0.35, 0.04], [0.6, 0.02], [0.79, 0.12]])],
  e: [line([[0.2, 0.3], [0.78, 0.3], [0.75, 0.46], [0.57, 0.58], [0.36, 0.56], [0.2, 0.4], [0.2, 0.18], [0.37, 0.04], [0.61, 0.02], [0.8, 0.12]])],
  f: [line([[0.3, -0.05], [0.3, 0.76], [0.36, 0.94], [0.52, 1], [0.65, 0.96]]), line([[0.12, 0.58], [0.62, 0.58]])],
  g: [line([[0.76, 0.57], [0.62, 0.6], [0.4, 0.56], [0.23, 0.4], [0.23, 0.19], [0.39, 0.04], [0.62, 0.04], [0.77, 0.2], [0.76, 0.57], [0.76, -0.2], [0.62, -0.36], [0.39, -0.38], [0.24, -0.28]])],
  h: [line([[0.22, 1], [0.22, 0]]), line([[0.22, 0.35], [0.4, 0.55], [0.61, 0.58], [0.78, 0.42], [0.78, 0]])],
  i: [line([[0.5, 0.58], [0.5, 0]]), dot([0.5, 0.85], 2)],
  j: [line([[0.62, 0.58], [0.62, -0.2], [0.52, -0.36], [0.31, -0.35], [0.2, -0.25]]), dot([0.62, 0.85], 2)],
  k: [line([[0.24, 1], [0.24, 0]]), line([[0.76, 0.58], [0.26, 0.25], [0.78, 0], [0.48, 0.19]])],
  l: [line([[0.5, 1], [0.5, 0]])],
  m: [line([[0.18, 0], [0.18, 0.58]]), line([[0.18, 0.4], [0.34, 0.57], [0.5, 0.58], [0.58, 0.42], [0.58, 0]]), line([[0.58, 0.4], [0.72, 0.57], [0.86, 0.56], [0.9, 0.4], [0.9, 0]])],
  n: [line([[0.22, 0], [0.22, 0.58]]), line([[0.22, 0.38], [0.4, 0.56], [0.61, 0.58], [0.78, 0.42], [0.78, 0]])],
  o: [line([[0.5, 0.6], [0.25, 0.55], [0.12, 0.35], [0.18, 0.14], [0.36, 0.02], [0.61, 0.02], [0.82, 0.15], [0.88, 0.36], [0.76, 0.54], [0.5, 0.6]], true)],
  r: [line([[0.25, 0], [0.25, 0.58]]), line([[0.25, 0.36], [0.45, 0.56], [0.66, 0.58], [0.78, 0.48]])],
  s: [line([[0.77, 0.5], [0.61, 0.59], [0.37, 0.57], [0.22, 0.46], [0.3, 0.32], [0.64, 0.25], [0.79, 0.13], [0.63, 0.03], [0.36, 0.02], [0.2, 0.12]])],
  t: [line([[0.48, 0.88], [0.48, 0.15], [0.58, 0.02], [0.76, 0.04]]), line([[0.2, 0.58], [0.72, 0.58]])],
  u: [line([[0.22, 0.58], [0.22, 0.19], [0.37, 0.03], [0.61, 0.02], [0.78, 0.18], [0.78, 0.58]])],
  v: [line([[0.18, 0.58], [0.49, 0], [0.82, 0.58]])],
  w: [line([[0.12, 0.58], [0.27, 0], [0.5, 0.4], [0.73, 0], [0.88, 0.58]])],
  x: [line([[0.2, 0.58], [0.8, 0]]), line([[0.8, 0.58], [0.2, 0]])],
  y: [line([[0.18, 0.58], [0.48, 0], [0.78, 0.58]]), line([[0.48, 0], [0.34, -0.32], [0.18, -0.38]])],
  z: [line([[0.2, 0.55], [0.79, 0.55], [0.22, 0.03], [0.8, 0.03]])],
};

function transform(strokes, transformPoint) {
  return strokes.map((stroke) => ({
    ...stroke,
    points: stroke.points.map(transformPoint),
  }));
}

function generateStrokes() {
  const b = baseStrokes.b;
  const generated = {
    ...baseStrokes,
    d: transform(b, ([x, y]) => [1 - x, y]),
    p: transform(b, ([x, y]) => [x, 0.6 - y]),
    q: transform(b, ([x, y]) => [1 - x, 0.6 - y]),
  };
  return Object.fromEntries(Object.entries(generated).map(([symbol, strokes]) => [
    symbol,
    strokes.map((stroke, index) => ({ ...stroke, order: index + 1 })),
  ]));
}

const letters = [
  ['a', '/a/', 'a', 'vowel', false, ['e', 'o'], 1, 'apel', '🍎', 'awan', '☁️'],
  ['b', '/b/', 'ba', 'consonant', true, ['d', 'p'], 3, 'bola', '⚽', 'baju', '👕'],
  ['c', '/tʃ/', 'cé', 'consonant', false, ['e', 'o'], 2, 'cabai', '🌶️', 'cicak', '🦎'],
  ['d', '/d/', 'da', 'consonant', true, ['b', 'q'], 3, 'dadu', '🎲', 'daun', '🍃'],
  ['e', '/e/ atau /ə/', 'e', 'vowel', false, ['a', 'c'], 2, 'elang', '🦅', 'ember', '🪣'],
  ['f', '/f/', 'fa', 'consonant', false, ['t'], 2, 'film', '🎬', 'foto', '📷'],
  ['g', '/ɡ/', 'ga', 'consonant', false, ['q'], 3, 'gajah', '🐘', 'gula', '🧂'],
  ['h', '/h/', 'ha', 'consonant', false, ['n', 'k'], 2, 'hujan', '🌧️', 'hati', '❤️'],
  ['i', '/i/', 'i', 'vowel', false, ['l', 'j'], 1, 'ikan', '🐟', 'ibu', '👩'],
  ['j', '/dʒ/', 'ja', 'consonant', false, ['i'], 2, 'jeruk', '🍊', 'jam', '⏰'],
  ['k', '/k/', 'ka', 'consonant', false, ['h'], 2, 'kucing', '🐱', 'kaki', '🦶'],
  ['l', '/l/', 'la', 'consonant', false, ['i', 't'], 2, 'lampu', '💡', 'laut', '🌊'],
  ['m', '/m/', 'ma', 'consonant', true, ['w', 'n'], 3, 'mata', '👁️', 'mobil', '🚗'],
  ['n', '/n/', 'na', 'consonant', true, ['u', 'm', 'h'], 3, 'nasi', '🍚', 'nenek', '👵'],
  ['o', '/o/', 'o', 'vowel', false, ['a', 'c'], 1, 'ombak', '🌊', 'obat', '💊'],
  ['p', '/p/', 'pa', 'consonant', true, ['q', 'b'], 3, 'pisang', '🍌', 'padi', '🌾'],
  ['q', '/k/', 'ki', 'consonant', true, ['p', 'd', 'g'], 4, 'Qatar', '🌍', 'qari', '📖'],
  ['r', '/r/', 'ra', 'consonant', false, ['n'], 2, 'roti', '🍞', 'rumah', '🏠'],
  ['s', '/s/', 'sa', 'consonant', false, ['z'], 2, 'sapi', '🐄', 'susu', '🥛'],
  ['t', '/t/', 'ta', 'consonant', false, ['f', 'l'], 2, 'topi', '🧢', 'tali', '🪢'],
  ['u', '/u/', 'u', 'vowel', true, ['n', 'v'], 3, 'ular', '🐍', 'ubi', '🍠'],
  ['v', '/v/', 'va', 'consonant', false, ['u', 'w'], 4, 'vas', '🏺', 'video', '📺'],
  ['w', '/w/', 'wa', 'consonant', true, ['m', 'v'], 3, 'wortel', '🥕', 'wajan', '🍳'],
  ['x', '/ks/', 'eks', 'consonant', false, ['z'], 4, 'xilofon', '🎼', 'xenon', '💡'],
  ['y', '/j/', 'ya', 'consonant', false, ['g'], 2, 'yogurt', '🥛', 'yoyo', '🪀'],
  ['z', '/z/', 'za', 'consonant', false, ['s', 'n'], 3, 'zebra', '🦓', 'zona', '🗺️'],
];

const exerciseTypes = [
  ['listen_choose', 'Dengar & Pilih', 'Dengar bunyinya, pilih hurufnya', 'Dengarkan bunyi huruf dengan saksama. Lalu ketuk huruf yang cocok.', 'suara', true],
  ['discriminate', 'Bedakan Huruf Mirip', 'Mana huruf yang sama persis?', 'Perhatikan bentuk hurufnya. Pilih huruf yang sama persis dengan contoh.', 'cermin', true],
  ['match_pairs', 'Pasangkan Huruf & Bunyi', 'Pasangkan huruf dengan bunyinya', 'Pilih satu huruf, lalu pilih bunyi yang cocok. Pasangkan semuanya bersama-sama.', 'pasangan', true],
  ['trace', 'Simulasi Huruf 3D', 'Lihat huruf 3D, lalu ikuti alur menulisnya', 'Amati bentuk huruf 3D dan urutan goresannya. Lalu ikuti jalur menulis dari nomor awal sampai selesai.', 'telusuri', true],
  ['syllable_build', 'Susun Suku Kata', 'Susun huruf menjadi suku kata', 'Lihat gambar dan bunyikan suku katanya. Ketuk huruf berurutan untuk menyusunnya.', 'susun', true],
];

const words = [
  ['baju', ['ba', 'ju'], '👕'], ['buku', ['bu', 'ku'], '📖'],
  ['mata', ['ma', 'ta'], '👁️'], ['mama', ['ma', 'ma'], '👩'],
  ['papa', ['pa', 'pa'], '👨'], ['sapi', ['sa', 'pi'], '🐄'],
  ['kuda', ['ku', 'da'], '🐴'], ['bola', ['bo', 'la'], '⚽'],
  ['topi', ['to', 'pi'], '🧢'], ['roti', ['ro', 'ti'], '🍞'],
  ['nasi', ['na', 'si'], '🍚'], ['mobil', ['mo', 'bil'], '🚗'],
];

const vowelHints = {
  a: 'Buka mulut dengan santai: a.', e: 'Bunyikan e dengan jelas.', i: 'Tarik senyum tipis, lalu bunyikan: i.',
  o: 'Bulatkan bibir, lalu bunyikan: o.', u: 'Bulatkan bibir kecil, lalu bunyikan: u.',
};

const consonantHints = {
  b: 'Bibir tertutup, lalu dilepas: b.',
  c: "Bunyikan huruf c: cé, seperti bunyi awal kata 'cicak'.",
  d: 'Ujung lidah menyentuh gigi atas, lalu dilepas: d.',
  f: 'Gigi atas menyentuh bibir bawah, lalu hembuskan: fa.',
  g: 'Pangkal lidah menyentuh langit-langit, lalu lepaskan: ga.',
  h: 'Hembuskan napas dengan lembut: ha.',
  j: "Bunyikan seperti bunyi awal kata 'jeruk': ja.",
  k: 'Pangkal lidah menyentuh langit-langit, lalu lepaskan: ka.',
  l: 'Ujung lidah menyentuh langit-langit: la.',
  m: 'Rapatkan bibir dan keluarkan bunyi: ma.',
  n: 'Ujung lidah menyentuh bagian belakang gigi atas: na.',
  p: 'Rapatkan bibir, lalu lepaskan: pa.',
  q: 'Bunyikan huruf q: ki; huruf q jarang dipakai dalam kata Indonesia.',
  r: 'Getarkan ujung lidah dengan lembut: ra.',
  s: 'Desiskan udara dengan lembut: sa.',
  t: 'Ujung lidah menyentuh belakang gigi atas, lalu dilepas: ta.',
  v: 'Gigi atas menyentuh bibir bawah, lalu bunyikan: va.',
  w: 'Bulatkan bibir, lalu bunyikan: wa.',
  x: 'Bunyikan dua bunyi berurutan: ks, seperti eks.',
  y: "Bunyikan ya, seperti bunyi awal kata 'yoyo'.",
  z: 'Desiskan udara dengan lembut: za.',
};

const writingStepText = {
  a: ['Buat lengkungan bulat kecil sampai kembali ke titik awal.', 'Tambahkan garis pendek turun di sisi kanan.'],
  b: ['Tarik garis lurus ke bawah dari atas.', 'Kembali ke tengah batang, buat lengkungan ke kanan seperti perut.', 'Tutup lengkungan sampai menyentuh batang.'],
  c: ['Mulai dari bagian atas kanan.', 'Buat lengkungan ke kiri, turun, lalu naik kembali ke kanan.', 'Sisakan celah kecil di sisi kanan.'],
  d: ['Buat lengkungan bulat seperti huruf c.', 'Dari atas, tarik garis lurus ke bawah di sisi kanan.', 'Pastikan perut ada di kiri batang.'],
  e: ['Tarik garis mendatar pendek di tengah.', 'Lanjutkan lengkungan ke kiri dan bawah.', 'Naikkan lengkungan kembali ke kanan atas.'],
  f: ['Tarik garis panjang dari bawah ke atas.', 'Tambahkan garis pendek melintang di bagian tengah.'],
  g: ['Buat lengkungan bulat kecil.', 'Lanjutkan batang turun melewati garis dasar.', 'Akhiri dengan lengkungan ke kiri.'],
  h: ['Tarik garis lurus turun di sisi kiri.', 'Mulai dari tengah batang, buat lengkungan ke kanan.', 'Tarik ujung lengkungan lurus ke bawah.'],
  i: ['Tarik garis pendek lurus ke bawah.', 'Beri titik kecil di atasnya.'],
  j: ['Beri titik kecil di bagian atas.', 'Tarik garis lurus ke bawah melewati garis dasar.', 'Lengkungkan ujungnya ke kiri.'],
  k: ['Tarik garis lurus dari atas ke bawah.', 'Dari tengah, buat garis miring ke kanan atas.', 'Buat garis miring ke kanan bawah.'],
  l: ['Tarik satu garis lurus dari atas sampai bawah.'],
  m: ['Tarik garis pendek ke atas dan turun.', 'Buat lengkungan pertama ke bawah.', 'Lanjutkan lengkungan kedua ke bawah.'],
  n: ['Tarik garis pendek ke atas dan turun.', 'Dari tengah, buat satu lengkungan ke kanan sampai ke garis dasar.'],
  o: ['Buat satu lingkaran lonjong tanpa mengangkat pensil.', 'Tutup lingkaran pada titik awal.'],
  p: ['Tarik batang dari atas ke bawah melewati garis dasar.', 'Dari tengah batang, buat lengkungan ke kanan.', 'Tutup lengkungan seperti perut kecil.'],
  q: ['Buat lengkungan bulat seperti huruf o.', 'Tarik batang dari tengah ke bawah.', 'Arahkan batang ke sisi kiri.'],
  r: ['Tarik garis pendek ke atas dan kembali ke bawah.', 'Buat lengkungan kecil ke kanan dari bagian tengah.'],
  s: ['Buat lengkungan kecil ke kanan di bagian atas.', 'Arahkan garis ke kiri lalu melengkung ke kanan bawah.', 'Akhiri dengan lengkungan kecil ke kiri.'],
  t: ['Tarik batang pendek dari atas ke bawah.', 'Tambahkan garis melintang di bagian tengah.'],
  u: ['Tarik garis turun di sisi kiri.', 'Buat lengkungan di bawah ke arah kanan.', 'Tarik garis naik di sisi kanan.'],
  v: ['Tarik garis miring turun ke tengah.', 'Tarik garis miring naik ke kanan.'],
  w: ['Tarik garis miring turun dan naik membentuk lembah pertama.', 'Lanjutkan garis miring turun dan naik membentuk lembah kedua.'],
  x: ['Tarik garis miring dari kiri atas ke kanan bawah.', 'Silangkan dengan garis miring dari kanan atas ke kiri bawah.'],
  y: ['Tarik garis miring turun ke tengah.', 'Lanjutkan garis miring ke kanan atas.', 'Tarik batang dari tengah turun ke kiri.'],
  z: ['Tarik garis mendatar di bagian atas.', 'Buat garis miring turun ke kiri bawah.', 'Tarik garis mendatar di bagian bawah.'],
};

function hint(symbol, phoneme, category) {
  return vowelHints[symbol] || consonantHints[symbol] || `Ucapkan bunyi ${phoneme.replaceAll('/', '')} dengan lembut.`;
}

function tips(symbol, lookalike, difficulty) {
  if (symbol === 'b') return "Huruf b punya batang di kiri dan perut di kanan. Ingat: b seperti 'bola', batangnya di depan bolanya.";
  if (symbol === 'd') return 'Huruf d adalah b yang menghadap ke arah sebaliknya. Perutnya di kiri batang.';
  if (symbol === 'p') return 'Huruf p punya batang turun di kiri dan perut di kanan.';
  if (symbol === 'q') return 'Huruf q mirip p yang menghadap ke arah sebaliknya.';
  if (lookalike) return `Perhatikan arah dan bentuk huruf ${symbol} dengan tenang.`;
  if (difficulty === 4) return `Huruf ${symbol} lebih jarang dipakai dalam kata bahasa Indonesia.`;
  return `Lihat bentuk huruf ${symbol}, lalu ucapkan bunyinya pelan-pelan.`;
}

function writingSteps(symbol) {
  return writingStepText[symbol];
}

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlArray(values) {
  return `array[${values.map(quote).join(', ')}]::text[]`;
}

function generateSeedSql() {
  const strokes = generateStrokes();
  const output = [
    '-- Generated by `npm run db:seed` from db/generate-strokes.js.',
    '-- Re-running the generator replaces this file deterministically.',
    'begin;',
    'insert into letters (symbol, phoneme_ipa, phoneme_hint, tts_syllable, category, is_lookalike, similar_to, difficulty, example_words, tips, writing_steps, strokes, sort_order) values',
  ];

  const letterRows = letters.map(([symbol, ipa, syllable, category, lookalike, similar, difficulty, word1, emoji1, word2, emoji2], index) => {
    const examples = JSON.stringify([{ word: word1, emoji: emoji1 }, { word: word2, emoji: emoji2 }]);
    const geometry = JSON.stringify({ strokes: strokes[symbol] });
    const hintText = hint(symbol, ipa, category);
    return `(${[
      quote(symbol), quote(ipa), quote(hintText), quote(syllable), quote(category),
      lookalike ? 'true' : 'false', sqlArray(similar), difficulty,
      `${quote(examples)}::jsonb`, quote(tips(symbol, lookalike, difficulty)),
      sqlArray(writingSteps(symbol)), `${quote(geometry)}::jsonb`, index + 1,
    ].join(', ')})`;
  });
  output.push(`${letterRows.join(',\n')}\non conflict (symbol) do update set phoneme_ipa = excluded.phoneme_ipa, phoneme_hint = excluded.phoneme_hint, tts_syllable = excluded.tts_syllable, category = excluded.category, is_lookalike = excluded.is_lookalike, similar_to = excluded.similar_to, difficulty = excluded.difficulty, example_words = excluded.example_words, tips = excluded.tips, writing_steps = excluded.writing_steps, strokes = excluded.strokes, sort_order = excluded.sort_order;`);

  output.push('', 'insert into exercise_types (id, name, description, how_to_play, icon_key, is_active, sort_order) values');
  output.push(`${exerciseTypes.map(([id, name, description, how, icon, active], index) =>
    `(${[id, name, description, how, icon].map(quote).join(', ')}, ${active}, ${index + 1})`).join(',\n')}`);
  output.push('on conflict (id) do update set name = excluded.name, description = excluded.description, how_to_play = excluded.how_to_play, icon_key = excluded.icon_key, is_active = excluded.is_active, sort_order = excluded.sort_order;');

  output.push('', 'insert into words (word, syllables, emoji, sort_order) values');
  output.push(`${words.map(([word, syllables, emoji], index) =>
    `(${quote(word)}, ${sqlArray(syllables)}, ${quote(emoji)}, ${index + 1})`).join(',\n')}`);
  output.push('on conflict (word) do update set syllables = excluded.syllables, emoji = excluded.emoji, sort_order = excluded.sort_order;', 'commit;', '');
  return output.join('\n');
}

if (require.main === module) {
  const destination = path.join(__dirname, 'seed.sql');
  fs.writeFileSync(destination, generateSeedSql(), 'utf8');
  process.stdout.write(`Generated ${destination} with ${letters.length} letters.\n`);
}

module.exports = { generateStrokes, generateSeedSql, letters };
