# UndanganKita — Prototipe Undangan Digital (MVP)

Prototipe cepat untuk platform undangan digital Indonesia: pernikahan,
khitanan, aqiqah, ulang tahun, wisuda, syukuran, dan acara perusahaan.

Tujuan MVP ini sederhana: pengguna non-teknis bisa memilih template, mengisi
data acara, dan membagikan undangan lewat WhatsApp dalam beberapa menit.

## Yang sudah ada di MVP

- **Halaman landing** (`/`): hero dengan contoh undangan nyata, jenis acara,
  cara kerja tiga langkah, galeri tiga template, harga dengan sakelar
  bulanan/tahunan, FAQ, dan ajakan bertindak yang jelas.
- **Katalog template** (`/katalog`): filter berdasarkan jenis acara, warna,
  dan nuansa. Template dipilih bebas dan tidak terikat paket harga.
- **Editor** (`/editor`): formulir dan pratinjau dalam satu layar. Kolomnya
  sama untuk semua jenis acara: nama pertama, nama kedua (opsional), tanggal,
  lokasi, dan foto. Isian (kecuali foto) tersimpan otomatis di localStorage
  perangkat dan dipulihkan saat kembali ke editor. Pengguna yang sudah masuk
  bisa menekan Simpan untuk menyimpan undangan sebagai Draft miliknya (foto
  ikut diunggah, maks 5 MB); pengguna yang belum masuk diarahkan ke
  daftar/masuk dengan tujuan kembali `/editor`, supaya isiannya tetap ada
  saat kembali.
- **Contoh undangan** (`/undangan/[slug]`): route dinamis App Router yang
  membaca data dari toko admin. Tampilannya mobile-first, dan satu-satunya tombol
  berbagi adalah tombol WhatsApp dengan pesan yang sudah terisi.
- **Dasbor admin** (`/admin`): ringkasan, kelola template (tambah, ubah,
  aktifkan/nonaktifkan, hapus), kelola undangan (tambah, ubah status, hapus),
  dan ubah nominal harga. Perubahan admin tersimpan dan langsung tampil di
  situs publik setelah halaman diperbarui.
- **Undangan tamu + RSVP** (`/u/[kode]`): halaman undangan asli dari
  database yang dibagikan ke tamu lewat tautan pendek (mis. `/u/rms62hgm`),
  lengkap dengan formulir konfirmasi kehadiran dan dinding ucapan/doa.
- **Dasbor pengguna** (`/akun`): undangan milik pengguna sendiri, lengkap
  dengan tautan tamu dan ringkasan RSVP per undangan.

## Fondasi (Tahap 2): database, auth, dan penyimpanan foto

Mulai tahap ini, data tidak lagi disimpan di `data/toko.json` saat aplikasi
jalan. Berkas itu hanya dipakai sekali sebagai sumber seed awal.

- **Database (Tahap 4: dua backend):** defaultnya SQLite bawaan Node
  (`node:sqlite`, berkas `dev.db` lewat `DATABASE_URL`). Kalau
  `DATABASE_URL` diawali `postgres://`/`postgresql://`, aplikasi memakai
  Postgres yang di-hosting (mis. layanan Postgres di Coolify atau
  Supabase) lewat driver `pg` — skema dan kuerinya sama, placeholder
  `?` diterjemahkan ke `$1, $2, ...` di `lib/db.ts`, dan semua fungsi
  lapisan itu asinkron. Skema ada di `db/skema.sql` dan dibuat otomatis
  oleh `lib/db.ts` saat database pertama dibuka: Pengguna, Sesi,
  Templat, Undangan, PaketHarga, Pesanan, Langganan, PercobaanRsvp.
  Catatan jujur: dukungan Postgres di kode sudah paritas dengan SQLite
  (tes alur penuh lolos di keduanya, lihat RENCANA-PENYELESAIAN Tahap 4),
  tapi belum pernah dites ke server Postgres sungguhan — sebelum
  memindah produksi, baca dulu bagian migrasi di bawah.
