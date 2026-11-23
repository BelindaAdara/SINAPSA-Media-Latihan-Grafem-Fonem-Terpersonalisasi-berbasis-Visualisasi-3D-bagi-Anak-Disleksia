# SRS — SINAPSA

**SINAPSA: Media Latihan Grafem-Fonem Terpersonalisasi berbasis Visualisasi 3D bagi Anak Disleksia**

Item | Isi

Dokumen | Software Requirements Specification (SRS)

Versi | 1.0

Tanggal | 23 November 2026

Pengembang | `[ISI NAMA PENGEMBANG]` (diisi di `mobile/src/config/appInfo.js`)

Jenis aplikasi | Aplikasi mobile (Android/iOS) + REST API

Tech stack | React Native (JavaScript, Expo), Node.js + Express.js, Supabase (PostgreSQL)

Tenggat pengerjaan | 24 November 2026 (responsi 25–28 November 2026)

## 0. Petunjuk untuk AI Coding Agent

Baca bagian ini lebih dulu. Dokumen ini adalah sumber kebenaran tunggal.

1. **Ikuti SRS secara harfiah.** Jangan menambah fitur di luar dokumen. Kalau ada hal yang ambigu, pilih opsi paling sederhana yang memenuhi acceptance criteria (Bagian 12), lalu catat keputusannya di `DECISIONS.md` (satu baris per keputusan: konteks, pilihan, alasan).
2. **Kerjakan berurutan sesuai fase di Bagian 11.** Setiap fase harus berjalan (bisa dijalankan dan dites) sebelum lanjut ke fase berikutnya. Waktu sangat terbatas, jadi prioritas `[MUST]` selesai lebih dulu, lalu `[SHOULD]`, lalu `[COULD]`.
3. **Tanpa aset eksternal.** Dilarang memakai foto, video, file audio, file font, atau model 3D (`.glb`, `.obj`, font JSON). Semua visual dibuat dari kode (SVG, `three.js` dari geometri prosedural, emoji sebagai ilustrasi). Alasannya: resource database dan penyimpanan terbatas.
4. **Dependensi seminimal mungkin.** Pakai daftar di Bagian 2.4. Grafik dan heatmap dibuat sendiri dengan `react-native-svg`. Tambahan dependensi harus dicatat di `DECISIONS.md`.
5. **Rahasia tidak boleh masuk repo.** `SUPABASE_SERVICE_ROLE_KEY` hanya ada di backend (`.env`, di-`.gitignore`). Aplikasi mobile tidak pernah mengakses Supabase langsung, hanya lewat API Express.
6. **Bahasa UI: Bahasa Indonesia**, dengan kalimat pendek dan ramah anak. Identifier kode, nama tabel, dan nama endpoint memakai Bahasa Inggris.
7. **Jangan menampilkan kata "salah", "gagal", atau warna merah keras** kepada anak (lihat Bagian 8.4).

---

## 1. Pendahuluan

### 1.1 Tujuan

SINAPSA membantu anak disleksia berlatih menghubungkan **grafem** (huruf) dengan **fonem** (bunyi) melalui visualisasi huruf 3D yang bisa diputar dan dicerminkan, latihan interaktif yang pendek, serta rekomendasi latihan yang dipersonalisasi berdasarkan huruf yang paling sering keliru.

### 1.2 Ruang lingkup

Aplikasi mencakup: dashboard aktivitas, pencatatan sesi latihan, pustaka huruf dengan viewer 3D, pelacakan progres, riwayat sesi, dan profil/pengaturan personalisasi. Pengguna utama adalah anak (usia sekitar 5–12 tahun) yang didampingi orang tua atau guru.

### 1.3 Di luar ruang lingkup (jangan dibuat)

- Login/registrasi dan akun orang tua. (Satu profil anak per perangkat.)
- Mode offline penuh dan sinkronisasi.
- Notifikasi push, iklan, pembayaran, dan analitik pihak ketiga.
- Pengenalan suara (speech recognition) dan input tulisan tangan bebas.
- Diagnosis atau penilaian klinis. Aplikasi hanya media latihan pendukung, dan hal ini harus tertulis di halaman Tentang.
- Video, foto, dan file audio.

### 1.4 Definisi

Istilah | Arti

Grafem | Simbol tulis, di sini huruf a–z

Fonem | Satuan bunyi bahasa

Huruf mirip | Huruf yang sering tertukar: b–d, p–q, m–w, n–u (dan b–p, d–q)

Sesi | Satu rangkaian latihan, berisi beberapa item

Item | Satu soal dalam sesi (satu huruf target)

Penguasaan (mastery) | Skor 0–100 per huruf per anak

Goresan (stroke) | Data titik yang membentuk huruf, dipakai untuk 3D dan latihan Telusuri

### 1.5 Ketentuan penugasan yang harus dipenuhi

1. Menggunakan API web service buatan sendiri (Express.js).
2. Memiliki bottom navigation bar.
3. Memiliki 6 halaman utama.
4. Minimal 2 halaman utama berisi list, dan setiap item bisa diklik untuk membuka halaman detail.
5. Memiliki 1 halaman Profil/Tentang aplikasi.
6. UI memiliki mode terang dan gelap dengan tombol/slider pemilih.
7. Source code diunggah ke GitHub (backend dan mobile dalam satu repo atau dua repo, bebas).
8. Nilai tambah: aplikasi dapat dibuild menjadi APK (EAS Build).

---

## 2. Gambaran Umum Sistem

### 2.1 Arsitektur

```
[React Native (Expo)]  --HTTPS/JSON-->  [Express.js REST API]  --supabase-js (service role)-->  [Supabase PostgreSQL]
   UI, 3D, TTS, timer                      validasi, logika mastery,                              tabel + seed
   AsyncStorage (tema, child_id)           rekomendasi, agregasi
```

### 2.2 Pengguna dan asumsi

- Satu perangkat = satu profil anak. `child_id` (UUID) disimpan di AsyncStorage setelah onboarding.
- Tidak ada autentikasi. `child_id` bertindak sebagai pengenal. Ini keterbatasan yang diketahui dan wajib ditulis di README. Karena itu, data yang disimpan **hanya** nama panggilan, usia, dan data latihan (tidak ada data diagnosis, alamat, atau kontak).
- Zona waktu default `Asia/Jakarta`. Minggu dimulai hari **Senin**.
- Bunyi huruf memakai `expo-speech` (TTS bahasa `id-ID`). TTS cenderung membaca nama huruf ("be") dan bukan fonem ("b"), sehingga fonem dibunyikan dalam bentuk suku kata (kolom `tts_syllable`, mis. "ba"). Keterbatasan ini ditulis di halaman Tentang.

### 2.3 Batasan

- Tanpa aset eksternal (lihat Bagian 0 butir 3).
- Database hanya menyimpan teks dan angka.
- Waktu pengerjaan sangat singkat, jadi patuhi prioritas MoSCoW.

### 2.4 Tech stack dan dependensi

**Mobile (`/mobile`)**: Expo (managed workflow, SDK stabil terbaru), React Native JavaScript (bukan TypeScript).

Kebutuhan | Paket

Navigasi | `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`, `react-native-screens`, `react-native-safe-area-context`

Gesture dan animasi | `react-native-gesture-handler`, `react-native-reanimated`

3D | `three`, `@react-three/fiber` (entry `/native`), `expo-gl`

Suara | `expo-speech`

Penyimpanan lokal | `@react-native-async-storage/async-storage`

Grafik/ikon/maskot | `react-native-svg` (grafik, heatmap, maskot, dan ikon dibuat sendiri)

Ikon (opsional) | `@expo/vector-icons` (sudah bawaan Expo)

Haptik (opsional) | `expo-haptics`

