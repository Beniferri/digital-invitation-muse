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
  lokasi, dan foto. Foto dari perangkat hanya dipratinjau lewat
  `URL.createObjectURL`, tidak diunggah ke server, dan hilang saat halaman
  dimuat ulang.
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

- **Database:** SQLite bawaan Node (`node:sqlite`, berkas `dev.db` lewat
  `DATABASE_URL`). Skema ada di `db/skema.sql` dan dibuat otomatis oleh
  `lib/db.ts` saat database pertama dibuka: Pengguna, Sesi, Templat,
  Undangan, PaketHarga. Tidak ada dependensi biner eksternal, jadi proyek
  langsung jalan tanpa akun layanan luar. Untuk Postgres yang di-hosting
  (misalnya Supabase), ganti lapisan `lib/db.ts` dengan driver Postgres —
  pemanggilnya tidak berubah, karena mereka hanya memakai fungsi baca/
  tulis di lapisan itu.
- **Auth sungguhan:** kata sandi di-hash dengan scrypt (`lib/kataSandi.ts`),
  sesi disimpan di tabel Sesi dan dikirim sebagai cookie httpOnly
  (`lib/sesi.ts`). Tidak ada lagi kata sandi bawaan `admin123` dan tidak
  ada lagi gerbang demo di middleware (berkas middleware sudah dihapus;
  proteksi ada di server component dan server action lewat `wajibAdmin()`).
- **Akun:** daftar lewat `/daftar`, masuk lewat `/masuk`, halaman akun di
  `/akun`, masuk admin lewat `/admin/login` (hanya akun berperang admin).
- **Foto sampul template:** admin bisa mengunggah foto sampul di formulir
  template (maksimal 5 MB, JPG/PNG/WebP). Berkas disimpan di
  `public/unggahan/` lewat `lib/penyimpananFoto.ts`. Batasnya: di platform
  serverless dengan sistem berkas sementara, unggahan bisa hilang saat
  deployment ulang — untuk produksi di platform seperti itu, ganti
  `simpanFoto` dengan penyimpanan objek (Supabase Storage/S3) tanpa mengubah
  pemanggilnya.

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

## Dasbor admin dan dasbor pengguna

- **Dasbor admin** (`/admin`): metrik gabungan (template aktif, undangan
  aktif, harga mulai, total balasan RSVP, total tamu konfirmasi hadir),
  status undangan (aktif/draft/selesai), RSVP terbaru, RSVP per undangan,
  undangan terbaru, dan daftar template. Semua angka dibaca segar dari
  database setiap kali halaman dibuka.
- **Dasbor pengguna** (`/akun`): hanya undangan yang dibuat pengguna itu
  sendiri. Pengguna bisa membuat undangan baru dari `/akun/undangan/baru`
  (hanya template aktif yang bisa dipilih), mengubah status, menghapus,
  dan membuka detail RSVP miliknya di `/akun/undangan/[id]` (hanya baca;
  hapus balasan dilakukan admin). Kepemilikan diperiksa di server di setiap
  aksi dan halaman detail: membuka detail undangan orang lain diarahkan
  kembali ke `/akun`, dan undangan admin lama (tanpa pemilik) tidak muncul
  di dasbor pengguna. Admin yang masuk tetap mengelola semua undangan dari
  `/admin`.

## Yang sengaja tidak ada di MVP

Pembayaran sungguhan dan CMS. Editor (`/editor`) masih berupa pratinjau
lokal yang tidak tersimpan — undangan yang tersimpan dibuat lewat dasbor
admin atau dasbor pengguna di atas.

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
  admin/                    # Dasbor admin: ringkasan, template, undangan, harga
  admin/login/page.tsx      # Halaman masuk admin (akun database)
  admin/undangan/[id]/page.tsx  # Detail RSVP satu undangan (admin)
  masuk/page.tsx            # Masuk pengguna biasa
  daftar/page.tsx           # Daftar pengguna biasa
  akun/page.tsx             # Dasbor pengguna: undangan milik sendiri + RSVP
  akun/undangan/baru/page.tsx   # Tambah undangan milik pengguna
  akun/undangan/[id]/page.tsx   # Detail RSVP milik pengguna (hanya baca)
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
db/
  skema.sql                 # Skema database: Pengguna, Sesi, Templat, Undangan, PaketHarga, Rsvp
scripts/
  seed.ts                   # Pindahkan data/toko.json ke database
  buat-admin.ts             # Buat akun admin di database
lib/
  format.ts                 # Format tanggal Indonesia dan tautan WhatsApp
  tokoData.ts               # Baca data dari database (SQLite) untuk publik dan admin
  aksiAdmin.ts              # Server action admin: CRUD template/undangan/harga + hapus RSVP
  aksiPengguna.ts           # Server action pengguna: undangan milik sendiri (cek kepemilikan)
  aksiRsvp.ts               # Server action RSVP tamu (publik, anti-ganda per nama)
  aksiOtentikasi.ts         # Server action masuk/daftar/keluar
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
