# Catatan Keputusan

- Konteks: nama pengembang belum diberikan; pilihan: pertahankan placeholder `[ISI NAMA PENGEMBANG]`; alasan: SRS menugaskan pengisian nama melalui konfigurasi aplikasi dan tidak ada nama yang dapat dipastikan.
- Konteks: fase 1 belum membangun mekanik latihan mobile; pilihan: aktifkan hanya `listen_choose` dan `discriminate`, jenis lain seed sebagai nonaktif; alasan: mengikuti aturan SRS bahwa jenis yang belum diimplementasikan harus terkunci.
- Konteks: repo awal kosong dan backend Fase 1 perlu diuji tanpa kredensial Supabase; pilihan: injeksikan repository ke Express app dan gunakan repository tiruan di tes; alasan: menjaga batas data dan menguji API secara deterministik.
- Konteks: POST sesi memperbarui sesi, item, dan mastery; pilihan: hitung delta dengan fungsi murni di backend lalu tulis ketiganya melalui satu RPC PostgreSQL transaksional; alasan: kegagalan atau percobaan ulang tidak meninggalkan sesi tanpa item/mastery.
- Konteks: data seed strokes harus mudah diperbarui tanpa merusak transformasi b/d/p/q; pilihan: jadikan `generate-strokes.js` sumber pembangkit `seed.sql`; alasan: geometri turunan selalu dihasilkan dari geometri `b` yang sama.
- Konteks: Supabase key tidak tersedia di lingkungan pengembangan; pilihan: konfigurasi server memerlukan kredensial hanya ketika default repository digunakan; alasan: tes endpoint dapat berjalan tanpa rahasia maupun koneksi eksternal.
- Konteks: kolom `age` di SRS mengizinkan null di database tetapi onboarding mengharuskan usia; pilihan: API membuat profil selalu memerlukan usia; alasan: mengikuti persyaratan onboarding.
- Konteks: SRS membolehkan goresan huruf selain b disederhanakan; pilihan: gunakan garis prosedural 1–3 goresan dan turunkan d/p/q persis dari b; alasan: memenuhi seluruh alphabet tanpa aset eksternal.
- Konteks: NFR-6 meminta pemeriksaan ESLint dasar; pilihan: tambahkan ESLint dengan aturan inti tanpa plugin; alasan: memenuhi kualitas minimum dengan dependensi dan konfigurasi yang ringkas.