Catatan kompatibilitas: pasang `three` pada versi yang sesuai dengan *peer dependency* `@react-three/fiber` yang terpasang. Jika terjadi konflik, ikuti rentang versi `three` yang dinyatakan peer dependency tersebut, jangan memakai `@latest` secara buta. Jangan memakai `TextGeometry`, `FontLoader`, `GLTFLoader`, atau loader tekstur.

**Backend (`/backend`)**: Node.js (LTS), `express`, `cors`, `dotenv`, `@supabase/supabase-js`, `zod` (validasi), `jest` + `supertest` (tes), `nodemon` (dev).

**Konfigurasi**

- Backend `.env`: `PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGIN` (default `*` saat dev).
- Mobile `.env`: `EXPO_PUBLIC_API_URL` (mis. `http://192.168.x.x:3000/api/v1`).
- Sediakan `.env.example` di kedua folder.

---

## 3. Persyaratan Fungsional

Prioritas: `[MUST]` wajib, `[SHOULD]` seharusnya ada, `[COULD]` jika waktu cukup.

### 3.1 Onboarding dan profil anak

ID | Persyaratan | Prioritas

FR-ONB-1 | Saat aplikasi dibuka pertama kali (tidak ada `child_id` di AsyncStorage), tampilkan layar onboarding: nama panggilan (1–30 karakter), usia (3–15), pilih avatar. Submit memanggil `POST /children`, menyimpan `child_id`, lalu masuk ke Beranda. | MUST

FR-ONB-2 | Jika `child_id` tersimpan tetapi API menjawab 404, kembali ke onboarding. | SHOULD

### 3.2 Beranda (Dashboard)

ID | Persyaratan | Prioritas

FR-DSH-1 | Sapaan dengan nama anak, maskot, dan tombol pintas tema (ikon matahari/bulan). | MUST

FR-DSH-2 | Kartu **Latihan Minggu Ini**: tujuh hari Sen–Min. Hari dengan minimal satu sesi ditandai "sudah latihan" dengan animasi **bintang berkilau** (animasi lembut, lihat 8.5). Hari ini diberi penanda. | MUST

FR-DSH-3 | Menampilkan **total sesi** dan **durasi latihan** minggu ini (format "1 j 12 m" atau "18 menit"). | MUST

FR-DSH-4 | Kartu **Latihan Terakhir** (nama sesi, jenis, skor, tanggal). Diklik membuka Detail Sesi. Jika belum ada, tampilkan empty state ajakan memulai. | MUST

FR-DSH-5 | **Target mingguan**: progress ring "x dari N sesi". N diatur di Profil (default 5). | MUST

FR-DSH-6 | Kartu **Rekomendasi Hari Ini**: 3 huruf yang perlu diulang beserta alasannya (Bagian 6.3). Ketuk huruf membuka Detail Huruf. Tombol "Latih sekarang" membuka Latihan dengan huruf tersebut sudah terpilih. | SHOULD

FR-DSH-7 | Tautan "Lihat semua riwayat" ke halaman Riwayat. | MUST

### 3.3 Latihan (pencatatan sesi belajar)

ID | Persyaratan | Prioritas

FR-LAT-1 | Halaman Latihan menampilkan **list jenis latihan** dari `GET /exercise-types` (kartu besar: ikon, nama, deskripsi singkat). Jenis dengan `is_active=false` tampil terkunci dengan label "Segera hadir". | MUST

FR-LAT-2 | Ketuk jenis latihan membuka **Detail Latihan**: cara bermain (teks), pilihan **huruf target** (mode "Pilihan Sinapsa" = rekomendasi adaptif, atau "Pilih sendiri" = multi-pilih huruf), nama sesi (default otomatis, mis. "Latihan pagi 24 Nov", bisa diubah), dan tombol **Mulai**. | MUST

FR-LAT-3 | Layar sesi menjalankan item satu per satu sesuai jenis latihan (Bagian 3.3.1). Jumlah item = `session_length` pada pengaturan (default 10). Ada indikator progres (bintang kecil terisi) dan tombol keluar dengan konfirmasi ramah. | MUST

FR-LAT-4 | Setiap item mencatat: huruf target, `is_correct`, `attempts`, `hint_used`, `resolved`, `response_ms`, dan `chosen_value`. | MUST

FR-LAT-5 | **Durasi otomatis**: timer sesi mulai saat item pertama tampil dan berhenti saat item terakhir selesai. `started_at` dan `ended_at` dikirim ke API. | MUST

FR-LAT-6 | Layar **Ringkasan Sesi** di akhir: skor, jumlah bintang (1–3), durasi, kelompok huruf "sudah bagus" dan "perlu latihan lagi". Pilih emoji suasana hati anak (😊 happy, 😐 neutral, 😟 sad) dan isi catatan pendamping (maks 500 karakter, contoh placeholder "hari ini lebih percaya diri"). Tombol Simpan memanggil `POST /sessions`. | MUST

FR-LAT-7 | Jika penyimpanan gagal (jaringan), tampilkan pesan ramah dan tombol "Coba simpan lagi". Data sesi tetap di memori selama layar ringkasan terbuka. | SHOULD

#### 3.3.1 Jenis latihan

`id` | Nama | Mekanik | Prioritas

`listen_choose` | Dengar & Pilih | App memutar bunyi (`tts_syllable`) dan menampilkan `choice_count` huruf. Anak mengetuk huruf yang sesuai bunyi. Tombol "Dengar lagi" tersedia. | MUST

`discriminate` | Bedakan Huruf Mirip | Huruf target tampil sebagai model 3D yang berputar pelan. Pilihan jawaban berupa huruf 2D, termasuk versi cermin/kembarannya (mis. target b dengan pilihan b dan d, atau versi tercermin). Anak memilih yang **sama persis** dengan target. Anak boleh memutar model 3D untuk membandingkan. Huruf target dan pengecoh diambil dari `similar_to`. | MUST

`match_pairs` | Pasangkan Grafem-Fonem | 4 huruf di kolom kiri dan 4 tombol bunyi 🔊 (atau contoh kata + emoji) di kolom kanan. Ketuk satu di kiri, lalu satu di kanan untuk memasangkan. Satu layar dihitung satu item per huruf. | SHOULD

`trace` | Telusuri Huruf 3D | Anak menelusuri huruf mengikuti urutan goresan (Bagian 7.4). Setelah selesai, huruf "muncul" sebagai model 3D. | SHOULD

`syllable_build` | Susun Suku Kata | Tampilkan emoji/gambar teks kata (dari tabel `words`) dan huruf-huruf acak. Anak mengetuk huruf berurutan untuk menyusun suku kata/kata. Item mencatat huruf yang keliru. | COULD

**Aturan umum item (semua jenis):**

- Maksimal **3 percobaan** per item. Setelah jawaban keliru pertama, tampilkan umpan balik lembut "Coba lagi ya ↻". Setelah keliru kedua, tampilkan **petunjuk** (sorot halus jawaban yang benar dan putar bunyinya) dan set `hint_used=true`. Setelah keliru ketiga, tampilkan jawaban yang benar ("Ini dia jawabannya") lalu lanjut, dengan `resolved=false`.
- `is_correct = true` hanya jika benar pada percobaan pertama tanpa petunjuk.
- `resolved = true` jika anak akhirnya memilih jawaban benar (meski lewat percobaan ulang atau petunjuk).
- `chosen_value` diisi jawaban pada **percobaan pertama** (dipakai untuk analisis huruf yang tertukar).
- `response_ms` = waktu dari item tampil sampai jawaban pertama.
- Tidak ada batas waktu per item dan tidak ada hitung mundur yang menekan anak.

### 3.4 Pustaka Huruf

ID | Persyaratan | Prioritas