- **Auth sungguhan:** kata sandi di-hash dengan scrypt (`lib/kataSandi.ts`),
  sesi disimpan di tabel Sesi dan dikirim sebagai cookie httpOnly
  (`lib/sesi.ts`). Tidak ada lagi kata sandi bawaan `admin123` dan tidak
  ada lagi gerbang demo di middleware (berkas middleware sudah dihapus;
  proteksi ada di server component dan server action lewat `wajibAdmin()`).
- **Akun:** daftar lewat `/daftar`, masuk lewat `/masuk`, halaman akun di
  `/akun`, masuk admin lewat `/admin/login` (hanya akun berperang admin).
- **Foto sampul template:** admin bisa mengunggah foto sampul di formulir
  template (maksimal 5 MB, JPG/PNG/WebP). Berkas disimpan lewat
  `lib/penyimpananFoto.ts` ke folder `UNGGAHAN_DIR` (default
  `public/unggahan` untuk lokal; di image Docker, `/data/unggahan` di
  dalam volume persisten yang sama dengan database, jadi foto tidak
  hilang saat redeploy). Jalur publiknya tetap `/unggahan/<nama>`,
  dilayani route `/api/unggahan/[nama]` (dengan fallback ke
  `public/unggahan` untuk berkas lama). Batasnya: di platform serverless
  murni tanpa volume, unggahan tetap bisa hilang — untuk itu, ganti
  `simpanFoto` dengan penyimpanan objek (Supabase Storage/S3) tanpa
  mengubah pemanggilnya.

### Menjalankan fondasi dari nol

```bash
npm install
cp .env.example .env.local
# .env.local sudah berisi DATABASE_URL="file:./dev.db" untuk SQLite lokal
npm run db:seed      # membuat tabel otomatis + memindahkan isi data/toko.json ke database
npm run buat-admin -- admin@contoh.id kata-sandi-minimal-8-karakter
npm run dev
```

Akun admin yang dibuat lewat skrip di atas dipakai untuk masuk ke
`/admin/login`. Kata sandi tidak pernah ditulis ke berkas proyek.

## Deploy di Coolify

Ada dua penyebab situs deploy tampil kosong yang sudah diperbaiki di kode,
bukan cuma di pengaturan Coolify. Keduanya harus dipahami supaya tidak
terulang:

1. **Database tidak ikut repo dan tidak pernah di-seed di container.**
   `dev.db` masuk `.gitignore`, jadi container pertama selalu mulai dengan
   tabel kosong.
2. **Halaman publik dulunya statis.** Landing, katalog, editor, dan contoh
   undangan dulunya di-prerender saat build — dan saat build di builder
   (Railpack/Docker), databasenya masih kosong. Hasil build itu membeku
   dalam keadaan kosong, jadi walaupun database runtime sudah di-seed,
   halaman publik tetap menampilkan "Belum ada template aktif" sampai
   rebuild berikutnya. Sekarang semua halaman publik itu dinamis
   (`force-dynamic`), jadi selalu dibaca segar dari database runtime.

### Cara Dockerfile (disarankan)

Pakai Build Pack **Dockerfile** di Coolify (bukan Railpack), dengan
`Dockerfile` di root repo ini. Dockerfile ini memakai Node 24 secara
eksplisit, build, lalu jalan lewat `docker-entrypoint.sh`:

- Entrypoint memeriksa database lewat `scripts/perlu-seed.mjs`: kalau
  tabel template masih kosong, ia menjalankan `npm run db:seed` sekali.
  Kalau database sudah berisi (mis. dari volume setelah redeploy), seed
  **dilewati** supaya edit template/paket/undangan lewat dasbor tidak
  tertimpa kembali ke data contoh.
- Langkah di Coolify: pilih Build Pack Dockerfile, pasang volume persisten
  ke `/data`, set environment variable `DATABASE_URL=file:/data/dev.db`,
  lalu redeploy. Setelah container jalan, buat akun admin sekali lewat
  terminal container (`npm run buat-admin -- email kata-sandi`) — seed
  tidak membuat akun admin, jadi langkah ini tetap manual sekali saja.
- Catatan: foto sampul yang diunggah lewat admin tersimpan di
  `public/unggahan/` di dalam container dan ikut hilang saat redeploy
  kalau folder itu tidak ikut di-volume-kan. Itu keterbatasan yang
  diketahui, bukan bagian dari perbaikan database ini.

