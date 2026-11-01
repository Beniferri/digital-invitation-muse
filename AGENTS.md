# AGENTS.md — Panduan untuk agen yang melanjutkan proyek ini

BETA Storia Digital Invitation: platform undangan digital Indonesia
(Next.js 14 App Router + React 18 + Tailwind + TypeScript).
Produksi: Coolify (Build Pack Dockerfile), domain inv.benifin.my.id,
database Postgres 18 bawaan Coolify (sejak 1 Nov 2026; migrasi dari
SQLite selesai + terverifikasi).

## Keadaan saat ini (1 Nov 2026)

- Postgres LIVE (`DATABASE_URL` `postgres://...`). SQLite lama hanya
  berkas rollback di volume server (`/data/dev.db`), bukan database
  yang jalan. Hapus berkas itu hanya setelah Postgres berjalan
  stabil + cadangan pg_dump sudah ada.
- Pembayaran Midtrans: kode selesai (Sandbox + Production), tapi
  kunci + uji Sandbox masih menunggu operator. Aktivasi Production
  dan uji beli sungguhan ada di `DAFTAR-PELUNCURAN.md` (gerbang
  BLOKIR).
- Peluncuran belum diumumkan: beta 3–5 pengguna + satu pelanggan
  non-internal membeli + RSVP masuk = kriteria selesai proyek.
- Template: Seruni, Melati, Kala Senja (kartu), Zamrud (halaman
  penuh).

## Cara menjalankan & memverifikasi

- `npm install`, `npm run db:seed`, `npm run dev`.
- Sebelum mengklaim selesai: `npx tsc --noEmit` bersih +
  `npm run build` lolos + cek halaman terkait di server fixture
  (jangan klaim dari build saja). `npm run uji:tamu` untuk halaman
  tamu (build dulu).
- Bukti live, bukan klaim: `/api/sehat`, halaman yang render, isi
  database. Katalog yang menampilkan template BUKAN bukti database
  sehat (ada fallback data statis).

## Aturan yang tidak boleh dilanggar

- Bahasa Indonesia di semua antarmuka, komentar, dokumen, dan nama
  variabel/fungsi/berkas. Istilah Inggris hanya yang teknis lazim.
- Kejujuran data: jangan mengarang harga, komisi, hasil, atau
  testimoni. Bedakan fakta terverifikasi, estimasi, hipotesis.
- Visual AI = ilustrasi, bukan bukti hasil. Dilarang before-after
  palsu dan klaim produk menyesatkan.
- Aset biner (gambar, musik, logo) HANYA sebagai `.b64` di repo +
  decode di tahap builder Dockerfile (`base64 -d … || exit 1`).
  Jangan push biner mentah; jangan redeploy di antara commit kode
  dan commit aset kalau kode merujuk aset itu.
- Jangan ubah skema tanpa migrasi runtime yang idempotent (pola
  `kolomAda` + ALTER di `lib/db.ts`). `SKEMA` di `lib/db.ts` dan
  `db/skema.sql` harus sama isinya.
- Jangan boot aplikasi ke database kosong yang akan di-seed
  (entrypoint men-seed template contoh kalau tabel template kosong).

## Perilaku produk yang sering disalahpahami

- Editor selalu menyimpan sebagai Draft. Halaman tamu Draft -> 404
  (pesan ramah); Aktif menerima RSVP; Selesai tampil tapi formulir
  tutup.
- Aktivasi dari dasbor pengguna butuh langganan aktif + slot
  (`bolehAktifkanUndangan`); aksi admin `ubahStatusUndangan` TIDAK
  memeriksa langganan (UPDATE polos) — itu sengaja.
- Satu kode tamu per undangan (bukan per orang); distribusi via grup
  WhatsApp. Pesan RSVP terlihat pemegang tautan (bukan privat).
- Halaman tamu tanpa chrome situs (grup rute `(situs)` adalah
  satu-satunya tempat Navigasi + KakiHalaman). Jangan kembalikan
  chrome ke layout akar, jangan pakai cek pathname.
- Dengan `loading.tsx`, halaman tamu Draft/kode hilang berstatus
  200 (soft-404) — diputuskan dipertahankan; `/u/*` dilarang robots.
- Foto maks 5 MB (sampul + galeri maks 6). Foto di disk
  (`UNGGAHAN_DIR`), bukan database. Volume `/data` jangan dihapus.
- RSVP: nama wajib, kehadiran Hadir/Ragu/Tidak (formulir tamu kini
  Hadir/Berhalangan; Berhalangan dikirim sebagai Tidak), jumlah
  maks 10 (0 kalau Tidak), anti-ganda per nama, anti-spam
  (honeypot, jeda 3 detik, 20/jam/IP, hash IP saja).

## Struktur (ringkas)

- `app/(situs)/` = halaman website ber-chrome. `/admin`, `/akun`,
  `/editor`, `/u`, `/undangan` = tanpa chrome.
- `lib/db.ts` = lapisan database (async, dua backend). `lib/aksi*`
  = server actions. `data/` = katalog statis + seed
  (`data/toko.json`).
- `scripts/` = seed, buat-admin, tambah-templat-baru, perlu-seed.
  (Skrip migrasi Postgres + cadangan SQLite DIHAPUS 1 Nov 2026
  setelah migrasi selesai; cadangan kini pg_dump — lihat README.)
- `public/logo/` = logo (ikon + lockup horizontal, `.b64` di repo).
  `public/templat/`, `public/musik/` = aset Zamrud (`.b64` di repo).
- `RENCANA-PENYELESAIAN.md` = log riwayat pembangunan (jangan tulis
  ulang sejarah; tambah seksi baru). `DAFTAR-PELUNCURAN.md` =
  gerbang peluncuran. `docs/halaman-tamu.md` = detail teknis
  halaman tamu.

## Operasi

- Buat admin: `npm run buat-admin -- <email> <kata-sandi-min-8>`
  dari terminal container (setelah `DATABASE_URL` menunjuk database
  yang benar — kalau tidak, akun tertulis ke database yang salah).
- Cadangan Postgres: pg_dump dari terminal container Postgres
  (lihat README bagian Cadangan). Belum ada cron otomatis.
- Kunci Midtrans HANYA lewat environment variable, tidak pernah di
  repo, berkas ter-commit, atau chat.