FR-PUS-1 | **List huruf** (grid 3–4 kolom) dari `GET /letters`. Kartu menampilkan huruf besar, fonem, dan latar sesuai kategori (aturan warna di 8.3). | MUST

FR-PUS-2 | Pencarian (huruf/bunyi) dan **filter chip**: Semua, Vokal, Konsonan, Mirip, serta (SHOULD) status penguasaan: Belum, Perlu diulang, Sedang, Dikuasai. | MUST (chip kategori) / SHOULD (status)

FR-PUS-3 | Ketuk kartu membuka **Detail Huruf**. | MUST

FR-PUS-4 | Detail Huruf menampilkan: **viewer 3D** (Bagian 7), huruf besar 2D, fonem (IPA dan petunjuk cara bunyi, teks), tombol 🔊 "Dengar bunyi", contoh kata + emoji, tips pengucapan, langkah menulis (teks), dan daftar **huruf yang sering tertukar** (chip yang bisa diketuk menuju huruf tersebut). | MUST

FR-PUS-5 | Tombol **Cermin ⇄** pada viewer 3D membalik model secara animasi (±400 ms). Untuk huruf dalam kelompok mirip, tampilkan teks pendamping, mis. "b dan d bentuknya sama, hanya menghadap arah berbeda." | MUST

FR-PUS-6 | Detail Huruf menampilkan status penguasaan anak untuk huruf itu (bar skor dan label). | SHOULD

Konten pustaka **hanya teks** (tanpa foto/video). Seed data ada di Lampiran A.

### 3.5 Progres

ID | Persyaratan | Prioritas

FR-PRG-1 | Grafik garis **akurasi mingguan** (8 minggu terakhir) dibuat dengan `react-native-svg`. Akurasi = `correct_items / total_items`. | MUST

FR-PRG-2 | Kartu ringkasan: **total jawaban benar** (benar langsung), **total waktu belajar**, dan **total sesi**. | MUST

FR-PRG-3 | **Frekuensi latihan**: dua tampilan yang bisa dipilih: kalender bulanan (dengan navigasi bulan) dan heatmap gaya GitHub (12 minggu). Intensitas berdasarkan jumlah sesi per hari. | SHOULD

FR-PRG-4 | **Rekor pribadi**: streak terpanjang, skor sesi tertinggi, dan rata-rata waktu respons tercepat (per sesi). | SHOULD

FR-PRG-5 | **Peta penguasaan huruf**: grid a–z, status ditandai dengan **ikon + gaya border** (bukan hanya warna, lihat 8.3). Ketuk huruf membuka Detail Huruf. | SHOULD

FR-PRG-6 | Daftar **pasangan huruf yang sering tertukar** (maks 5): "b → d (4 kali)". | SHOULD

FR-PRG-7 | Tombol "Lihat riwayat" menuju halaman Riwayat. | MUST

### 3.6 Riwayat

ID | Persyaratan | Prioritas

FR-RIW-1 | **List sesi** dari `GET /sessions`, dikelompokkan per tanggal (header "Hari ini", "Kemarin", atau tanggal). Tiap baris: nama sesi, jenis, skor, durasi. Paginasi (infinite scroll, 20 per halaman). | MUST

FR-RIW-2 | Ketuk baris membuka **Detail Sesi**: ringkasan (skor, durasi, tanggal, jenis, mood) dan rincian per huruf (benar langsung / dengan bantuan / belum bisa), serta catatan. | MUST

FR-RIW-3 | **Edit** nama, catatan, dan mood sesi (`PUT /sessions/:id`). | MUST

FR-RIW-4 | **Hapus** sesi dengan dialog konfirmasi ("Hapus sesi ini?"). Setelah dihapus, penguasaan huruf dihitung ulang (Bagian 6.1). | MUST

FR-RIW-5 | Empty state ramah jika belum ada riwayat. | MUST

### 3.7 Profil / Tentang

ID | Persyaratan | Prioritas

FR-PRF-1 | Profil anak: nama, usia, avatar (ubah via `PUT /children/:id`). | MUST

FR-PRF-2 | **Pemilih tema**: kontrol tiga posisi (Terang / Ikuti sistem / Gelap) dengan ikon matahari dan bulan, disimpan di AsyncStorage dan berlaku seketika. | MUST

FR-PRF-3 | Pengaturan personalisasi (`PUT /children/:id/settings`), dengan pratinjau langsung teks contoh: ukuran huruf (`font_scale`), jarak antarhuruf (`letter_spacing`), kecepatan suara (`speech_rate`), jumlah pilihan jawaban (`choice_count`: 2–4), panjang sesi (`session_length`: 5–20), serta target mingguan (`weekly_target`: 1–14). | MUST

FR-PRF-4 | Bagian **Tentang aplikasi**: deskripsi, versi, nama pengembang (dari `appInfo.js`), pernyataan "media latihan pendukung, bukan alat diagnosis", dan keterbatasan (bunyi memakai TTS). | MUST

## 4. Model Data (Supabase / PostgreSQL)

Buat berkas `backend/db/schema.sql` dan `backend/db/seed.sql`. Semua tabel mengaktifkan Row Level Security **tanpa policy**, sehingga hanya backend (service role) yang dapat mengakses.

sql

```
create extension if not exists "pgcrypto";

create table children (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 30),
  age smallint check (age between 3 and 15),
  avatar_key text not null default 'bintang',
  weekly_target smallint not null default 5 check (weekly_target between 1 and 14),
  timezone text not null default 'Asia/Jakarta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table child_settings (
  child_id uuid primary key references children(id) on delete cascade,
  font_scale numeric(3,2) not null default 1.00 check (font_scale between 0.85 and 1.50),
  letter_spacing numeric(3,2) not null default 0.05 check (letter_spacing between 0 and 0.30), -- satuan em
  speech_rate numeric(3,2) not null default 0.80 check (speech_rate between 0.40 and 1.20),
  choice_count smallint not null default 3 check (choice_count between 2 and 4),
  session_length smallint not null default 10 check (session_length between 5 and 20),
  updated_at timestamptz not null default now()
);

create table letters (
  symbol text primary key check (symbol ~ '^[a-z]$'),
  phoneme_ipa text not null,
  phoneme_hint text not null,                 -- cara membunyikan (teks)
  tts_syllable text not null,                 -- teks yang dibacakan TTS, mis. 'ba'
  category text not null check (category in ('vowel','consonant')),
  is_lookalike boolean not null default false, -- true untuk b,d,p,q,m,w,n,u
  similar_to text[] not null default '{}',     -- sumber pengecoh latihan
  difficulty smallint not null check (difficulty between 1 and 4),
  example_words jsonb not null default '[]',   -- [{"word":"bola","emoji":"⚽"}]
  tips text not null default '',
  writing_steps text[] not null default '{}',  -- langkah menulis (teks)
  strokes jsonb not null,                      -- format di Bagian 7.2
  sort_order smallint not null
);

create table exercise_types (
  id text primary key,                         -- listen_choose, discriminate, match_pairs, trace, syllable_build
  name text not null,
  description text not null,
  how_to_play text not null,
  icon_key text not null,
  is_active boolean not null default true,
  sort_order smallint not null
);

create table words (
  id serial primary key,
  word text not null unique,
  syllables text[] not null,
  emoji text,
  sort_order smallint not null default 0
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  exercise_type text not null references exercise_types(id),
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds >= 0),
  total_items smallint not null check (total_items > 0),
  correct_items smallint not null check (correct_items >= 0),  -- benar langsung
  score smallint not null check (score between 0 and 100),
  mood text check (mood in ('happy','neutral','sad')),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at >= started_at)
);

create table session_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  item_index smallint not null,
  letter text not null references letters(symbol),
  exercise_type text not null references exercise_types(id),
  is_correct boolean not null,                 -- benar pada percobaan pertama tanpa petunjuk
  resolved boolean not null default true,      -- akhirnya menjawab benar (false = jawaban ditampilkan)
  attempts smallint not null default 1 check (attempts between 1 and 3),
  hint_used boolean not null default false,
  response_ms integer check (response_ms is null or response_ms between 0 and 120000),
  chosen_value text,                           -- jawaban percobaan pertama
  created_at timestamptz not null default now(),
  unique (session_id, item_index)
);

create table letter_mastery (
  child_id uuid not null references children(id) on delete cascade,
  letter text not null references letters(symbol),
  score smallint not null default 0 check (score between 0 and 100),
  attempts integer not null default 0,
  correct integer not null default 0,          -- benar langsung
  wrong integer not null default 0,            -- resolved=false
  last_seen_at timestamptz,
  primary key (child_id, letter)
);

create index idx_sessions_child_started on sessions (child_id, started_at desc);
create index idx_items_session on session_items (session_id);
create index idx_items_child_letter on session_items (child_id, letter);

alter table children enable row level security;
alter table child_settings enable row level security;
alter table letters enable row level security;
alter table exercise_types enable row level security;
alter table words enable row level security;
alter table sessions enable row level security;
alter table session_items enable row level security;
alter table letter_mastery enable row level security;
```