### Cara Railpack

Repo ini bisa di-deploy Railpack apa adanya (build `npm install` +
`npm run build`, jalan `npm run start`). Yang perlu diperhatikan hanyalah
database-nya, karena database **tidak ikut di dalam repo**.

- **Kenapa situs deploy pertama tampil kosong:** `dev.db` masuk
  `.gitignore` dan tidak di-push ke GitHub. Saat container pertama dibuka,
  kode membuat tabel kosong otomatis, jadi landing menampilkan "Belum ada
  template aktif" dan katalog menampilkan 0 template. Itu bukan gagal
  build — datanya memang belum pernah diisi di container itu.
- **Isi database sekali, di container Coolify:** buka Terminal container
  di Coolify, lalu jalankan (di folder kerja aplikasi):
  ```bash
  npm run db:seed
  npm run buat-admin -- email-kamu kata-sandi-minimal-8-karakter
  ```
  Seed mengisi 3 template, 3 paket, dan 2 undangan contoh. Seed tidak
  membuat akun admin, jadi dua perintah itu harus dua-duanya. Setelah itu
  refresh situs dan masuk ke `/admin/login` dengan akun yang baru dibuat.
- **Supaya data tidak hilang saat redeploy:** pasang volume persisten di
  Coolify untuk lokasi database, lalu set environment variable
  `DATABASE_URL` ke berkas di dalam volume itu, misalnya
  `DATABASE_URL="file:/data/dev.db"` dengan volume yang dipasang di `/data`.
  Kode sudah membuat folder induk database otomatis kalau belum ada, jadi
  path volume apa pun langsung jalan. Urutan yang benar: pasang volume +
  set `DATABASE_URL` dulu, redeploy, baru jalankan seed + buat-admin di
  container yang baru — setelah itu redeploy berikutnya tidak perlu seed
  ulang karena datanya tinggal di volume.
- **Jangan jalankan seed di setiap start:** skrip seed menimpa template
  dan paket dari `data/toko.json`, jadi kalau dijalankan tiap container
  mulai, edit template/paket yang dilakukan lewat dasbor admin akan
  tertimpa kembali ke data contoh. Seed hanya untuk pengisian pertama
  saat database masih kosong.
- **Jangan mem-push `dev.db` ke GitHub** sebagai jalan pintas: selain
  berisi hash akun, tiap redeploy akan mengembalikan database ke versi di
  repo dan menghapus RSVP serta undangan yang sudah masuk.
- **Versi Node:** proyek ini butuh Node 24 (`engines` di `package.json`),
  karena `node:sqlite` tidak jalan di Node 20.

## Undangan tamu + RSVP

Setiap undangan punya `kode_tamu` pendek (8 karakter, dibuat otomatis saat
undangan ditambahkan; undangan lama dari database sebelum fitur ini mendapat
kode lewat migrasi otomatis di `lib/db.ts`). Tautan tamunya adalah
`/u/[kode_tamu]` — tautan inilah yang dibagikan ke tamu, bukan id database
yang panjang.

- **Halaman tamu** (`/u/[kode]`): menampilkan kartu undangan asli (nama,
  tanggal, lokasi, template yang dipilih) dengan gaya template yang sama
  seperti halaman contoh, lalu formulir RSVP dan dinding ucapan/doa.
- **Aturan status:** undangan `Aktif` menerima RSVP; `Draft` tidak
  dipublikasikan (halaman tamu mengembalikan 404); `Selesai` masih bisa
  dilihat tapi formulir RSVP-nya ditutup.
- **Formulir RSVP:** nama tamu (wajib), kehadiran (Hadir / Masih ragu /
  Tidak bisa hadir), jumlah tamu maksimal 10 orang, dan pesan/doa opsional
  (maksimal 500 karakter). Tamu yang memilih tidak bisa hadir tidak
  menyumbang hitungan tamu.
- **Anti-ganda:** satu nama yang sama di undangan yang sama hanya punya
  satu balasan — kirim ulang dengan nama yang sama memperbarui jawaban lama,
  bukan menambah balasan baru, supaya hitungan tamu tidak mengganda.
