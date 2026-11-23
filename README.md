# SINAPSA

Media latihan grafem-fonem untuk anak, mengikuti [SRS](./SRS_Sinapsa.md). Aplikasi terdiri dari REST API Express yang menyimpan data melalui Supabase dan aplikasi Android Expo/React Native JavaScript.

## Backend

1. Gunakan Node.js LTS.
2. Dari `backend`, jalankan `npm install`.
3. Salin `.env.example` menjadi `.env`, lalu isi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`. Atur `CORS_ORIGIN` ke origin yang diizinkan untuk deployment (hindari `*`).
4. Di Supabase SQL Editor, jalankan `db/schema.sql`, lalu `db/seed.sql`. Untuk membangkitkan ulang seed lengkap (26 huruf, goresan prosedural, contoh kata, dan lima jenis latihan aktif), jalankan `npm run db:seed`.
5. Jalankan `npm run dev`. API tersedia di `http://localhost:3000/api/v1`.
6. Pemeriksaan: `npm test` dan `npm run lint`.

Jalankan kembali `db/seed.sql` pada proyek Supabase yang sudah ada untuk mengaktifkan semua jenis latihan dan memperbarui data goresan. `SUPABASE_SERVICE_ROLE_KEY` hanya digunakan backend. Jangan membaca/menempelkan nilainya ke log, dan jangan commit `.env`.

## Aplikasi mobile

1. Mulai backend dan pastikan komputer serta ponsel berada di jaringan yang sama.
2. Di `mobile`, jalankan `npm install`.
3. Salin `.env.example` menjadi `.env`. URL awal menggunakan IP LAN komputer pengembangan saat ini (`192.168.18.52`). Jika alamat berubah, lihat `ipconfig` lalu ubah `EXPO_PUBLIC_API_URL` menjadi `http://<IP-LAN>:3000/api/v1`; jangan gunakan `localhost` pada ponsel.
4. Jalankan `npm start`, lalu buka proyek dengan Expo Go. Jika firewall Windows meminta izin, izinkan koneksi jaringan privat ke backend.

Verifikasi pengembangan: `npm run test:logic`, `npm run lint`, dan `npx expo export --platform android`. Paket tidak memakai foto, audio, font, video, atau model 3D eksternal. Bunyi menggunakan text-to-speech perangkat; bentuk huruf dibuat dari data goresan. Jika WebGL tidak tersedia, viewer memakai proyeksi SVG pseudo-3D yang tetap dapat diputar dengan gestur.

### Build APK dengan EAS

Build tidak dijalankan di sini karena memerlukan akun Expo:

1. Buat akun/organisasi dan login: `npx eas-cli@latest login`.
2. Siapkan proyek EAS untuk aplikasi ini jika diminta: `npx eas-cli@latest init`.
3. Atur `EXPO_PUBLIC_API_URL` pada environment EAS yang digunakan ke API yang dapat dijangkau ponsel. Alamat LAN hanya berfungsi pada jaringan lokal yang sama; untuk distribusi di luar jaringan, gunakan alamat backend publik HTTPS.
4. Buat APK internal: `npx eas-cli@latest build --platform android --profile preview`.

Konfigurasi `preview` menghasilkan APK; konfigurasi `production` menghasilkan Android App Bundle.

## API

Semua endpoint berada di `/api/v1`; contoh request ada di [backend/requests.http](./backend/requests.http). Respons sukses berbentuk `{ "data": ... }` dan error berbentuk `{ "error": { "code", "message", "details" } }`. Aplikasi mobile hanya mengakses Express API, bukan Supabase secara langsung.

## Keterbatasan dan status validasi

- Belum ada autentikasi: `child_id` adalah pengenal profil lokal, bukan bukti identitas. Simpan hanya nama panggilan, usia, dan data latihan. Satu perangkat menggunakan satu profil anak.
- Pengguna telah menjalankan uji `backend/requests.http` terhadap Supabase: endpoint GET, PUT, dan DELETE yang dicoba mengembalikan 200; `POST /children` dan `POST /sessions` mengembalikan 201 Created (sesuai HTTP). `GET /letters` mengembalikan 26 huruf, kelima jenis latihan aktif, dan POST sesi mengembalikan `mastery_updates`. Hasil ini dilaporkan pengguna dan belum diverifikasi ulang otomatis.
- Penggunaan suara, gerakan 3D/WebGL dan fallback SVG pseudo-3D, gestur tracing, serta tampilan pada ukuran layar berbeda masih perlu diperiksa di HP.
- TTS bahasa Indonesia dapat membacakan nama huruf alih-alih fonem; bunyi disampaikan sebagai suku kata.
- Unit test backend/mobile, lint backend/mobile, ekspor bundle Android, dan uji API live yang dilaporkan pengguna berhasil. Build EAS dan uji perangkat belum dijalankan.