**Seed `exercise_types`:**

id | name | description (ringkas) | is_active

`listen_choose` | Dengar & Pilih | Dengar bunyinya, pilih hurufnya | true

`discriminate` | Bedakan Huruf Mirip | Mana huruf yang sama persis? | true

`match_pairs` | Pasangkan Huruf & Bunyi | Pasangkan huruf dengan bunyinya | true jika diimplementasikan, selain itu false

`trace` | Telusuri Huruf 3D | Ikuti jalur huruf dengan jarimu | true jika diimplementasikan, selain itu false

`syllable_build` | Susun Suku Kata | Susun huruf menjadi suku kata | true jika diimplementasikan, selain itu false

Isi `how_to_play` dengan 2–3 kalimat sederhana per jenis.

---

## 5. Spesifikasi API (Express.js)

**Base path:** `/api/v1`. Format JSON. Semua respons sukses: `{ "data": ... }`. Semua error: `{ "error": { "code": "VALIDATION_ERROR", "message": "pesan ramah", "details": [...] } }`.

Status | Kapan

200/201 | Sukses

400 | Validasi gagal (`VALIDATION_ERROR`)

404 | Data tidak ditemukan (`NOT_FOUND`)

500 | Kesalahan server (`INTERNAL_ERROR`, tanpa membocorkan detail)

Arsitektur backend: `routes → controllers → services → repositories`. Logika mastery, rekomendasi, streak, dan agregasi ditaruh di `services` sebagai **fungsi murni** agar mudah dites (Bagian 11, Fase 1). Gunakan `zod` untuk validasi semua body/query. Tambahkan middleware `cors`, `express.json({limit:'200kb'})`, dan error handler terpusat.

### 5.1 Daftar endpoint

Method | Path | Fungsi

GET | `/health` | Cek hidup (`{ "data": { "status": "ok" } }`)

GET | `/letters` | List huruf. Query opsional: `category`, `lookalike=true`, `q`, `child_id` (menambah `mastery`)

GET | `/letters/:symbol` | Detail huruf. Query opsional: `child_id` (menambah `mastery` dan `confusions`)

GET | `/words` | List kata untuk `syllable_build` (query `limit`)

GET | `/exercise-types` | List jenis latihan

GET | `/exercise-types/:id` | Detail jenis latihan

POST | `/children` | Buat profil anak + `child_settings` default

GET | `/children/:id` | Profil + settings

PUT | `/children/:id` | Ubah `name`, `age`, `avatar_key`, `weekly_target`

PUT | `/children/:id/settings` | Ubah pengaturan personalisasi

POST | `/sessions` | Simpan sesi beserta item (atomik)

GET | `/sessions` | List sesi. Query: `child_id` (wajib), `limit` (default 20, maks 50), `offset`, `from`, `to`

GET | `/sessions/:id` | Detail sesi + item

PUT | `/sessions/:id` | Ubah `name`, `note`, `mood`

DELETE | `/sessions/:id` | Hapus sesi + hitung ulang mastery

GET | `/dashboard/:childId` | Data Beranda

GET | `/progress/:childId` | Data Progres. Query: `month=YYYY-MM` (opsional, untuk kalender)

GET | `/recommendations/:childId` | Rekomendasi huruf. Query: `limit` (default 3, maks 8)

### 5.2 Contoh payload

**`POST /children`**

json

```
{ "name": "Rara", "age": 7, "avatar_key": "bintang" }
```

**`POST /sessions`** (durasi, total, skor dihitung server, bukan dipercaya dari klien)

json

```
{
  "child_id": "uuid",
  "name": "Latihan pagi b dan d",
  "exercise_type": "discriminate",
  "started_at": "2026-11-24T01:10:00.000Z",
  "ended_at": "2026-11-24T01:16:30.000Z",
  "mood": "happy",
  "note": "tadi semangat sekali",
  "items": [
    { "item_index": 0, "letter": "b", "is_correct": true,  "resolved": true,  "attempts": 1, "hint_used": false, "response_ms": 2300, "chosen_value": "b" },
    { "item_index": 1, "letter": "d", "is_correct": false, "resolved": true,  "attempts": 2, "hint_used": false, "response_ms": 4100, "chosen_value": "b" }
  ]
}
```

Validasi: `items` 1–30 elemen; `item_index` unik; `letter` ada di tabel `letters`; `ended_at >= started_at`; `exercise_type` ada dan aktif.

Respons `201`:

json

```
{
  "data": {
    "session": { "id": "uuid", "score": 50, "total_items": 2, "correct_items": 1, "duration_seconds": 390 },
    "mastery_updates": [
      { "letter": "b", "score_before": 40, "score_after": 50 },
      { "letter": "d", "score_before": 30, "score_after": 34 }
    ]
  }
}
```

**`GET /dashboard/:childId`**

json

```
{
  "data": {
    "child": { "id": "uuid", "name": "Rara", "weekly_target": 5, "avatar_key": "bintang" },
    "week": {
      "start": "2026-11-23",
      "days": [
        { "date": "2026-11-23", "label": "Sen", "sessions": 1, "duration_seconds": 420, "trained": true },
        { "date": "2026-11-24", "label": "Sel", "sessions": 0, "duration_seconds": 0, "trained": false }
      ],
      "sessions_count": 1,
      "duration_seconds": 420
    },
    "streak": { "current": 2, "longest": 4 },
    "last_session": { "id": "uuid", "name": "Latihan pagi b dan d", "exercise_type": "discriminate", "score": 70, "started_at": "..." },
    "recommended_letters": [
      { "letter": "d", "score": 34, "reason": "sering tertukar dengan b" }
    ]
  }
}
```

(`days` selalu 7 elemen Sen–Min; `last_session` bisa `null`.)

**`GET /progress/:childId`**

json

```
{
  "data": {
    "totals": { "sessions": 12, "correct_items": 64, "study_seconds": 5400 },
    "weekly_accuracy": [ { "week_start": "2026-10-05", "accuracy": 0.58, "items": 30 } ],
    "calendar": [ { "date": "2026-11-23", "sessions": 2 } ],
    "heatmap": [ { "date": "2026-11-23", "sessions": 2 } ],
    "records": { "longest_streak": 4, "best_score": 90, "fastest_avg_response_ms": 1800 },
    "mastery_map": [ { "letter": "a", "score": 80, "attempts": 12, "status": "mastered" } ],
    "top_confusions": [ { "target": "d", "chosen": "b", "count": 4 } ]
  }
}
```