- **Admin** melihat ringkasan RSVP di daftar undangan dan dasbor, membuka
  detail RSVP di `/admin/undangan/[id]` (ringkasan, tautan tamu, daftar
  balasan lengkap), dan bisa menghapus balasan spam atau salah isi.
- **Data RSVP** tersimpan di tabel `rsvp` (lihat `db/skema.sql`), dengan
  foreign key ke undangan — menghapus undangan ikut menghapus balasan RSVP-nya.
- **Tahap 3 (RSVP lebih berguna):** di detail RSVP admin dan pengguna ada
  sorotan "Tamu yang akan datang" (jumlah tamu dari balasan Hadir saja —
  Ragu belum dihitung, Tidak tidak dihitung), filter daftar berdasarkan
  kehadiran (`?kehadiran=Hadir/Ragu/Tidak`, ringkasan tetap dari daftar
  penuh), dan tombol Unduh CSV (`/api/rsvp/[id]/csv`, hanya admin dan
  pemilik undangan). CSV selalu berisi semua balasan (bukan yang
  terfilter) dengan urutan yang sama seperti dasbor, format RFC 4180 +
  BOM UTF-8 supaya Excel membacanya benar — jumlah baris CSV sama dengan
  total balasan di dasbor, dan jumlah tamu Hadir di CSV sama dengan angka
  "Tamu yang akan datang".

## Dasbor admin dan dasbor pengguna

- **Dasbor admin** (`/admin`): Ringkasan langganan & pendapatan dengan
  kerangka sidebar + topbar (komponen `ShellAdmin`: sidebar desktop,
  drawer geser di ponsel, pencarian global, lencana pesanan yang perlu
  perhatian, profil admin). Kartu metrik: MRR (langganan Aktif; tahunan
  dihitung nominal/12), langganan aktif (bulanan/tahunan), pengguna
  (+akun baru 30 hari), dan churn 30 hari (langganan Diganti bukan
  churn). Grafik batang pendapatan lunas 12 bulan, sebaran paket aktif,
  dan tabel aktivitas terbaru (pesanan, langganan, akun baru) dengan
  pencarian, filter jenis, dan unduh CSV (`/api/admin/aktivitas/csv`,
  hanya admin). Semua angka dihitung dari database (`lib/dasborAdmin`),
  bukan angka contoh. Menu lain: Langganan (`/admin/langganan`, filter
  status), Pendapatan & Tagihan (`/admin/pesanan`), Pengguna & Akun
  (`/admin/pengguna`, cari email/nama), Undangan, RSVP (`/admin/rsvp`:
  isi RSVP Ringkasan lama dipindah ke sini), Templat, Harga. Pencarian
  global di topbar membuka `/admin/cari` (akun, undangan, pesanan).
- **Dasbor pengguna** (`/akun`): hanya undangan yang dibuat pengguna itu
  sendiri. Pengguna bisa membuat undangan baru dari `/akun/undangan/baru`
  (hanya template aktif yang bisa dipilih), mengubah status, menghapus,
  dan membuka detail RSVP miliknya di `/akun/undangan/[id]` (hanya baca;
  hapus balasan dilakukan admin). Kepemilikan diperiksa di server di setiap
  aksi dan halaman detail: membuka detail undangan orang lain diarahkan
  kembali ke `/akun`, dan undangan admin lama (tanpa pemilik) tidak muncul
  di dasbor pengguna. Admin yang masuk tetap mengelola semua undangan dari
  `/admin`.

## Pembayaran Midtrans (Tahap 2 rencana penyelesaian)

Alur uang sudah jalan di kode (uji Sandbox masih menunggu kunci, lihat di bawah):

- **Beli paket** (`/akun/paket`): pengguna memilih paket (Hemat 1 slot,
  Populer 3 slot, Keluarga Besar 10 slot) dan periode (bulanan/tahunan),
  lalu server membuat pesanan berstatus Menunggu dan meminta token Snap ke
  Midtrans. Pengguna diarahkan ke halaman bayar Midtrans (Snap Redirect).
