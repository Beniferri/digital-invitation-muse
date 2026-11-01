# BETA Storia Digital Invitation

Platform undangan digital Indonesia: pernikahan, aqiqah, ulang tahun,
wisuda, syukuran, dan acara perusahaan. Pengguna non-teknis bisa memilih
template, mengisi data acara, dan membagikan undangan lewat WhatsApp
dalam beberapa menit.

## Fitur yang sudah jalan

- **Halaman landing** (`/`): hero, jenis acara, cara kerja, galeri
  template, harga bulanan/tahunan, FAQ.
- **Katalog template** (`/katalog`): filter jenis acara, warna, nuansa.
- **Editor** (`/editor`): tiga kolom — sidebar bagian, panel formulir
  (termasuk seksi Kata-kata dengan format tebal/miring/tautan yang
  aman), dan pratinjau Ponsel/Lebar/Layar penuh. Draf tersimpan
  otomatis di perangkat; pengguna yang masuk bisa menyimpan undangan
  sebagai Draft (foto maks 5 MB).
- **Template halaman penuh Zamrud** (`zamrud-pernikahan`): splash intro,
  sampul, mempelai, ayat, kisah 3 babak + video, acara (1–2 kartu),
  hitung mundur, busana, galeri + lightbox, RSVP panel gelap,
  tanda kasih di balik tombol SEND GIFT, ucapan & doa.
- **Halaman tamu** (`/u/[kode]`): tanpa chrome situs, bar konfirmasi
  persisten, pesan ramah untuk tautan Draft/hilang, RSVP anti-spam
  (honeypot, jeda minimum, batas per IP, hash IP saja).
- **Dasbor pengguna** (`/akun`): undangan sendiri, ubah status, hapus
  dengan konfirmasi, salin tautan tamu, detail RSVP, paket, pembayaran.
- **Dasbor admin** (`/admin`): metrik langganan & pendapatan dari data
  asli, kelola template, undangan, pengguna, pesanan, RSVP, harga.
- **Pembayaran Midtrans** (Snap Redirect + webhook terverifikasi
  signature): paket Hemat/Populer/Keluarga Besar, bulanan/tahunan.
  Aktivasi undangan dari dasbor pengguna butuh langganan aktif + slot;
  aksi admin tidak memeriksa langganan.
- **Halaman legal + SEO**: `/syarat`, `/privasi`, `/bantuan`
  (kontak dari env, kosong = pemberitahuan jujur), sitemap, robots
  (melarang `/admin`, `/akun`, `/api`, `/u`).

Status peluncuran (gerbang BLOKIR, uji beli sungguhan, beta 3–5
pengguna) ada di `DAFTAR-PELUNCURAN.md`. Riwayat pembangunan lengkap
ada di `RENCANA-PENYELESAIAN.md`.

## Teknologi

Next.js 14 (App Router) + React 18 + Tailwind + TypeScript. Database
dua backend di `lib/db.ts`: SQLite (`node:sqlite`, lokal) dan Postgres
(driver `pg`, produksi) — skema sama, placeholder `?` diterjemahkan
ke `$n` untuk Postgres. Auth: email + kata sandi hash scrypt, sesi
database (cookie httpOnly 8 jam). Foto tersimpan di disk
(`UNGGAHAN_DIR`, produksi `/data/unggahan`), bukan di database.

## Jalankan lokal

```bash
npm install
npm run db:seed     # isi template + paket dari data/toko.json
npm run dev         # http://localhost:3000
npm run buat-admin -- <email> <kata-sandi-min-8>
```

Perintah berguna lain: `npm run build`, `npm run uji:tamu` (pengujian
halaman tamu — jalankan `npm run build` dulu).

## Deploy di Coolify

Build Pack **Dockerfile** (bukan Railpack). Yang perlu dipasang:

- Volume persisten `/data` (foto di `/data/unggahan`, cadangan di
  `/data/cadangan`).
- `DATABASE_URL` — produksi memakai Postgres 18 bawaan Coolify, URL
  internal antar container (`postgres://...`). SQLite lama dibiarkan
  sebagai cadangan rollback.