`calendar` mencakup bulan pada query `month` (default bulan berjalan), `heatmap` mencakup 12 minggu terakhir, `weekly_accuracy` mencakup 8 minggu (minggu tanpa data dilewati atau `accuracy: null`).

---

## 6. Logika Inti

### 6.1 Pembaruan penguasaan (mastery)

Untuk setiap item dalam sesi, urut `item_index`:

Kondisi item | Perubahan skor

`is_correct = true` | **+10**

`is_correct = false` dan `resolved = true` | **+4**

`resolved = false` | **−8**

Skor dibatasi 0–100. Perbarui juga `attempts += 1`, `correct += 1` bila `is_correct`, `wrong += 1` bila `resolved=false`, dan `last_seen_at = ended_at`.

**Status huruf** (diturunkan, tidak disimpan):

- `unseen`: `attempts = 0`
- `needs_practice`: `score < 40`
- `learning`: `40 ≤ score < 75`, atau `score ≥ 75` tetapi `attempts < 5`
- `mastered`: `score ≥ 75` dan `attempts ≥ 5`

**Hapus sesi:** setelah `DELETE`, hitung ulang `letter_mastery` untuk huruf yang terdampak dengan memutar ulang seluruh `session_items` anak untuk huruf itu, berurutan menurut `sessions.started_at` lalu `item_index`, mulai dari skor 0. Jika tidak ada item tersisa, baris dihapus (atau di-reset ke 0).

### 6.2 Skor sesi dan bintang

- `correct_items` = jumlah item `is_correct = true`.
- `score = round(correct_items / total_items * 100)`.
- Bintang pada ringkasan: skor ≥ 80 → 3, ≥ 50 → 2, selainnya 1 (anak selalu mendapat minimal 1 bintang).
- `duration_seconds = round((ended_at − started_at) / 1000)`.

### 6.3 Rekomendasi huruf

Untuk setiap huruf a–z:

```
effective_score = (attempts == 0) ? 50 : score
error_rate      = (attempts == 0) ? 0  : wrong / attempts
recency         = (last_seen_at == null) ? 1 : min(days_since_last_seen, 14) / 14

priority = 0.5 * (1 - effective_score/100) + 0.3 * error_rate + 0.2 * recency
```

1. Urutkan menurun menurut `priority`, ambil `limit` teratas.
2. **Penyisipan pasangan tertukar:** jika huruf teratas memiliki `top_confusion` (huruf yang paling sering dipilih keliru untuk target itu, minimal 2 kali) dan huruf itu belum ada dalam daftar, gantikan posisi terakhir dengan huruf tersebut.
3. `reason` (Bahasa Indonesia): `attempts=0` → "belum pernah dicoba"; ada confusion → "sering tertukar dengan {x}"; `score<40` → "perlu diulang"; `recency` tinggi (≥ 0.5) → "sudah lama tidak dilatih"; selain itu → "latihan lagi supaya makin lancar".
4. Untuk anak baru (semua `unseen`), rekomendasikan berdasarkan `sort_order` terendah dengan `difficulty = 1` lebih dulu (mis. a, i, u, e, o, ...).

### 6.4 Streak

Hitung hari lokal anak (`started_at at time zone children.timezone`). `current` = jumlah hari berturut-turut dengan ≥ 1 sesi yang berakhir pada hari ini; bila hari ini belum ada sesi, hitung mundur mulai kemarin (streak belum putus sampai hari ini berakhir). `longest` = rangkaian berturut-turut terpanjang sepanjang riwayat.

### 6.5 Pembangun item (di klien)

Fungsi murni `buildItems(exerciseType, targetLetters, settings, lettersData, wordsData)`:

- Jumlah item = `settings.session_length`. Distribusikan huruf target secara round-robin, lalu acak urutan (tanpa huruf yang sama berurutan jika memungkinkan).
- `choice_count` pilihan: 1 jawaban benar + pengecoh. Pengecoh diambil dari `similar_to` huruf target lebih dulu, lalu huruf acak dengan kategori yang sama.
- `discriminate`: hanya huruf yang `similar_to`-nya tidak kosong. Pengecoh boleh berupa **versi cermin** huruf target (render dengan `scaleX: -1`).
- Fungsi ini bebas efek samping dan harus punya tes unit.

---

## 7. Spesifikasi Visualisasi 3D

### 7.1 Prinsip

Huruf 3D dibuat **prosedural dari data goresan**. Tidak ada font 3D, model, atau tekstur. Satu sumber data (`letters.strokes`) dipakai untuk: viewer 3D, pengecoh 2D (SVG), dan latihan Telusuri.

### 7.2 Format `strokes`

Sistem koordinat ternormalisasi: `x ∈ [0, 1]`, `y` naik ke atas, garis dasar `y = 0`, tinggi huruf kecil `y = 0.6`, ascender `y = 1.0`, descender `y = -0.4`.

json

```
{
  "strokes": [
    { "order": 1, "type": "line", "closed": false, "points": [[0.2, 1.0], [0.2, 0.0]] },
    { "order": 2, "type": "line", "closed": false, "points": [[0.2,0.35],[0.35,0.55],[0.6,0.6],[0.82,0.4],[0.82,0.2],[0.6,0.02],[0.35,0.05],[0.2,0.25]] }
  ]
}
```

- `type`: `"line"` (kurva dari titik-titik) atau `"dot"` (satu titik, untuk titik pada i/j).
- `closed: true` untuk goresan yang menutup (mis. o).
- `order` adalah urutan menulis, dipakai latihan Telusuri.

**Contoh baku (agent boleh menyempurnakan kehalusan kurva):**

`l`: `[{"order":1,"type":"line","closed":false,"points":[[0.5,1.0],[0.5,0.0]]}]`

`i`: `[{"order":1,"type":"line","closed":false,"points":[[0.5,0.6],[0.5,0.0]]},{"order":2,"type":"dot","closed":false,"points":[[0.5,0.85]]}]`

`o`: `[{"order":1,"type":"line","closed":true,"points":[[0.5,0.6],[0.2,0.5],[0.1,0.3],[0.2,0.1],[0.5,0.0],[0.8,0.1],[0.9,0.3],[0.8,0.5],[0.5,0.6]]}]`

`b`: contoh di atas (batang + perut).

**Aturan turunan huruf mirip (wajib, agar relasi geometrinya benar):**

- `d` = `b` dicerminkan horizontal (`x' = 1 − x`).
- `p` = `b` dibalik vertikal (`y' = 0.6 − y`).
- `q` = `p` dicerminkan horizontal (`x' = 1 − x`).
- Setelah transformasi, urutan titik pada goresan batang boleh dibalik agar arah menulis terasa wajar (batang turun dari atas). Yang wajib: bentuk geometrinya adalah transformasi `b`.

Agent membuat data goresan untuk seluruh a–z di `seed.sql` (dibangkitkan lewat skrip `backend/db/generate-strokes.js` yang menghasilkan juga bagian `d`, `p`, `q` dari `b`). Huruf lain cukup disederhanakan dengan 1–3 goresan.

### 7.3 Komponen `Letter3D`

Props: `symbol`, `strokes`, `mirrored` (bool), `autoRotate` (bool), `colors` ({ body, shadow, background }), `height`.

Perilaku:

