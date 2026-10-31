# Halaman Tamu — Revisi Desain & Implementasi

Halaman yang dibuka penerima undangan lewat tautan `/u/[kode]`, tanpa
login. Revisi ini (31 Okt 2026) berangkat dari undangan Zamrud live
`/u/nvjvq95c`: struktur undangannya sudah lengkap, tapi tindakan utama
(RSVP) terkubur, chrome platform mengganggu, dan tidak ada status muat /
tidak ditemukan / galat yang ramah.

## Prinsip

- **Tindakan utama selalu terlihat.** Tamu tidak boleh menggulir 8 seksi
  untuk menemukan RSVP.
- **Halaman tamu bukan etalase produk.** Tidak ada navigasi platform,
  drawer situs, atau footer pemasaran di `/u/*`.
- **Jujur soal status.** Draft / hilang / gagal muat punya pesannya
  sendiri; tidak ada klaim privasi (pesan RSVP terlihat oleh pemegang
  tautan, sesuai perilaku nyata produk).
- **Konvensi proyek dipertahankan.** App Router, Tailwind dengan palet
  hangat yang sama (krem, emas, tanah, daun, terakota, tinta — tanpa
  gradasi ungu-biru), komentar dan teks Indonesia, tanpa dependensi baru.

## Komponen & berkas

| Berkas | Peran |
|---|---|
| `app/u/[kode]/page.tsx` | Rute tamu (server). Memilih perender: Zamrud halaman penuh atau kartu lama. Draft / tidak ada / templat hilang → `notFound()`. Selesai (termasuk kedaluwarsa malas) → tampil, formulir tutup. |
| `app/u/[kode]/loading.tsx` | Kerangka muat bergaya sampul Zamrud + teks "Memuat undangan…" (`role="status"`). |
| `app/u/[kode]/not-found.tsx` | 404 ramah: "Tautan ini belum bisa dibuka" + penyebab yang mungkin + tautan Beranda & Bantuan. Tidak membocorkan data undangan. |
| `app/u/[kode]/error.tsx` | Galat muat (komponen klien): pesan ramah + tombol "Coba lagi" (`reset()`) + Beranda. Tanpa detail teknis. |
| `komponen/UndanganZamrud.tsx` | Perender halaman penuh. Props: `data: DataZamrud` (lihat tipe di berkas itu: nama, tanggal, lokasi, statusAktif, ringkasan, ucapan, kolom v2, galeriTambahan, musikSrc, tautan, kodeTamu, waktuMuat). |
| `komponen/BarKonfirmasi.tsx` | Bar CTA persisten. Props: `tampil: boolean`, `href?: string` (bawaan `"#rsvp"`). Murni presentasi: tanpa hook dan tanpa impor `next/*`, jadi bisa dipakai server, klien, dan pengujian render. |
| `komponen/Navigasi.tsx`, `komponen/KakiHalaman.tsx` | Mengembalikan `null` di rute `/u/*` (dibaca lewat `usePathname`). Halaman lain tidak berubah. KakiHalaman dijadikan komponen klien hanya untuk membaca rute. |
| `komponen/PratinjauUndangan.tsx`, `komponen/FormulirRsvp.tsx` | Jalur kartu lama; tidak diubah kecuali salinan penutup di `page.tsx`. |
| `tests/halaman-tamu.tsx` | Pengujian (lihat bawah). |

## Perubahan desain (dengan alasan)

- **Bar konfirmasi persisten** (`BarKonfirmasi`, bawah layar, emas,
  `min-h-[52px]`): tindakan utama tidak lagi terkubur. Hanya saat RSVP
  dibuka; di Zamrud, sampul (z-70) menutupi bar (z-40) secara visual
  sampai sampul di-unmount, jadi bar baru terlihat setelah undangan
  terbuka tanpa logika tahap. Konten diberi `pb-28` saat bar tampil
  supaya penutup tidak tertutup.
- **Tombol emas di hero + entri emas di drawer menu**: tiga jalan menuju
  tindakan yang sama (bar, hero, menu). Hero juga kini menampilkan
  **lokasi** di bawah tanggal — sebelumnya tamu baru tahu tempat acara
  di seksi Acara.
- **Kontrol sekunder pindah ke kanan atas** (musik, menu): bawah layar
  sudah dipakai bar konfirmasi; header platform sudah hilang di halaman
  tamu sehingga pojok kanan atas bebas.
