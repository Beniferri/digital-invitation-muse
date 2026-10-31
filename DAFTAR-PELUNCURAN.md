# Daftar Peluncuran UndanganKita (Tahap 5)

Dokumen ini adalah gerbang pengumuman. Jangan mengumumkan situs ke publik
sampai semua item bertanda **BLOKIR** selesai. Item yang sudah selesai di
kode ditandai `[x]`; sisanya `[ ]` dan butuh tindakan manusia (tidak bisa
dikerjakan AI dari sini).

## 1. Pembayaran Production — BLOKIR

- [ ] Pasang di environment Coolify: `MIDTRANS_SERVER_KEY`,
  `MIDTRANS_CLIENT_KEY` (Production, bukan Sandbox), dan
  `MIDTRANS_IS_PRODUCTION="true"`.
- [ ] Di dasbor Midtrans Production (Settings > Configuration):
  Payment Notification URL = `https://inv.benifin.my.id/api/midtrans/notifikasi`,
  Finish Redirect URL = `https://inv.benifin.my.id/akun`.
- [ ] Uji beli sungguhan satu paket termurah (Hemat bulanan Rp 49.000)
  dengan akun yang bukan admin: bayar → webhook → langganan Aktif →
  aktivasi undangan berhasil → RSVP masuk dari HP lain.
- [ ] Catatan: uji Sandbox (Tahap 2) belum pernah lolos karena kunci
  Sandbox belum ada. Kalau Production langsung diuji tanpa Sandbox,
  risikonya sama dengan uji Sandbox — tapi dengan uang sungguhan.
  Disarankan tetap uji Sandbox dulu kalau sempat.

## 2. Kontak dukungan — BLOKIR

- [ ] Pasang `DUKUNGAN_EMAIL` dan/atau `DUKUNGAN_WHATSAPP_URL` di
  environment Coolify, lalu buka `/bantuan` dan pastikan tombol kontak
  tampil (bukan pemberitahuan "belum diumumkan").
- [ ] Siapkan siapa yang menjawab pesan dukungan dan jam berapa
  (cukup ditulis di sini setelah diputuskan).

## 3. Cadangan dan monitoring — BLOKIR

- [ ] Pasang cron harian yang menjalankan cadangan di dalam container
  (mis. `docker exec <container> node scripts/cadangkan-db.mjs`),
  lalu pastikan satu berkas cadangan muncul di `/data/cadangan`.
- [ ] Uji pulih di SALINAN database (bukan database produksi):
  salin `dev.db` ke tempat lain, jalankan `pulihkan-db.mjs` ke salinan
  itu, pastikan datanya kembali. Jangan menguji pulih langsung di
  produksi.
- [ ] Pastikan healthcheck Coolify memakai path `/api/sehat` dan
  container dilaporkan sehat setelah redeploy.

## 4. Harga final dan akun admin cadangan

- [ ] Konfirmasi harga katalog sudah final: Hemat Rp 49.000/490.000,
  Populer Rp 99.000/990.000, Keluarga Besar Rp 199.000/1.990.000
  (bulanan/tahunan). Perubahan harga hanya berlaku untuk pembelian
  baru; langganan yang sudah dibeli tidak berubah sampai habis.
- [ ] Buat akun admin kedua lewat terminal container
  (`npm run buat-admin -- email kata-sandi`) dan simpan kredensialnya
  di tempat aman, terpisah dari akun admin utama.
- [ ] Baca sekali `/syarat` dan `/privasi` dari situs produksi. Kalau
  ada badan usaha (PT/CV) yang harus dicantumkan, tambahkan ke halaman
  Syarat sebelum pengumuman — saat ini halaman itu tidak mencantumkan
  nama badan usaha apa pun.

## 5. Uji beta (3–5 pengguna nyata) — BLOKIR

Cari 3–5 orang (keluarga/teman, bukan pengelola) dan minta mereka
menjalankan tugas ini dari HP masing-masing, tanpa didampingi:

1. Daftar akun baru, lalu buat undangan dari Editor (pilih templat,
   isi nama/tanggal/lokasi, simpan). Catat bagian mana yang membingungkan.
2. Beli paket Hemat bulanan (Rp 49.000, uang sungguhan — tawarkan
   ganti rugi manual kalau perlu, karena pengembalian dana memang
   diproses manual), lalu aktifkan undangan dari dasbor.
3. Bagikan tautan tamu lewat WhatsApp ke orang lain, lalu orang itu
   membuka undangan dan mengisi RSVP dari HP-nya (termasuk kirim ulang
   dengan nama sama untuk mengubah jawaban).
4. Pemilik undangan membuka detail RSVP: periksa ringkasan, filter
   "Masih ragu", dan unduh CSV — pastikan angkanya sama dengan dasbor.
5. Laporkan SEMUA yang terasa aneh, lambat, atau tidak jelas —
   termasuk kata-kata yang sulit dipahami.

- [ ] Semua temuan beta sudah diperbaiki atau dicatat sebagai
  batas yang diketahui (dan ditulis di halaman Bantuan kalau perlu).
- [ ] Data uji beta sudah dibersihkan dari produksi (undangan uji,
  RSVP uji, pesanan uji) ATAU dibiarkan dengan sadar sebagai contoh.

## 6. Redeploy dan smoke test akhir

- [ ] Push terbaru sudah di-deploy di Coolify (Build Pack Dockerfile,
  volume `/data`, `DATABASE_URL=file:/data/dev.db`).
- [ ] Buka dari HP: beranda, katalog, editor, satu halaman tamu contoh,
  `/api/sehat` (harus 200), dan satu kali masuk/keluar akun.
- [ ] Periksa `/sitemap.xml` dan `/robots.txt` bisa dibuka.
- [ ] Periksa pratinjau tautan: tempel satu tautan tamu Aktif di
  WhatsApp dan pastikan judul + deskripsi undangannya muncul (bukan
  judul generik).

## 7. Kriteria selesai Tahap 5

- [ ] Satu pelanggan yang bukan penguji internal berhasil membeli
  paket dan membagikan undangan yang RSVP-nya masuk.

## Yang sengaja TIDAK memblokir peluncuran

- Pindah ke Postgres (Tahap 4): SQLite tetap backend produksi yang
  didukung. Pindah hanya kalau sudah ada alasan nyata (beban/traffic).
- Fitur setelah rilis: amplop digital, musik latar, galeri multi-foto,
  domain kustom per undangan, analitik lanjutan, tema template baru.