- Setiap goresan menjadi `TubeGeometry` dari `CatmullRomCurve3` (z = 0), radius ≈ 0.06, 32 segmen memanjang, 8 radial, dengan bola kecil di ujung goresan (cap). Goresan `dot` menjadi bola.
- Seluruh grup dipusatkan pada bounding box dan diskalakan agar muat di viewport.
- Material `MeshStandardMaterial` berwarna `colors.body` (accent koral). Pencahayaan: `ambientLight` + satu `directionalLight` hangat. Di mode gelap, kurangi intensitas agar huruf tidak "menyala".
- "Bayangan": bidang datar di bawah huruf berwarna `colors.shadow` (secondary) dengan opasitas rendah. Tidak memakai shadow map.
- **Rotasi:** seret satu jari memutar sumbu Y (dan sedikit X, dibatasi ±35°) dengan inersia ringan. Ketuk dua kali mereset. `autoRotate` berputar pelan (≈ 0.3 rad/detik) dan berhenti saat disentuh. Hormati `AccessibilityInfo.isReduceMotionEnabled` (jika aktif, `autoRotate` mati).
- **Cermin:** `mirrored` men-animasikan `scale.x` antara 1 dan −1 selama ≈ 400 ms (easing halus).
- Geometri di-`useMemo` dan di-`dispose` saat unmount.
- **Satu `Canvas` per layar.** Jangan menaruh `Canvas` di dalam item `FlatList`. Kartu di list memakai teks/SVG 2D.
- **Fallback:** jika inisialisasi GL gagal atau lama (> 3 detik), tampilkan huruf 2D (SVG dari data goresan) beserta pesan kecil "Tampilan 3D tidak tersedia di perangkat ini". Aplikasi tetap bisa dipakai.

### 7.4 Latihan Telusuri (`trace`)

- Tampilan frontal (kamera ortografis, tanpa rotasi) dengan overlay `react-native-svg` yang menampilkan jalur goresan dan lingkaran penanda awal bernomor.
- Sentuhan dipetakan ke koordinat ternormalisasi. Goresan dianggap tertelusuri bila jari melewati titik-titik jalur secara berurutan dengan toleransi jarak ≈ 0.12 (satuan ternormalisasi, lebih longgar untuk `difficulty` tinggi).
- Bagian yang berhasil ditelusuri terisi warna accent secara progresif. Setelah semua goresan selesai: animasi "pop" dan huruf tampil sebagai model 3D (`Letter3D`), serta bunyi huruf diputar.
- Jika jari melenceng jauh, jangan menghukum: tampilkan animasi titik panduan bergerak di sepanjang jalur sebagai petunjuk (`hint_used = true` setelah dua kali melenceng).
- Item dihitung `is_correct = true` jika seluruh goresan selesai tanpa petunjuk.

---

## 8. Spesifikasi UI/UX

### 8.1 Navigasi

```
RootStack
├─ Onboarding                      (jika belum ada child_id)
├─ MainTabs (Bottom Tab, 5 tab)
│   ├─ Beranda     → HomeScreen
│   ├─ Huruf       → LettersStack: LetterList → LetterDetail
│   ├─ Latihan     → ExerciseStack: ExerciseList → ExerciseDetail → ExerciseSession → SessionSummary
│   ├─ Progres     → ProgressScreen
│   └─ Profil      → ProfileScreen (profil, personalisasi, tema, tentang)
└─ (di atas tab, bottom nav disembunyikan)
    ├─ HistoryScreen   (Riwayat; dari Beranda dan Progres)
    └─ SessionDetail   (dari Riwayat dan kartu "Latihan Terakhir")
```

**Enam halaman utama:** Beranda, Pustaka Huruf, Latihan, Progres, Riwayat, Profil. Lima tab ditampilkan karena enam tab terlalu sesak untuk anak. Riwayat dibuka dari Beranda dan Progres.

**Halaman list dengan detail:** Pustaka Huruf → Detail Huruf, Latihan → Detail Latihan, Riwayat → Detail Sesi.

Tab bar: ikon + label, area sentuh ≥ 56 dp, tab aktif memakai warna accent, tab tidak aktif memakai teks dengan opasitas ≈ 60%.

### 8.2 Tema (terang dan gelap)

Terapkan lewat `ThemeContext`. Pilihan `light | system | dark` disimpan di AsyncStorage (kunci `sinapsa.theme`). Semua komponen membaca token, tidak ada warna hex yang di-hardcode di komponen.

js

```
// mobile/src/theme/tokens.js
export const themes = {
  light: {
    bg: '#FFF4E8', surface: '#FFFAF3', secondary: '#D8D2FF',
    accent: '#FF7A59', onAccent: '#3B2F4A',
    text: '#3B3355', textSecondary: '#6B6385',
    success: '#7ED9B5', retry: '#FFB35C', star: '#FFD76A',
  },
  dark: {
    bg: '#25233A', surface: '#302E4A', secondary: '#3A3F7A',
    accent: '#FF8F6B', onAccent: '#25233A',
    text: '#F5F0E6', textSecondary: '#B3AFC9',
    success: '#6FCFA8', retry: '#FFB35C', star: '#FFD76A',
  },
};

export const letterCategory = {
  vowel: '#FFD9C7',      // peach
  consonant: '#D8D2FF',  // lavender
  lookalike: '#CDEFE3',  // mint
  onCategory: '#3B3355', // teks di atas warna kategori (kedua mode)
};
```

Token | Light | Dark

Primary (latar) | peach-krem `#FFF4E8` | indigo-arang `#25233A`

Surface (kartu) | `#FFFAF3` | `#302E4A`

Secondary (panel) | lavender `#D8D2FF` | biru-ungu tua `#3A3F7A`

Accent | koral-mangga `#FF7A59` | koral hangat `#FF8F6B`

Teks utama | plum gelap `#3B3355` | putih gading `#F5F0E6`

Teks sekunder | `#6B6385` | `#B3AFC9`

Teks di atas tombol accent | `#3B2F4A` | `#25233A`

Benar | mint `#7ED9B5` | `#6FCFA8`

Coba lagi | amber `#FFB35C` | `#FFB35C`

Bintang/hadiah | kuning `#FFD76A` | `#FFD76A`

Aturan: hindari putih murni dan hitam murni. **Teks pada tombol accent selalu gelap** (`onAccent`), bukan putih. Komposisi sekitar 60% latar, 30% secondary, 10% accent. Warna accent dipakai untuk tombol utama, tab aktif, dan sorotan saja.

### 8.3 Warna kategori huruf dan status

Warna latar kartu huruf (sama di kedua mode, teks di atasnya `onCategory`):

- Vokal: peach `#FFD9C7`
- Konsonan: lavender `#D8D2FF`
- Huruf mirip (b/d, p/q, m/w, n/u): mint `#CDEFE3`

**Prioritas:** jika `is_lookalike = true` → mint; selain itu vokal → peach; selain itu konsonan → lavender. Filter chip bersifat independen (huruf `u` tetap muncul di filter Vokal sekaligus Mirip). Huruf mirip diberi ikon kecil ⇄ di sudut kartu supaya maknanya tidak bergantung pada warna.

**Peta penguasaan** tidak memakai warna kategori. Status dibedakan lewat ikon dan border:

- `unseen`: border putus-putus, tanpa ikon
- `needs_practice`: border tebal amber + ikon ↻
- `learning`: border sedang + ikon ◐
- `mastered`: border mint + ikon ★

### 8.4 Umpan balik dan bahasa

- Benar: ikon ✓ + "Hebat!" (mint). Coba lagi: ikon ↻ + "Coba lagi ya" (amber). Petunjuk: "Ayo lihat bersama-sama". Jawaban ditampilkan: "Ini dia jawabannya".
- Dilarang: kata "salah", "gagal", "kamu keliru", merah keras, suara buzzer, dan getaran keras.
- Status tidak boleh hanya mengandalkan warna. Selalu sertakan ikon dan kata (juga demi anak dengan buta warna).
- Pesan error jaringan ramah: "Koneksi lagi bermasalah. Coba lagi ya." + tombol Coba lagi.

### 8.5 Gaya, tipografi, dan gerak

