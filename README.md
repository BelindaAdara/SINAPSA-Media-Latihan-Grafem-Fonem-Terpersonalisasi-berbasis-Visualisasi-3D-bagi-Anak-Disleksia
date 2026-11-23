# SINAPSA

Media latihan grafem-fonem untuk anak, mengikuti [SRS](./SRS_Sinapsa.md).

## Status fase

- Fase 0: struktur backend, skema Supabase, seed 26 huruf, dan generator goresan.
- Fase 1: REST API Express, validasi, layanan logika inti, dan tes.
- Fase berikutnya belum dimulai.

## Menjalankan backend

1. Gunakan Node.js LTS.
2. Dari `backend`, jalankan `npm install`.
3. Salin `.env.example` menjadi `.env`, lalu isi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`. Saat production, atur `CORS_ORIGIN` ke origin aplikasi yang diizinkan (bukan `*`).
4. Jalankan `npm run db:seed` untuk meregenerasi `db/seed.sql`; jalankan `schema.sql` lalu `seed.sql` pada SQL Editor Supabase.
5. Jalankan `npm run dev`. API tersedia di `http://localhost:3000/api/v1`.
6. Jalankan pemeriksaan kode dengan `npm run lint` dan tes dengan `npm test`.

`SUPABASE_SERVICE_ROLE_KEY` hanya digunakan di backend. Jangan masukkan `.env` ke Git.

## API

Semua endpoint berada di `/api/v1`; contoh request ada di `backend/requests.http`. Respons sukses berbentuk `{ "data": ... }` dan error berbentuk `{ "error": { "code", "message", "details" } }`.

## Keterbatasan yang diketahui

- Belum ada autentikasi: `child_id` adalah pengenal profil lokal, bukan bukti identitas. Simpan hanya nama panggilan, usia, dan data latihan.
- Satu perangkat menggunakan satu profil anak; aplikasi mobile tidak mengakses Supabase secara langsung.
- TTS bahasa Indonesia dapat membacakan nama huruf alih-alih fonem; bunyi disampaikan sebagai suku kata.
- API memerlukan proyek Supabase untuk operasi data. Tes otomatis memakai repository tiruan dan tidak memerlukan kredensial.
