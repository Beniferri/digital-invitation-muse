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
- Belum ada pembayaran sungguhan — paket harga baru pajangan
- Belum ada batas paket yang ditegakkan (jumlah undangan aktif, masa aktif)
- Database masih SQLite berkas lokal + foto sampul di dalam container
  (butuh volume terpisah supaya tidak hilang saat redeploy)
- Belum ada halaman syarat/ketentuan, privasi, dan bantuan

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

## Tahap 4 — Fondasi produksi yang benar (sebelum scale, sesudah ada pembeli)

Tujuan: produk tidak rapuh saat dipakai banyak orang. Sengaja diletakkan
sesudah pembayaran supaya monetisasi tidak tertunda oleh pekerjaan
infrastruktur.

- Migrasi SQLite → Postgres yang di-hosting (mis. layanan Postgres di
  Coolify atau Supabase) dengan mengganti lapisan `lib/db.ts` saja;
  skrip migrasi memindahkan template, undangan, RSVP, dan pengguna yang
  sudah ada (hash kata sandi bisa ikut pindah; sesi lama hangus dan
  pengguna login ulang sekali)
- Penyimpanan foto sampul yang tahan redeploy (volume khusus untuk
  `public/unggahan/` sebagai langkah cepat, atau storage objek sebagai
  langkah final)
- Cadangan otomatis database (dump berkala + cara restore yang sudah
  pernah dites sekali) dan healthcheck Coolify
- Pengaman RSVP dasar: batas kirim per undangan per jam untuk menahan spam
- Kriteria selesai: deploy di Coolify dengan Postgres, data lama terbawa,
  foto sampul tidak hilang setelah redeploy, dan restore dari cadangan
  pernah dibuktikan sekali

## Tahap 5 — Rilis

Tujuan: produk bisa diumumkan tanpa malu-malu dan tanpa kejutan di hari
pertama pelanggan bayar.

- Halaman syarat & ketentuan, kebijakan privasi, dan bantuan/kontak
- SEO dasar: metadata tiap halaman utama, sitemap, dan pratinjau tautan
  (Open Graph) untuk halaman tamu
- Uji beta dengan 3–5 pengguna nyata (keluarga/teman): mereka membuat
  undangan sungguhan, membagikan, dan RSVP dari HP; semua temuan
  diperbaiki sebelum pengumuman
- Checklist peluncuran: Midtrans produksi, cadangan jalan, monitoring
  Coolify aktif, harga final, dan akun admin cadangan
- Kriteria selesai: satu pelanggan yang bukan penguji internal berhasil
  membeli paket dan membagikan undangan yang RSVP-nya masuk

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
