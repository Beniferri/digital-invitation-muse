# Rencana Penyelesaian UndanganKita

Status per 31 Okt 2026: produk sudah jalan di https://inv.benifin.my.id/
(MVP + fondasi database + admin + dasbor pengguna + undangan tamu/RSVP +
deploy Dockerfile di Coolify). Rencana ini adalah jalan menuju versi yang
bisa dijual dan dipakai pelanggan sungguhan — bukan daftar fitur tanpa akhir.

Prinsip: selesaikan alur uang dulu (orang bisa membuat, membagikan, dan
membayar), baru tambah pemanis. Fitur yang sengaja ditunda ke setelah rilis:
amplop digital, musik latar, galeri multi-foto, domain kustom per undangan,
dan analitik lanjutan.

## Posisi sekarang

Sudah selesai:
- Landing, katalog, editor pratinjau, contoh undangan, harga rupiah
- Database SQLite, auth scrypt + sesi, dasbor admin, dasbor pengguna
- Undangan tamu `/u/[kode]` + RSVP (anti-ganda per nama, maks 10 tamu)
- Deploy Dockerfile di Coolify dengan volume persisten + seed otomatis
  kalau database masih kosong

Masih bolong (ini yang diselesaikan rencana ini):
- Editor belum menyimpan apa pun — undangan yang tersimpan hari ini dibuat
  lewat formulir dasbor, bukan dari editor yang dilihat pengunjung
  (selesai Tahap 1)
- Belum ada pembayaran sungguhan — paket harga baru pajangan
  (selesai di kode Tahap 2; uji Sandbox Midtrans masih menunggu kunci)
- Belum ada batas paket yang ditegakkan (jumlah undangan aktif, masa aktif)
  (selesai Tahap 2)
- Database masih SQLite berkas lokal + foto sampul di dalam container
  (selesai di kode Tahap 4: backend Postgres opsional + foto ke volume
  /data; verifikasi Postgres sungguhan dan redeploy masih tertunda)