- Sudut membulat besar (radius 20–24), kartu dengan bayangan lembut, ikon besar.
- Area sentuh minimal 48 dp (tombol utama dan item anak ≥ 56 dp).
- Tipografi: font sans-serif bawaan sistem (tanpa file font). Teks isi ≥ 18 sp, judul 24 sp, huruf tampilan besar 96–160 sp. Terapkan `font_scale` (pengaturan anak) pada teks dan `letter_spacing` (em × ukuran font) serta `lineHeight` ≈ 1.5. Rata kiri, tanpa teks rata kanan-kiri (justify), tanpa huruf miring/garis bawah panjang.
- Animasi lembut: durasi 300–600 ms, tanpa kedip cepat (tidak ada flash lebih dari 3 kali per detik). Hormati pengaturan *reduce motion* sistem (animasi bintang menjadi statis).
- **Animasi bintang berkilau** (`StarSparkle`): bintang SVG dengan skala 0.9↔1.1 dan rotasi kecil ±8°, loop ≈ 1.6 detik, dibuat dengan Reanimated/Animated, tanpa file Lottie.
- Maskot dan avatar (`bintang`, `awan`, `bulan`, `daun`, `roket`, `kucing`) digambar dengan `react-native-svg`.
- Setiap layar memiliki tiga keadaan: loading (skeleton sederhana), empty (ilustrasi SVG + kalimat ajakan), dan error (pesan ramah + tombol coba lagi).

### 8.6 Komponen bersama (`mobile/src/components`)

`ThemedText`, `Card`, `PrimaryButton`, `IconButton`, `Chip`, `LetterCard`, `LetterTile` (pilihan jawaban), `ProgressRing`, `WeekStrip`, `StarSparkle`, `Mascot`, `Avatar`, `LineChart`, `CalendarGrid`, `Heatmap`, `MasteryGrid`, `EmptyState`, `ErrorState`, `Skeleton`, `ThemeToggle`, `Letter3D`, `Letter2D` (SVG dari strokes), `MoodPicker`, `ConfirmDialog`.

---

## 9. Persyaratan Non-Fungsional

ID | Persyaratan

NFR-1 Kinerja | Respons API tipikal < 1 detik untuk dashboard dan progres (gunakan agregasi di SQL/dalam satu-dua query, bukan banyak query per hari). Layar Pustaka Huruf tampil < 2 detik dengan 26 huruf.

NFR-2 Keandalan | Timeout request klien 10 detik, error ditangani tanpa crash, `POST /sessions` bersifat atomik (sesi dan item tersimpan bersama atau tidak sama sekali).

NFR-3 Aksesibilitas | Kontras teks ke latar ≥ 4,5:1 pada kedua tema. Label aksesibilitas (`accessibilityLabel`) pada tombol ikon. Tidak bergantung pada warna semata. Mendukung *reduce motion*.

NFR-4 Keamanan dan privasi | Service role key hanya di backend. Validasi semua input. Tidak ada log yang memuat nama anak. Data minimal (nama panggilan, usia, data latihan). CORS dibatasi di produksi.

NFR-5 Portabilitas | Berjalan di Expo Go (Android) saat pengembangan. Layar minimal 360×640 dp. Mendukung orientasi potret saja (kunci potret).

NFR-6 Kualitas kode | ESLint dasar, struktur folder konsisten, fungsi logika inti murni dan dites. Tidak ada `console.log` sisa di build akhir.

NFR-7 Dokumentasi | `README.md` di root (cara menjalankan backend dan mobile, variabel lingkungan, cara seed database, keterbatasan yang diketahui) dan `DECISIONS.md`.

## 10. Struktur Proyek

```
sinapsa/
├─ README.md
├─ DECISIONS.md
├─ backend/
│  ├─ package.json
│  ├─ .env.example
│  ├─ db/
│  │  ├─ schema.sql
│  │  ├─ seed.sql
│  │  └─ generate-strokes.js
│  ├─ src/
│  │  ├─ app.js            # konfigurasi express
│  │  ├─ server.js         # listen
│  │  ├─ config/supabase.js
│  │  ├─ routes/           # letters, words, exerciseTypes, children, sessions, dashboard, progress, recommendations
│  │  ├─ controllers/
│  │  ├─ services/         # mastery.js, recommendation.js, streak.js, progress.js (fungsi murni di sini)
│  │  ├─ repositories/
│  │  ├─ middleware/       # errorHandler, validate
│  │  └─ schemas/          # zod
│  └─ tests/               # jest: mastery, recommendation, streak, POST /sessions
└─ mobile/
   ├─ package.json, app.json, babel.config.js, .env.example
   └─ src/
      ├─ config/appInfo.js           # nama aplikasi, versi, nama pengembang
      ├─ api/client.js, api/*.js     # fetch wrapper (timeout, parsing { data } / { error })
      ├─ theme/tokens.js, ThemeContext.js
      ├─ context/ChildContext.js     # child_id + settings
      ├─ navigation/                 # RootStack, MainTabs, stacks
      ├─ screens/                    # Onboarding, Home, LetterList, LetterDetail, ExerciseList, ExerciseDetail,
      │                              # ExerciseSession, SessionSummary, Progress, History, SessionDetail, Profile
      ├─ exercises/                  # buildItems.js, ListenChoose, Discriminate, MatchPairs, Trace, SyllableBuild
      ├─ three/                      # Letter3D.js, strokeGeometry.js
      ├─ components/
      ├─ hooks/                      # useApi, useSpeech, useTimer, useReduceMotion
      └─ utils/                      # date.js, format.js
```

---

## 11. Rencana Implementasi Bertahap

Setiap fase memiliki **Definition of Done (DoD)**. Jangan lompat fase.

Fase | Isi | DoD

**0. Setup** | Struktur repo, `.env.example`, proyek Supabase, `schema.sql` dan `seed.sql` (huruf, exercise types, words), skrip generator goresan. | Skema berjalan tanpa error, seed menghasilkan 26 huruf lengkap dengan `strokes`.

**1. Backend inti** | Semua endpoint di Bagian 5, logika mastery/rekomendasi/streak sebagai fungsi murni, validasi, error handler. | Tes jest lulus untuk mastery, rekomendasi, streak, dan `POST /sessions`. Semua endpoint bisa dicoba lewat file `backend/requests.http` atau Postman.

**2. Kerangka mobile** | Expo app, `ThemeContext` (terang/gelap/sistem + toggle), navigasi (Bagian 8.1), API client, onboarding, enam layar berisi kerangka dan state loading/empty/error. | Aplikasi berjalan di Expo Go, tema berganti seketika dan tersimpan, enam halaman bisa dibuka.

**3. Pustaka Huruf + 3D** `[MUST]` | LetterList (grid, pencarian, filter), LetterDetail, `Letter3D` (putar, cermin, fallback), TTS. | Huruf b/d/p/q tampil benar sebagai transformasi `b`, tombol cermin dan bunyi berfungsi.

**4. Latihan** `[MUST]` | ExerciseList/Detail, mesin sesi, `listen_choose` dan `discriminate`, timer, aturan 3 percobaan, ringkasan sesi, `POST /sessions`. | Satu sesi penuh tersimpan dan terlihat di database dengan skor dan durasi benar.

**5. Riwayat** `[MUST]` | List per tanggal + paginasi, Detail Sesi, edit, hapus + hitung ulang mastery. | Edit dan hapus bekerja dan mengubah data di Beranda/Progres.

**6. Beranda + Progres** `[MUST/SHOULD]` | Dashboard lengkap (WeekStrip + bintang berkilau, ring target, rekomendasi), grafik akurasi, kalender/heatmap, rekor, peta penguasaan, huruf tertukar. | Semua kartu menampilkan data nyata dari API dan menangani data kosong.