- **Jangkar lebih rapat** (`scroll-mt-6`, dulu `scroll-mt-28`): offset
  besar itu kompensasi header lengket yang kini tidak ada di halaman tamu.
- **Hitung mundur ramah pembaca layar**: angka berdetak dibungkus
  `aria-hidden`, ditambah ringkasan statis `sr-only` ("Hitung mundur
  menuju …"). Tanpa ini, pembaca layar membacakan angka tiap detik.
- **Formulir**: input nama memakai `autoComplete="name"` (autofill HP);
  select jumlah tamu terhubung ke keterangan lewat `aria-describedby`.
- **Judul seksi RSVP**: "Konfirmasi Kehadiran" (dulu "RSVP" sebagai judul
  dan "Konfirmasi Kehadiran" sebagai label kecil — terbalik).
- **Salinan penutup netral**: "Konfirmasi kehadiran … sudah ditutup.
  Terima kasih atas doa dan perhatiannya." Alasan: status Selesai juga
  bisa berasal dari langganan kedaluwarsa, bukan hanya acara lewat — jadi
  kalimat lama ("karena acaranya sudah selesai") bisa salah.
- **Kontras (WCAG AA)**: tidak ada warna baru. Kombinasi yang dipakai
  lolos AA: tinta `#2B1A12` dan tintaLembut `#5C4638` di atas krem
  `#FFFBF3`; krem di atas hijau zamrud gelap; emas `#E3B95A` di atas
  hijau zamrud gelap. Target ketuk minimal 48px dipertahankan (tombol
  utama 52px).

## Status & perilaku

| Keadaan | Yang tampil |
|---|---|
| Aktif | Undangan penuh + formulir RSVP + bar konfirmasi + tombol hero + entri menu emas. |
| Selesai / kedaluwarsa | Undangan penuh, formulir diganti salinan penutup, tanpa bar dan tanpa tombol hero konfirmasi. |
| Draft / kode tidak ada / templat hilang | `not-found.tsx` (pesan ramah). Metadata generik, tanpa bocor nama. Catatan: dengan `loading.tsx`, Next.js mengirim shell sebagai 200 sebelum `notFound()` terlempar, jadi halaman ini berstatus 200 (soft-404) — terbukti lewat eksperimen (tanpa `loading.tsx`, statusnya 404). Dipertahankan karena state loading diminta eksplisit, tamu melihat halaman yang sama, dan `/u/*` dilarang robots sehingga tidak ada dampak SEO. |
| Gagal muat (mis. DB tidak terjangkau) | `error.tsx` + "Coba lagi". |
| Memuat | `loading.tsx` (kerangka sampul + teks status). |

Catatan perilaku yang dipertahankan: anti-spam RSVP (honeypot, jeda
minimum, batas per jam) tidak diubah; musik hanya dirender kalau berkas
`public/musik/zamrud.mp3` ada; foto galeri memakai `<img>` biasa (bukan
`next/image`) sesuai kode yang ada.

## Pengujian

```
npm run build        # wajib dulu: pengujian HTTP memakai build yang ada
npm run uji:tamu     # tsx tests/halaman-tamu.tsx
```

Isi pengujian:

- **Bagian A (renderToString, tanpa server):** `BarKonfirmasi` sembunyi
  saat `tampil=false`; tampil sebagai tombol "Konfirmasi Kehadiran"
  dengan href benar, posisi bawah layar, dan tinggi 52px saat
  `tampil=true`.
- **Bagian B (HTTP, server fixture):** skrip membuat database uji
  (`dasbor-uji/tamu.db`), menjalankan `next start` di port 3101,
  menyisipkan 2 templat + 4 undangan (Zamrud Aktif / Selesai / Draft,
  kartu lama Aktif), lalu memeriksa status dan penanda tiap keadaan:
  data tampil, formulir tampil/tidak, bar tampil/tidak, salinan penutup,
  pesan ramah untuk tautan tidak ditemukan (plus tidak bocornya data),
  dan tidak adanya chrome platform di halaman tamu.

Yang **tidak** diuji di sini: perilaku ketuk (buka/tutup menu, jeda
musik, lightbox, kirim RSVP sungguhan). Proyek tidak memakai DOM runner;
perilaku itu diverifikasi lewat pemeriksaan browser pasca-deploy, seperti
praktik pengujian proyek selama ini. Pengiriman RSVP sungguhan hanya bisa
diverifikasi di produksi karena aksi server gagal total di sandbox.