- **Halaman pembayaran** (`/akun/pembayaran/[id]`): menampilkan status
  pesanan dari database. Kalau Midtrans gagal saat membuat token, pesanan
  tetap tersimpan dan ada tombol "Coba Buat Pembayaran Lagi" — tidak perlu
  membuat pesanan baru.
- **Webhook** (`/api/midtrans/notifikasi`): satu-satunya jalur yang mengubah
  status pesanan jadi Lunas/Gagal dan mengaktifkan langganan. Tanda tangan
  notifikasi diverifikasi dengan SHA512(order_id + status_code +
  gross_amount + ServerKey), nominal dicocokkan dengan pesanan, dan
  aktivasi langganan idempotent (notifikasi ganda tidak membuat langganan
  ganda). Callback peramban tidak pernah mengubah status.
- **Aturan paket yang ditegakkan:**
  - Membuat undangan (Draft) selalu gratis — dari editor maupun dasbor.
  - Mengubah status jadi Aktif butuh langganan aktif + slot tersisa;
    kalau tidak ada, pengguna diarahkan membeli paket dengan pesan yang jelas.
  - Durasi langganan mengikuti periode bayar: bulanan 30 hari, tahunan 1 tahun
    sejak pembayaran lunas. (Catatan: teks katalog lama yang menyebut masa
    aktif per paket — 30/90/365 hari — sudah diubah jadi "Masa aktif selama
    langganan berjalan" supaya tidak bertentangan dengan aturan ini.)
  - Membeli paket baru menggantikan langganan aktif lama (status Diganti);
    masa aktif tidak ditumpuk.
  - Kedaluwarsa diperiksa malas: saat dasbor atau halaman tamu dibuka,
    langganan yang sudah lewat tanggalnya diubah jadi Selesai dan undangan
    Aktif di bawahnya ikut jadi Selesai (tamu tetap bisa melihat, RSVP ditutup).
  - Undangan admin lama (tanpa pemilik) tidak kena batas paket.
  - Refund/chargeback tidak mengubah status otomatis — diurus manual lewat admin.
- **Dasbor pengguna** (`/akun`): seksi Langganan Saya (paket, tanggal
  berakhir, slot terpakai) + Riwayat Pembayaran (tautan ke halaman tiap pesanan).
- **Dasbor admin** (`/admin/pesanan`): daftar pesanan (email, paket, nominal,
  status, metode) + daftar langganan + total lunas kasar (sebelum biaya Midtrans
  dan pajak). Halaman ini hanya baca.

### Yang harus dipasang sebelum pembayaran bisa dites/dipakai

1. **Akun Midtrans Sandbox** (dulu, sebelum Production): daftar di Midtrans,
   ambil Server Key + Client Key dari Settings > Access Keys.
2. **Environment variable di Coolify** (tidak pernah di repo):
   `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION="false"`
   untuk Sandbox. Lihat `.env.example`.
3. **Dasbor Midtrans > Settings > Configuration (Sandbox dulu):**
   - Payment Notification URL: `https://inv.benifin.my.id/api/midtrans/notifikasi`
   - Finish Redirect URL: `https://inv.benifin.my.id/akun` (supaya pelanggan
     kembali ke dasbor setelah bayar; status resmi tetap datang lewat webhook,
     jadi kalau pelanggan tidak kembali pun langganan tetap aktif).
4. **Uji Sandbox end-to-end** dengan metode bayar Sandbox (mis. QRIS/VA
   Sandbox): pilih paket → bayar → webhook → langganan aktif → aktivasi
   undangan berhasil, dan aktivasi di luar slot ditolak dengan pesan jelas.
   Setelah lolos, ganti ke kunci Production + `MIDTRANS_IS_PRODUCTION="true"`
   dan ulangi konfigurasi dasbor di akun Production.

## Fondasi produksi (Tahap 4 rencana penyelesaian)

- **Migrasi ke Postgres (opsional, belum aktif di produksi):**
  1. Buat database Postgres kosong (layanan Postgres di Coolify atau Supabase).
  2. Dari mesin yang bisa menjangkau KEDUA database, jalankan:
     `SUMBER_DATABASE_URL="file:/data/dev.db" TUJUAN_DATABASE_URL="postgresql://..." npx tsx scripts/migrasi-ke-postgres.ts`
     (skrip menolak jalan kalau target sudah berisi data; tabel `sesi`
     sengaja tidak disalin — pengguna login ulang sekali; hash kata sandi
     ikut pindah apa adanya).
  3. Ganti `DATABASE_URL` di Coolify ke URL Postgres, lalu redeploy.
  4. Verifikasi: masuk sebagai pengguna lama (kata sandi sama), buka
     undangan lama + RSVP-nya, lalu cek satu pembelian baru end-to-end.
  5. Cadangan Postgres: pakai `pg_dump` (skrip `cadangkan-db.mjs` di bawah
     khusus SQLite dan akan menolak URL Postgres dengan pesan jelas).
  6. Yang belum terverifikasi: migrasi ini sudah dites ke emulator
     Postgres (pg-mem) dan paritas alurnya lolos, tapi belum pernah dites
     ke server Postgres sungguhan. Jangan jadikan Postgres sebagai satu-
     satunya salinan data sebelum langkah 4 di atas lolos.
- **Cadangan SQLite (sudah dites pulihnya):**
  `node scripts/cadangkan-db.mjs [folder]` membuat salinan konsisten
  (VACUUM INTO, boleh jalan saat server hidup), memeriksa salinannya,
  dan menghapus cadangan di luar retensi (default 7, `CADANGAN_RETENSI`).
  Folder default: `CADANGAN_DIR`, atau `/data/cadangan` kalau database di
  `/data`, atau `./cadangan`. Pulihkan dengan (server HARUS berhenti dulu):
  `node scripts/pulihkan-db.mjs <file-cadangan>` — skrip menolak jalan
  kalau ada berkas jurnal (tanda server masih jalan), menyimpan salinan
  pengaman database aktif, lalu menimpa. Jadwal otomatis belum terpasang
  di dalam image: pasang satu cron di host/Coolify yang menjalankan
  skrip cadangan di dalam container setiap hari (mis. lewat
  `docker exec <container> node scripts/cadangkan-db.mjs`).
- **Pengaman spam RSVP:** honeypot (`situs_web` tersembunyi), jeda minimum
  3 detik dari render halaman, dan batas 20 kiriman per jam per IP per
  undangan (tabel `percobaan_rsvp`, hanya hash IP yang disimpan — pasang
  `RSVP_IP_SALT` acak di produksi; baris >1 jam terhapus otomatis di
  setiap pengecekan). Kalau spam lolos juga, langkah berikut adalah
  CAPTCHA (mis. Turnstile/hCaptcha) — belum dibangun.
- **Healthcheck:** `GET /api/sehat` menjawab 200 kalau aplikasi hidup dan
  database bisa dijangkau (500 kalau tidak). Dockerfile memasang
  HEALTHCHECK ke endpoint ini; di Coolify, pakai path `/api/sehat`.

## Rilis (Tahap 5 rencana penyelesaian)

- **Halaman legal dan bantuan:** `/syarat`, `/privasi`, `/bantuan`
  (ditautkan dari footer). Isinya sesuai perilaku produk yang
  sebenarnya — baca sebelum mengubah perilaku produk, dan perbarui
  halaman ini bersamaan kalau perilaku berubah.
- **Kontak dukungan:** pasang `DUKUNGAN_EMAIL` dan/atau
  `DUKUNGAN_WHATSAPP_URL` di environment Coolify. Kalau keduanya
  kosong, `/bantuan` menampilkan pemberitahuan bahwa kontak belum
  diumumkan — dan itu memblokir pengumuman (lihat
  `DAFTAR-PELUNCURAN.md`).
- **SEO:** metadata tiap halaman utama, `sitemap.xml` dan `robots.txt`
  otomatis (hanya halaman publik; `/admin`, `/akun`, `/api`, dan
  undangan tamu `/u` tidak diindeks), dan pratinjau Open Graph dinamis
  untuk halaman tamu (judul nama + jenis acara, foto undangan/sampul
  kalau ada). Alamat situs dari `SITUS_URL` (lihat `.env.example`).
- **Checklist peluncuran:** `DAFTAR-PELUNCURAN.md` adalah gerbang
  pengumuman — jangan mengumumkan sebelum semua item BLOKIR selesai
  (Midtrans Production + uji beli sungguhan, kontak dukungan, cron
  cadangan, healthcheck, harga final, akun admin cadangan, uji beta
  3–5 pengguna nyata).

## Yang sengaja tidak ada di MVP

CMS dan fitur lanjutan (amplop digital, musik latar, galeri multi-foto,
domain kustom per undangan, analitik lanjutan). Sejak Tahap 2 rencana
penyelesaian, pembayaran dan batas paket sudah ditegakkan (lihat di atas).

## Teknologi

- Next.js 14.2 (App Router) + React 18
- Tailwind CSS 3.4
- TypeScript
- Seluruh ilustrasi adalah SVG inline buatan sendiri. Foto placeholder berasal
  dari layanan picsum.photos yang tidak membutuhkan kunci API.

## Cara menjalankan

```bash
npm install
npm run db:seed
npm run buat-admin -- admin@contoh.id kata-sandi-minimal-8-karakter
npm run dev
```

Lalu buka http://localhost:3000 (admin di http://localhost:3000/admin)

Untuk memeriksa hasil build produksi:

```bash
npm run build
npm run start
```

## Struktur folder

```text
app/
  page.tsx                  # Landing (membaca toko admin)
  katalog/page.tsx          # Katalog template (membaca toko admin)
  editor/page.tsx           # Editor (bungkus Suspense untuk parameter tautan)
  undangan/[slug]/page.tsx  # Contoh undangan dinamis (membaca toko admin)
  u/[kode]/page.tsx         # Halaman tamu + formulir RSVP + dinding ucapan
  admin/                    # Dasbor admin: ringkasan, template, undangan, harga, pesanan
  admin/login/page.tsx      # Halaman masuk admin (akun database)
  admin/undangan/[id]/page.tsx  # Detail RSVP satu undangan (admin) + filter + unduh CSV
  api/rsvp/[id]/csv/route.ts  # Unduh CSV RSVP (admin atau pemilik undangan)
  admin/pesanan/page.tsx    # Daftar pesanan + langganan (hanya baca)
  api/midtrans/notifikasi/route.ts  # Webhook Midtrans (ubah status pesanan, aktifkan langganan)
  masuk/page.tsx            # Masuk pengguna biasa
  daftar/page.tsx           # Daftar pengguna biasa
  akun/page.tsx             # Dasbor pengguna: undangan milik sendiri + RSVP + langganan + riwayat bayar
  akun/undangan/baru/page.tsx   # Tambah undangan milik pengguna
  akun/undangan/[id]/page.tsx   # Detail RSVP milik pengguna (hanya baca) + filter + unduh CSV
  akun/paket/page.tsx       # Beli paket (Midtrans Snap Redirect)
  akun/pembayaran/[id]/page.tsx # Status satu pesanan + lanjut/coba lagi bayar
  layout.tsx                # Tata letak, huruf, navigasi, dan kaki halaman
  globals.css               # Gaya dasar, kartu kaca, dan aturan reduced-motion
data/
  toko.json                 # Sumber seed awal saja (bukan penyimpanan jalan)
  templat.ts                # Bentuk data template
  jenisAcara.ts             # Daftar jenis acara untuk landing
  paketHarga.ts             # Paket harga rupiah dan pemformat rupiah
  pertanyaanUmum.ts         # FAQ
komponen/
  admin/                    # Formulir template dan undangan untuk admin
  Navigasi.tsx              # Bilah atas (termasuk tautan Admin)
  KakiHalaman.tsx           # Kaki halaman
  KartuTemplat.tsx          # Kartu galeri/katalog
  PratinjauUndangan.tsx     # Kartu undangan yang dipakai editor dan contoh
  IlustrasiOrnamen.tsx      # SVG ornamen dan ikon garis buatan sendiri
  FormulirEditor.tsx        # Formulir + pratinjau satu layar
  FilterKatalog.tsx         # Filter katalog
  BagianHarga.tsx           # Sakelar periode + kartu harga
  SakelarPeriode.tsx        # Sakelar bulanan/tahunan
  KartuHarga.tsx            # Satu kartu harga
  DaftarPertanyaan.tsx      # FAQ akordeon
  TombolWhatsApp.tsx        # Tombol berbagi WhatsApp dengan pesan terisi
  BagikanUndangan.tsx      # Bagikan undangan nyata: WhatsApp + salin tautan
db/
  skema.sql                 # Skema database: Pengguna, Sesi, Templat, Undangan, PaketHarga, Rsvp, Pesanan, Langganan
scripts/
  seed.ts                   # Pindahkan data/toko.json ke database
  buat-admin.ts             # Buat akun admin di database
  perlu-seed.mjs            # Cek database kosong untuk entrypoint Docker (JS polos)
Dockerfile                  # Image Coolify: Node 24, build, jalan via entrypoint
docker-entrypoint.sh        # Seed sekali kalau database masih kosong, lalu jalan
.dockerignore               # Berkas yang tidak masuk image (dev.db, .env, .next)
lib/
  format.ts                 # Format tanggal Indonesia dan tautan WhatsApp
  tokoData.ts               # Baca data dari database (SQLite) untuk publik dan admin, termasuk filter RSVP
  csvRsvp.ts                # Pembangun CSV RSVP (fungsi murni, RFC 4180 + BOM UTF-8)
  aksiAdmin.ts              # Server action admin: CRUD template/undangan/harga + hapus RSVP
  aksiPengguna.ts           # Server action pengguna: undangan milik sendiri (cek kepemilikan), termasuk simpan dari editor
  aksiRsvp.ts               # Server action RSVP tamu (publik, anti-ganda per nama)
  aksiOtentikasi.ts         # Server action masuk/daftar/keluar
  aksiPembayaran.ts         # Server action buat pesanan + coba lagi token Snap
  midtrans.ts               # Snap Redirect + verifikasi signature webhook (tanpa pustaka eksternal)
  langganan.ts              # Data pesanan/langganan: slot, kedaluwarsa, aktivasi idempotent
  lanjut.ts                 # Daftar putih tujuan kembali setelah masuk/daftar
  sesi.ts                   # Sesi database + cookie httpOnly, wajibAdmin()
  kataSandi.ts              # Hash scrypt untuk kata sandi
  db.ts                     # Koneksi SQLite + fungsi baca/tulis database
  penyimpananFoto.ts        # Simpan foto sampul template
```

## Bahasa dan penamaan

Seluruh antarmuka, komentar kode, dan dokumen ini memakai bahasa Indonesia.
Nama berkas, variabel, dan fungsi memakai bahasa Indonesia baku yang mudah
dibaca (misalnya `daftarTemplat`, `pilihTemplat`, `formatTanggalIndonesia`).
Istilah teknis yang lazim (Next.js, Tailwind, WhatsApp, `createObjectURL`)
tetap dipakai karena tidak ada padanan yang wajar.

## Desain

Bahasa desain utama adalah glassmorphism: kartu semi-transparan dengan
backdrop blur, border tipis terang, dan cahaya ambient hangat di belakangnya.
Aksennya mengambil nuansa Indonesia: emas, merah tanah, dan terakota, dengan
detail halus terinspirasi batik (garis parang) dan bunga melati.

Tiap template punya variasi visual sendiri:

- **Seruni** (pernikahan, tradisional): kartu berlengkung atas, cahaya emas,
  pola parang.
- **Melati** (aqiqah, islami): kartu bulat penuh, hijau sage yang teduh,
  ornamen melati.
- **Kala Senja** (wisuda, modern): tata letak asimetris, cahaya terakota,
  garis senja.

Kontras teks dijaga untuk standar WCAG AA (teks cokelat tua di atas krem
terang, tombol gelap dengan teks putih), tombol minimal 48px untuk ponsel,
dan animasi dihormati lewat `prefers-reduced-motion` di `globals.css`.

## Catatan kejujuran data

Harga, tanggal, nama, dan lokasi di prototipe ini adalah contoh demo.
Foto di pratinjau dan halaman contoh adalah foto placeholder, bukan foto
acara sungguhan. Jangan memakai contoh ini sebagai undangan asli tanpa
mengganti datanya di editor.