- `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`,
  `MIDTRANS_IS_PRODUCTION` (mulai dari Sandbox; Production setelah
  uji Sandbox lolos). Di dasbor Midtrans: Payment Notification URL
  `https://<domain>/api/midtrans/notifikasi`, Finish Redirect URL
  `https://<domain>/akun`.
- Opsional: `SITUS_URL`, `DUKUNGAN_EMAIL`,
  `DUKUNGAN_WHATSAPP_URL`, `RSVP_IP_SALT`, `UNGGAHAN_DIR`,
  `CADANGAN_DIR`. Daftar lengkap + penjelasan ada di `.env.example`.

Entrypoint image menjalankan seed HANYA kalau tabel template kosong,
dan menyisipkan template baru tanpa menimpa edit admin. Admin TIDAK
perlu dibuat ulang setelah redeploy (akun tersimpan di database);
`buat-admin` hanya perlu lagi kalau database diganti ke yang kosong
atau kata sandi lupa — jalankan dari terminal container.

## Migrasi SQLite -> Postgres

```bash
SUMBER_DATABASE_URL="file:/data/dev.db" \
TUJUAN_DATABASE_URL="postgres://pengguna:kata-sandi@host:5432/nama-db" \
npx tsx scripts/migrasi-ke-postgres.ts
```

Urutan wajib: buat Postgres KOSONG → jalankan migrasi dari terminal
container aplikasi → baru ganti `DATABASE_URL` + redeploy. Jangan
boot aplikasi ke Postgres kosong dulu (entrypoint men-seed template
contoh → target tidak kosong → migrasi menolak). Skrip menolak
target tidak kosong, menyalin mengikuti foreign key
(pengguna, template, paket, undangan, foto galeri, pesanan,
langganan, RSVP, percobaan RSVP), melewati sesi (pengguna login
ulang sekali), dan memverifikasi jumlah baris sumber vs tujuan.
Kalau eksekusi gagal di tengah jalan, target tidak perlu dihapus —
skema dibuat `IF NOT EXISTS` dan kolom dicek dulu sebelum ALTER.

Cadangan: skrip `scripts/cadangkan-db.mjs` (VACUUM INTO, retensi 7)
hanya berlaku untuk SQLite; untuk Postgres pakai `pg_dump` (tindak
lanjut setelah migrasi stabil).

## Struktur proyek

```
app/            Halaman (App Router). app/(situs)/ = halaman website
                ber-chrome; /admin, /akun, /editor, /u, /undangan
                tanpa chrome (tata letak akar polos).
komponen/       Komponen UI + komponen/admin (formulir admin).
lib/            Lapisan data & aksi server (db, sesi, kata sandi,
                aksiAdmin/Pengguna/Rsvp/Pembayaran, midtrans, ...).
data/           Katalog statis (template, paket, FAQ, jenis acara).
db/skema.sql    Skema referensi (sama isinya dengan SKEMA lib/db.ts).
scripts/        seed, buat-admin, migrasi-ke-postgres, cadangan,
                pulih, tambah-templat-baru, perlu-seed.
public/logo/    Logo BETA Storia (lihat catatan aset biner di bawah).
public/templat/ Aset template Zamrud. public/musik/ Musik Zamrud.
docs/           Dokumentasi teknis (mis. halaman-tamu.md).
tests/          Pengujian halaman tamu (tsx, tanpa framework).
```

## Catatan aset biner

Gambar dan musik disimpan di repo sebagai `.b64` (base64 teks),
karena tool push yang dipakai di sini hanya menerima berkas teks
UTF-8. Tahap builder Dockerfile mendekode semuanya kembali ke
bentuk biner (`base64 -d … || exit 1`, gagal = build gagal jelas)
sebelum `npm run build`, jadi berkas tersaji normal di produksi.
Aturannya: aset biner baru WAJIB masuk repo sebagai `.b64` +
didekode di Dockerfile, dan jangan redeploy di antara commit kode
dan commit aset kalau kode merujuk aset tersebut.

## Bahasa

Seluruh antarmuka, komentar kode, dan dokumen ini berbahasa
Indonesia. Nama variabel/fungsi/berkas memakai bahasa Indonesia
baku; istilah Inggris hanya yang teknis lazim.