**7. Tambahan** `[SHOULD/COULD]` | `match_pairs`, `trace`, `syllable_build` (aktifkan `is_active`), polesan animasi, pengaturan personalisasi yang memengaruhi sesi. | Jenis yang selesai berfungsi end-to-end. Jenis yang belum selesai ditandai "Segera hadir".

**8. Rilis** | README, `DECISIONS.md`, ESLint bersih, push ke GitHub, (nilai tambah) build APK dengan EAS Build. | Repo bersih tanpa rahasia, APK terpasang dan berjalan (jika dikerjakan).

## 12. Acceptance Criteria dan Checklist

**Ketentuan penugasan**

- [ ] Aplikasi memakai API Express buatan sendiri (semua data lewat `/api/v1`).
- [ ] Bottom navigation bar berfungsi.
- [ ] Enam halaman utama ada: Beranda, Pustaka Huruf, Latihan, Progres, Riwayat, Profil.
- [ ] Minimal dua halaman list dengan detail yang bisa diklik: Pustaka Huruf → Detail Huruf, Latihan → Detail Latihan, Riwayat → Detail Sesi.
- [ ] Halaman Profil/Tentang ada.
- [ ] Mode terang dan gelap, dengan kontrol pemilih yang bekerja dan tersimpan.
- [ ] Kode diunggah ke GitHub, tanpa rahasia.

**Fungsional inti**

- [ ] Onboarding membuat profil anak dan menyimpan `child_id`.
- [ ] Sesi `listen_choose` dan `discriminate` berjalan penuh (3 percobaan, petunjuk, ringkasan, mood, catatan) dan tersimpan.
- [ ] Durasi sesi tercatat otomatis.
- [ ] Beranda menampilkan: Sen–Min dengan bintang berkilau pada hari yang sudah latihan, total sesi, durasi, latihan terakhir, target mingguan, rekomendasi.
- [ ] Detail Huruf menampilkan model 3D yang bisa diputar, tombol cermin, bunyi, contoh kata, tips, dan huruf yang sering tertukar.
- [ ] Huruf d, p, q secara geometris adalah transformasi dari b.
- [ ] Progres menampilkan grafik akurasi, total, frekuensi (kalender atau heatmap), rekor, peta penguasaan.
- [ ] Riwayat dapat melihat, mengedit, dan menghapus sesi, dan hapus memperbarui penguasaan huruf.
- [ ] Rekomendasi berubah setelah anak sering keliru pada suatu huruf.

**UI/UX**

- [ ] Palet sesuai Bagian 8.2 pada kedua tema, tanpa hex yang di-hardcode di komponen.
- [ ] Warna kategori huruf sesuai 8.3 dan huruf mirip memiliki ikon ⇄.
- [ ] Tidak ada kata "salah"/"gagal" atau merah keras di UI.
- [ ] Setiap layar memiliki state loading, empty, dan error.
- [ ] Teks pada tombol accent berwarna gelap.
- [ ] Animasi lembut dan menghormati *reduce motion*.

**Teknis**

- [ ] Tidak ada aset foto/video/audio/font/model 3D dalam repo.
- [ ] Service role key tidak ada di kode mobile maupun riwayat git.
- [ ] Tes unit backend lulus.
- [ ] `README.md` menjelaskan cara menjalankan, variabel lingkungan, dan keterbatasan (tanpa autentikasi, TTS membaca suku kata).

---

## Lampiran A — Seed `letters`

`is_lookalike = true` untuk b, d, p, q, m, w, n, u. Kolom `similar_to` dipakai sebagai sumber pengecoh. `tts_syllable` adalah teks yang dibacakan TTS. Huruf `q`, `v`, `x` jarang dipakai dalam kata Indonesia, jadi beri `difficulty` 4 dan sebutkan hal itu pada `tips`. Emoji bersifat ilustrasi opsional dan wajib memiliki fallback teks bila gagal tampil.

symbol | IPA | tts_syllable | category | lookalike | similar_to | difficulty | contoh kata

a | /a/ | a | vowel | – | e,o | 1 | apel 🍎

b | /b/ | ba | consonant | ✓ | d,p | 3 | bola ⚽

c | /tʃ/ | ca | consonant | – | e,o | 2 | cabai 🌶️

d | /d/ | da | consonant | ✓ | b,q | 3 | dadu 🎲

e | /e/ atau /ə/ | e | vowel | – | a,c | 2 | elang 🦅

f | /f/ | fa | consonant | – | t | 2 | film 🎬

g | /ɡ/ | ga | consonant | – | q | 3 | gajah 🐘

h | /h/ | ha | consonant | – | n,k | 2 | hujan 🌧️

i | /i/ | i | vowel | – | l,j | 1 | ikan 🐟

j | /dʒ/ | ja | consonant | – | i | 2 | jeruk 🍊

k | /k/ | ka | consonant | – | h | 2 | kucing 🐱

l | /l/ | la | consonant | – | i,t | 2 | lampu 💡

m | /m/ | ma | consonant | ✓ | w,n | 3 | mata 👁️

n | /n/ | na | consonant | ✓ | u,m,h | 3 | nasi 🍚

o | /o/ | o | vowel | – | a,c | 1 | ombak 🌊

p | /p/ | pa | consonant | ✓ | q,b | 3 | pisang 🍌

q | /q/ | ka | consonant | ✓ | p,d,g | 4 | Qatar 🌍

r | /r/ | ra | consonant | – | n | 2 | roti 🍞

s | /s/ | sa | consonant | – | z | 2 | sapi 🐄

t | /t/ | ta | consonant | – | f,l | 2 | topi 🧢

u | /u/ | u | vowel | ✓ | n,v | 3 | ular 🐍

v | /v/ | va | consonant | – | u,w | 4 | vas 🏺

w | /w/ | wa | consonant | ✓ | m,v | 3 | wortel 🥕

x | /ks/ | eks | consonant | – | z | 4 | xilofon 🎼

y | /j/ | ya | consonant | – | g | 2 | yogurt 🥛

z | /z/ | za | consonant | – | s,n | 3 | zebra 🦓

Kolom `phoneme_hint`, `tips`, dan `writing_steps` ditulis agent untuk semua huruf dalam Bahasa Indonesia yang sederhana (kalimat pendek, ramah anak), mengikuti templat di Lampiran C. `example_words` diisi minimal 2 kata per huruf (kata pertama dari tabel di atas, kata kedua dipilih agent).

## Lampiran B — Seed `words` (untuk `syllable_build`)

word | syllables | emoji

baju | ba, ju | 👕

buku | bu, ku | 📖

mata | ma, ta | 👁️

mama | ma, ma | 👩

papa | pa, pa | 👨

sapi | sa, pi | 🐄

kuda | ku, da | 🐴

bola | bo, la | ⚽

topi | to, pi | 🧢

roti | ro, ti | 🍞

nasi | na, si | 🍚

mobil | mo, bil | 🚗

## Lampiran C — Templat teks pustaka (contoh `b` dan `d`)

**b**

- `phoneme_hint`: "Bibir tertutup, lalu dilepas: b."
- `tips`: "Huruf b punya batang di kiri dan perut di kanan. Ingat: b seperti 'bola', batangnya di depan bolanya."
- `writing_steps`: ["Tarik garis lurus ke bawah dari atas.", "Kembali ke tengah batang, buat lengkungan ke kanan seperti perut.", "Tutup lengkungan sampai menyentuh batang."]

**d**

- `phoneme_hint`: "Ujung lidah menyentuh gigi atas, lalu dilepas: d."
- `tips`: "Huruf d adalah b yang menghadap ke arah sebaliknya. Perutnya di kiri, batangnya di kanan."
- `writing_steps`: ["Buat lengkungan bulat seperti huruf c.", "Dari atas, tarik garis lurus ke bawah di sisi kanan.", "Pastikan perut ada di kiri batang."]