- Belum ada halaman syarat/ketentuan, privasi, dan bantuan
  (selesai di kode Tahap 5; uji beta + checklist peluncuran masih
  menunggu tindakan manusia, dan kriteria "satu pelanggan bukan penguji
  internal membeli + RSVP masuk" belum terjadi)

## Tahap 1 — Editor yang benar-benar menyimpan (inti produk) — SELESAI 31 Okt 2026

Selesai di kode dan terverifikasi sebatas yang bisa dites di sandbox ini
(lihat catatan pengujian di bawah). Yang belum dites: klik-tayang penuh di
peramban sungguhan — server action POST gagal di sandbox ini untuk SEMUA
aksi (termasuk RSVP lama yang dulu pernah jalan) dengan galat "Connection
closed", dan browser uji tidak bisa menjangkau server lokal VM ini
(localhost ditolak, tunnel gagal karena egress proxy). Verifikasi ulang
klik-tayang disarankan di situs Coolify setelah push, dengan akun uji yang
lalu dibersihkan.

Tujuan: pengunjung yang mencoba editor bisa berakhir dengan undangan
nyata yang bisa dibagikan, bukan cuma pratinjau yang hilang saat refresh.

- Editor tetap bisa dicoba tanpa login; state editor disimpan otomatis di
  perangkat (localStorage) supaya tidak hilang kalau pengguna diminta login
- Tombol Simpan: kalau belum login, arahkan ke daftar/masuk, lalu kembali
  ke editor dengan data yang tadi masih utuh; kalau sudah login, simpan
  sebagai undangan milik pengguna itu (status awal Draft)
- Setelah simpan, arahkan ke dasbor pengguna dengan tautan tamu yang jelas
  dan tombol bagikan
- Halaman tamu mendapat tombol bagikan WhatsApp (pesan terisi: nama acara,
  tanggal, dan tautan `/u/[kode]`) dan tombol salin tautan
- Kriteria selesai: dari HP, orang asing bisa buka editor, isi data, daftar,
  simpan, buka tautan tamu, dan RSVP-nya muncul di dasbor pemilik

## Tahap 2 — Pembayaran Midtrans (kunci monetisasi)

**Status: SELESAI DI KODE 31 Okt 2026, MENUNGGU UJI SANDBOX.** Uji
end-to-end dengan Midtrans Sandbox belum bisa jalan karena kunci Sandbox
belum ada (lihat "Keputusan yang dibutuhkan" di bawah + README bagian
"Pembayaran Midtrans"). Jangan tandai Tahap 2 tuntas sepenuhnya sebelum
uji Sandbox lolos.

Yang sudah dibangun (semua di kode, build lolos, logika dites tanpa kunci
Midtrans — lihat catatan pengujian di bawah):

- Tabel `pesanan` + `langganan`, kolom `paket_harga.maks_undangan_aktif`
  (Hemat 1, Populer 3, Keluarga Besar 10) + migrasi otomatis di `lib/db.ts`
- Checkout Snap Redirect dari `/akun/paket` (token + redirect_url dari API
  Midtrans, tanpa pustaka eksternal — `lib/midtrans.ts`), halaman satu
  pesanan `/akun/pembayaran/[id]` (tombol lanjut bayar / coba lagi token)
- Webhook `/api/midtrans/notifikasi`: verifikasi SHA512, cocokkan nominal,
  idempotent, satu-satunya jalur yang mengubah status jadi Lunas dan
  mengaktifkan langganan
- Penegakan batas di `ubahStatusUndanganPengguna` dan
  `tambahUndanganPengguna` (status Aktif); Draft selalu gratis
- Kedaluwarsa malas di dasbor + halaman tamu (langganan habis → Selesai,
  undangan Aktif ikut Selesai)
- Riwayat pembayaran di `/akun`, daftar pesanan + langganan di
  `/admin/pesanan`, tombol "Beli Paket Ini" di kartu harga landing
- Kunci hanya lewat environment variable (`.env.example` diperbarui)

Keputusan yang diambil saat eksekusi (bisa diubah, tapi dicatat supaya
tidak hilang):

- **Draft gratis, Aktif wajib paket** — sesuai opsi yang diajukan di rencana
  awal ("1 undangan Draft gratis, Aktif wajib paket"). Belum ada masa
  gratis berbatas waktu; kalau user mau trial gratis, itu fitur baru.
- **Durasi mengikuti periode bayar (bulanan 30 hari, tahunan 1 tahun)**,
  BUKAN durasi per paket 30/90/365 hari. Alasannya: teks katalog lama
  ("Masa aktif 30/90/365 hari per undangan") bertentangan dengan arti
  bulanan/tahunan (bayar tahunan Hemat 490rb tapi cuma aktif 30 hari
  tidak masuk akal). Teks katalog diubah jadi "Masa aktif selama
  langganan berjalan" (di `data/toko.json` + `data/paketHarga.ts`).
  Satu-satunya tempat yang menentukan durasi: `durasiHariPeriode()` di
  `lib/midtrans.ts` — mengubah aturan durasi = ubah fungsi itu saja.
- **Langganan baru menggantikan yang lama** (status Diganti), masa aktif
  tidak ditumpuk.
- **Harga dipakai apa adanya dari katalog** (49rb/99rb/199rb bulanan,
  490rb/990rb/1.990rb tahunan) — belum ada konfirmasi final dari user
  bahwa harga ini final; kalau berubah, ubah lewat dasbor admin / harga
  (nominal di database, bukan hardcode di kode bayar).

Catatan pengujian Tahap 2 (31 Okt 2026): build lolos; fungsi murni
(signature, badan Snap, slot, kedaluwarsa) dites via tsx; webhook dites
via curl dengan tanda tangan buatan (kunci uji lokal) termasuk idempotensi
dan penolakan tanda tangan salah; token Snap dites lewat mock server
lokal (bukan Midtrans sungguhan) karena kunci Sandbox belum ada; POST
server action tetap tidak bisa dites di sandbox ini (masalah lingkungan
yang sama seperti Tahap 1 — "Connection closed"), jadi klik-tayang
checkout harus dites di Coolify setelah kunci Sandbox dipasang.

Tujuan: paket harga yang sekarang cuma pajangan bisa dibeli dan
mengaktifkan batas yang dijanjikan.

- Akun Midtrans (mulai dari Sandbox, produksi setelah diuji) — kunci API
  hanya lewat environment variable di Coolify, tidak pernah masuk repo
- Tabel pesanan + langganan: paket yang dibeli, nominal, status bayar,
  tanggal mulai dan berakhir
- Checkout dengan Midtrans Snap dari halaman harga / dasbor pengguna,
  dan webhook notifikasi yang mengubah status pesanan menjadi lunas
- Penegakan batas: Hemat = 1 undangan aktif, Populer = 3, Keluarga Besar =
  10; masa aktif 30 / 90 / 365 hari. Undangan yang melewati masa aktif
  berubah menjadi Selesai (halaman tamu tetap bisa dilihat, RSVP ditutup —
  aturan yang sama dengan yang sudah ada)
- Riwayat pembayaran di dasbor pengguna; daftar pesanan di dasbor admin
- Kriteria selesai: pembayaran Sandbox end-to-end jalan (pilih paket →
  bayar → webhook → paket aktif → batas undangan aktif ditegakkan, dan
  percobaan membuat undangan aktif melebihi batas ditolak dengan pesan
  yang jelas, bukan error kosong)

Masih terbuka (butuh user, menghambat uji Sandbox — bukan menghambat kode):

- **Akun Midtrans Sandbox sudah ada atau belum?** Kalau belum, user harus
  daftar di Midtrans dan memasang `MIDTRANS_SERVER_KEY` +
  `MIDTRANS_CLIENT_KEY` di environment Coolify, plus mengatur Payment
  Notification URL dan Finish Redirect URL di dasbor Midtrans (detail di
  README). Tanpa ini, tombol bayar akan gagal dengan pesan jelas dan
  pesanan tetap Menunggu — itu perilaku yang disengaja, bukan bug.
- **Harga paket sudah final?** Saat ini dipakai apa adanya dari katalog
  (49rb/99rb/199rb bulanan). Kalau mau diubah, ubah lewat dasbor admin.

## Tahap 3 — RSVP yang lebih berguna untuk penyelenggara

**Status: SELESAI 31 Okt 2026 (di kode; klik-tayang di peramban tetap
perlu dicek di Coolify setelah push, karena POST server action tidak bisa
dites di sandbox ini — tapi unduh CSV dan filter adalah GET, jadi keduanya
sudah dites lewat curl di server produksi lokal, lihat catatan pengujian
di bawah).**

Yang dibangun:

- Ekspor CSV (`/api/rsvp/[id]/csv`, tombol di detail admin + pengguna):
  hanya admin dan pemilik undangan; tanpa sesi diarahkan ke `/masuk`.
  CSV selalu berisi SEMUA balasan (bukan yang terfilter) dengan urutan
  yang sama seperti dasbor, format RFC 4180 + BOM UTF-8, label kehadiran
  sama seperti dasbor (Hadir / Masih ragu / Tidak bisa hadir).
- Filter daftar RSVP (`?kehadiran=Hadir/Ragu/Tidak`) di detail admin dan
  pengguna, dengan hitungan per status di tombol filter. Ringkasan tetap
  dari daftar penuh — filter tidak mengubah angka ringkasan.
- Sorotan "Tamu yang akan datang" di atas kartu ringkasan kedua halaman
  detail: jumlah tamu dari balasan Hadir saja, dengan penjelasan bahwa
  Ragu belum dihitung dan Tidak tidak dihitung.

Catatan pengujian Tahap 3 (31 Okt 2026): build lolos; builder CSV dites
via tsx (escaping koma/petik/baris baru, BOM, header, jumlah baris);
filter + ringkasan dites via tsx di database uji (jumlah baris CSV =
totalBalasan, jumlah tamu Hadir di CSV = totalTamuHadir); route CSV dites
via curl di server produksi lokal dengan cookie sesi buatan (pemilik
dapat 200 + attachment CSV, orang lain 403, tanpa sesi diarahkan ke
/masuk, admin dapat 200); halaman detail terfilter dites via curl
(?kehadiran=Ragu hanya menampilkan nama Ragu). Yang belum dites di
peramban sungguhan: klik tombol Unduh CSV dan klik tombol filter (GET,
risiko rendah — tapi tetap cek sekali di Coolify setelah push).

Tujuan: dasbor RSVP yang sekarang sudah ada menjadi alasan orang tetap
memakai produk ini sampai hari H, bukan sekadar formulir.

- Ekspor RSVP ke CSV (admin dan pemilik undangan) dengan hitungan yang
  sama dengan yang tampil di dasbor
- Filter daftar RSVP berdasarkan kehadiran (Hadir / Ragu / Tidak) di
  detail undangan admin dan pengguna
- Ringkasan tamu yang lebih jelas di dasbor: total tamu yang akan datang
  (bukan cuma jumlah balasan)
- Kriteria selesai: pemilik undangan bisa mengunduh CSV yang isinya sama
  persis dengan angka di dasbor, dan bisa menemukan semua tamu yang
  "Masih ragu" dalam satu filter

## Tahap 4 — Fondasi produksi yang benar (sebelum scale, sesudah ada pembeli) — SELESAI DI KODE 31 Okt 2026, BELUM di-push; verifikasi Postgres sungguhan + jadwal cadangan otomatis masih tertunda (lihat bawah)

Tujuan: produk tidak rapuh saat dipakai banyak orang. Sengaja diletakkan
sesudah pembayaran supaya monetisasi tidak tertunda oleh pekerjaan
infrastruktur.

Yang dibangun (31 Okt 2026):

- **Dua backend database di `lib/db.ts` (bukan "ganti berkas saja"):**
  SQLite tetap default; Postgres aktif kalau `DATABASE_URL` diawali
  `postgres://`/`postgresql://` (driver `pg`, Pool). Skema dan kueri sama
  di kedua backend; placeholder `?` diterjemahkan ke `$1, $2, ...` dengan
  pemindai literal string yang benar. Konsekuensi yang tidak bisa
  dihindari: semua fungsi lapisan database menjadi ASINKRON (Postgres
  tidak punya API sinkron), jadi seluruh pemanggil dikonversi ke
  await — TypeScript menandai pemanggil yang lupa await sebagai galat,
  dan build lolos bersih setelah konversi. `DATABASE_URL="pg-mem://"`
  memakai emulator Postgres di memori, KHUSUS pengujian, dan ditolak
  di produksi (`NODE_ENV=production`) supaya tidak ada yang tidak
  sengaja mengetes di produksi (penolakan ini terbukti bekerja saat
  server produksi tidak sengaja dijalankan dengan `pg-mem://`).
- **Skrip migrasi `scripts/migrasi-ke-postgres.ts`:** menyalin pengguna,
  templat, paket_harga, undangan, pesanan, langganan, RSVP, dan
  percobaan_rsvp dalam urutan foreign key; menolak jalan kalau target
  sudah berisi data; tabel `sesi` sengaja dilewati (sesi lama hangus,
  pengguna login ulang sekali); hash kata sandi ikut pindah apa adanya;
  jumlah baris sumber vs tujuan diverifikasi per tabel.
- **Foto tahan redeploy (tanpa volume tambahan):** `UNGGAHAN_DIR` di
  image diatur ke `/data/unggahan` — di dalam volume persisten yang
  sudah dipasang untuk database. Jalur publik tetap `/unggahan/<nama>`
  lewat route `/api/unggahan/[nama]` + rewrite beforeFiles, dengan
  fallback ke `public/unggahan` untuk berkas lama. Storage objek tetap
  menjadi langkah final kalau nanti pindah ke serverless murni.
- **Cadangan SQLite + restore yang sudah dibuktikan:** skrip
  `scripts/cadangkan-db.mjs` (VACUUM INTO — boleh jalan saat server
  hidup, verifikasi salinan, retensi default 7) dan
  `scripts/pulihkan-db.mjs` (verifikasi cadangan, tolak kalau ada berkas
  jurnal, salinan pengaman sebelum menimpa). Restore dites: baris palsu
  yang ditambahkan setelah cadangan hilang setelah pulih.
- **Healthcheck:** `GET /api/sehat` (200 kalau aplikasi + database hidup,
  500 kalau tidak, dengan log penyebab di server) + HEALTHCHECK di
  Dockerfile. Di Coolify, pakai path `/api/sehat`.
- **Pengaman spam RSVP:** honeypot (`situs_web` tersembunyi), jeda
  minimum 3 detik dari render halaman, dan batas 20 kiriman per jam per
  IP per undangan (tabel `percobaan_rsvp`, hanya hash IP — garam dari
  `RSVP_IP_SALT`; baris >1 jam terhapus otomatis di setiap pengecekan).
- **Entrypoint:** `scripts/perlu-seed.mjs` kini bercabang SQLite dan
  Postgres (memakai `pg`); untuk `pg-mem://` selalu menjawab "ya".

Catatan pengujian Tahap 4 (31 Okt 2026): build lolos; tes paritas alur
penuh (seed, paket, langganan + kedaluwarsa, RSVP + ringkasan + CSV,
anti-spam, placeholder) LULUS IDENTIK di SQLite dan di emulator
Postgres (pg-mem); skrip migrasi SQLite→pg-mem lolos dengan verifikasi
jumlah baris per tabel; regresi HTTP di server produksi lokal (SQLite):
sehat 200, formulir tamu mengandung honeypot + waktu_muat, /akun/paket
render, webhook settlement → Lunas + langganan Populer aktif, matriks
CSV (pemilik 200, admin 200, bukan pemilik 403); server dev dengan
pg-mem: sehat 200 + beranda 200; perlu-seed tiga cabang lolos.
Yang BELUM terverifikasi (jujur dicatat, bukan diklaim):
(1) server Postgres SUNGGUHAN — di lingkungan ini tidak ada server
Postgres (Docker tidak tersedia; `apt-get update` menggantung >10 menit
lalu dimatikan; registry npm justru bisa dijangkau, jadi pengujian
memakai pg-mem). Sebelum produksi pindah ke Postgres: buat database
Postgres kosong, jalankan skrip migrasi, ganti `DATABASE_URL`, redeploy,
lalu verifikasi login pengguna lama + undangan/RSVP lama + satu
pembelian baru. Sampai itu lolos, SQLite tetap backend produksi yang
didukung. (2) Jadwal cadangan OTOMATIS — skrip + retensi + restore
sudah ada dan dites, tapi cron hariannya belum terpasang di mana pun
(pasang satu cron host/Coolify yang menjalankan skrip di dalam container).
(3) Foto setelah redeploy di Coolify — kodenya sudah siap dan route-nya
dites lokal, tapi redeploy sungguhan belum dijalankan.
Kriteria selesai asli ("deploy di Coolify dengan Postgres...") karena
itu BELUM terpenuhi penuh: Tahap 4 selesai di kode, bukan selesai
di produksi. Tahap 5 boleh jalan tanpa menunggu Postgres, karena
SQLite tetap didukung penuh.

## Tahap 5 — Rilis — SELESAI DI KODE 31 Okt 2026, BELUM di-push; uji beta + checklist peluncuran menunggu tindakan manusia (lihat DAFTAR-PELUNCURAN.md)

Tujuan: produk bisa diumumkan tanpa malu-malu dan tanpa kejutan di hari
pertama pelanggan bayar.

Yang dibangun (31 Okt 2026):

- **Halaman legal dan bantuan (statis, kecuali Bantuan):** `/syarat`
  (Syarat & Ketentuan), `/privasi` (Kebijakan Privasi), `/bantuan`
  (panduan + masalah umum + kontak). Isinya ditulis sesuai perilaku
  produk yang sebenarnya, bukan templat generik: Draft gratis, Aktif
  butuh langganan, langganan baru menggantikan yang lama, pembayaran
  lewat Midtrans tanpa nomor kartu tersimpan, pengembalian dana manual,
  pesan RSVP tampil publik bagi pemegang tautan, cookie hanya sesi
  login 8 jam, hash IP RSVP terhapus setelah 1 jam, tidak ada pelacak
  iklan/analitik. `/bantuan` sengaja `force-dynamic` karena bagian
  Kontaknya membaca environment `DUKUNGAN_EMAIL` /
  `DUKUNGAN_WHATSAPP_URL` saat request — kalau keduanya belum dipasang,
  halaman menampilkan pemberitahuan jujur bahwa kontak belum diumumkan,
  dan itu adalah item BLOKIR di checklist peluncuran.
- **SEO dasar:** metadataBase + Open Graph + Twitter card di layout
  (juga metadata Beranda); metadata per halaman untuk Katalog, Editor,
  Masuk, Daftar, Syarat, Privasi, Bantuan; `app/sitemap.ts` (hanya
  halaman publik yang layak diindeks) dan `app/robots.ts` (larang
  /admin, /akun, /api, /u — undangan tamu bersifat pribadi); Open Graph
  dinamis untuk halaman tamu lewat `generateMetadata` (judul nama +
  jenis acara, deskripsi tanggal/lokasi + ajakan RSVP hanya kalau
  status Aktif, foto undangan/sampul kalau ada — SENGAJA tanpa foto
  picsum cadangan supaya pratinjau tidak menampilkan foto stok acak).
  Alamat situs dari `SITUS_URL` (fallback domain produksi saat ini).
- **Perbaikan salinan basi (kejujuran peluncuran):** footer tidak lagi
  mengklaim "belum ada pembayaran sungguhan" (salah sejak Tahap 2) dan
  kini menautkan Syarat/Privasi/Bantuan; dua jawaban FAQ landing yang
  sudah salah diperbaiki (edit data undangan: belum bisa, hapus dan
  buat ulang; biaya tersembunyi: tidak ada, pembayaran lewat Midtrans).
- **Checklist peluncuran (`DAFTAR-PELUNCURAN.md`):** gerbang pengumuman
  dengan item BLOKIR yang jelas — Midtrans Production + satu uji beli
  sungguhan, kontak dukungan, cron cadangan + uji pulih di salinan,
  healthcheck Coolify, harga final, akun admin cadangan, uji beta 3–5
  pengguna nyata (tugas langkah demi langkah dari HP, termasuk beli
  Hemat Rp 49.000 dengan tawaran ganti rugi manual), smoke test akhir,
  dan kriteria selesai. Yang sengaja TIDAK memblokir: pindah Postgres
  dan fitur setelah rilis.

Catatan pengujian Tahap 5 (31 Okt 2026): build lolos (/bantuan
dinamis, /syarat + /privasi statis, /sitemap.xml + /robots.txt ada);
server produksi lokal: /syarat + /privasi + /bantuan 200 dengan isi
yang benar (Midtrans, scrypt, pemberitahuan kontak belum diumumkan
saat env kosong); sitemap berisi halaman legal tanpa /u dan /admin;
robots melarang /admin, /akun, /api, /u; OG tamu Aktif berjudul nama +
jenis acara dengan deskripsi ajakan RSVP dan TANPA og:image picsum
saat tidak ada foto; OG tamu Selesai memakai deskripsi "Lihat detail"
(bukan ajakan RSVP); tamu Draft 404 tanpa nama bocor di og:title;
footer menautkan Syarat/Privasi/Bantuan dan tidak ada lagi klaim basi
di beranda; judul metadata per halaman (Katalog, Editor, Masuk,
Daftar) benar; /bantuan dengan DUKUNGAN_EMAIL menampilkan mailto dan
pemberitahuan "belum diumumkan" hilang. Yang BELUM terverifikasi dan
TIDAK BOLEH diklaim selesai: uji beta (butuh manusia), checklist
peluncuran (butuh tindakan manusia di Coolify/Midtrans), dan kriteria
selesai (satu pelanggan bukan penguji internal membeli + RSVP masuk).
Tahap 5 selesai di kode, bukan selesai di pasar.

## Setelah rilis (sengaja bukan bagian dari "selesai")

Amplop digital, musik latar, galeri multi-foto, domain kustom per
undangan, analitik lanjutan, dan tema template baru. Semua itu bagus,
tapi tidak boleh menunda rilis berbayar pertama.

## Urutan yang direkomendasikan

Tahap 1 → Tahap 2 → Tahap 3 → Tahap 4 → Tahap 5.
Alasannya: Tahap 1 membuat produk utuh, Tahap 2 membuat produk
menghasilkan uang, Tahap 3 membuat produk dipertahankan sampai hari H,
Tahap 4 membuat produk tahan scale, Tahap 5 memastikan rilisnya bersih.
Membalik Tahap 4 ke depan hanya akan menunda uang masuk tanpa menambah
satu pun pelanggan.

## Dasbor admin langganan & pendapatan (31 Okt 2026, di luar Tahap 1–5)

Desain dasbor admin (mockup) digabung ke proyek sebagai `/admin` baru
dengan data asli, bukan angka contoh: `lib/dasborAdmin.ts` (MRR,
langganan aktif, pengguna, churn 30 hari, pendapatan lunas 12 bulan,
sebaran paket, aktivitas, pencarian global, CSV aktivitas),
`komponen/ShellAdmin.tsx` (sidebar + drawer ponsel + topbar cari +
lencana Menunggu/Gagal + profil), halaman baru `/admin/langganan`,
`/admin/pengguna`, `/admin/cari`, `/admin/rsvp` (isi RSVP Ringkasan
lama pindah ke sini), dan route `/api/admin/aktivitas/csv` (admin
saja). Definisi metrik ditulis di header `lib/dasborAdmin.ts` dan di
halaman Ringkasan. Tes: tsc + build lolos; asersi tsx di DB uji lolos
(MRR 313.833, churn 25%, pendapatan per bulan, sebaran paket,
aktivitas + filter + CSV + pencarian); matriks curl server produksi
lolos (semua halaman admin 200 dengan sesi admin, 307 ke
`/admin/login` tanpa sesi/bukan admin, CSV 200 admin / 403 bukan
admin). Satu temuan tes yang BUKAN bug: `formatRupiah` memakai spasi
non-breaking (bawaan Intl id-ID), jadi grep harfiah "Rp 313.833"
gagal padahal nilainya tampil benar. Belum di-push (menunggu perintah
push); belum dites klik-tayang di peramban (keterbatasan sandbox yang
sudah diketahui: server action POST gagal "Connection closed", tapi
halaman baru ini hanya memakai GET + tautan, jadi tidak kena batas
itu).

## Perbaikan mobile frontend (31 Okt 2026, BELUM di-push)

Audit menemukan frontend sebenarnya sudah responsif di sebagian besar
halaman (grid runtuh, formulir 48px, halaman tamu max-w-md), tapi ada
satu bug overflow nyata di navigasi ponsel: baris tautan mobile tanpa
flex-wrap dan pil navigasi yang terlalu lebar di layar ~320px.
Perbaikan: brand mengecil + truncate + tombol "Buat Undangan" lebih
ramping di ponsel, baris tautan mobile membungkus, salinan editor
menjadi netral posisi ("isi datanya, lihat hasilnya di pratinjau" —
dulu "di kiri/di kanan" padahal di ponsel pratinjau ada di bawah),
tombol pilih templat lebih kecil di ponsel, email panjang di /akun
memakai break-words, dan `overflow-x: clip` di body sebagai pengaman
(tidak merusak sticky, tidak seperti hidden). Yang dicek dan ternyata
BUKAN bug: meta viewport sudah benar (bawaan Next), semua blob cahaya
sudah di dalam parent overflow-hidden, dan tautan min-h yang tampak
inline ternyata flex item sehingga min-height-nya berlaku. Tes: tsc +
build lolos, semua halaman publik 200, penanda HTML baru terverifikasi
di server produksi lokal (DB uji). Klik-tayang visual di ponsel
sungguhan belum dites (keterbatasan sandbox) — cek sekali di HP
setelah redeploy.
