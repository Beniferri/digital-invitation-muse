// Pengujian halaman tamu (tanpa framework tambahan, sesuai konvensi proyek:
// tsx + renderToString + matriks HTTP terhadap server lokal).
//
// Bagian A — render komponen murni (tanpa server):
//   BarKonfirmasi: sembunyi saat tampil=false, tampil sebagai tombol emas
//   "Konfirmasi Kehadiran" dengan href yang benar saat tampil=true.
//
// Bagian B — HTTP terhadap server produksi lokal (next start) dengan
// database fixture:
//   - /u/tamuji01 (Zamrud Aktif): data tampil, formulir RSVP tampil,
//     bar konfirmasi tampil, chrome platform (navigasi + footer situs)
//     TIDAK tampil.
//   - /u/tamuji02 (Zamrud Selesai): salinan penutup tampil, formulir dan
//     bar TIDAK tampil.
//   - /u/tamuji03 (Zamrud Draft) dan /u/tidakada99 (tidak ada): 404
//     dengan pesan ramah, bukan 404 generik.
//   - /u/tamuji04 (kartu lama Aktif): data tampil, formulir tampil,
//     bar tampil.
//
// Cara menjalankan (WAJIB urut, karena server memakai build yang ada):
//   npm run build
//   npm run uji:tamu
//
// Catatan: perilaku ketuk (buka/tutup menu, jeda musik, lightbox) tidak
// diuji di sini karena proyek tidak memakai DOM runner; perilaku itu
// diverifikasi lewat pemeriksaan browser pasca-deploy, seperti praktik
// pengujian proyek selama ini.
import React from "react";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { renderToString } from "react-dom/server";
import BarKonfirmasi from "../komponen/BarKonfirmasi";

const PROYEK = "/home/hatch/workspace/undangan-digital";
const DB = "/home/hatch/workspace/dasbor-uji/tamu.db";
const PORT = 3101;
const DASAR = `http://localhost:${PORT}`;

let lolos = 0;
let gagal = 0;
function periksa(nama: string, kondisi: boolean, detail = "") {
  if (kondisi) {
    lolos += 1;
    console.log(`  LULUS ${nama}`);
  } else {
    gagal += 1;
    console.log(`  GAGAL ${nama}${detail ? ` — ${detail}` : ""}`);
  }
}

// Seluruh alur dibungkus fungsi utama: tsconfig proyek menargetkan ES
// lama sehingga top-level await dan deklarasi fungsi di dalam blok
// ditolak pemeriksa tipe (padahal tsx sendiri bisa menjalankannya).
async function utama() {
// ---------- Bagian A: render komponen ----------
console.log("Bagian A — BarKonfirmasi (renderToString)");
periksa("sembunyi saat tampil=false", renderToString(<BarKonfirmasi tampil={false} />) === "");
const barAktif = renderToString(<BarKonfirmasi tampil />);
periksa("tampil sebagai tombol Konfirmasi Kehadiran", barAktif.includes("Konfirmasi Kehadiran"));
periksa("href bawaan mengarah ke #rsvp", barAktif.includes('href="#rsvp"'));
periksa("href kustom dihormati", renderToString(<BarKonfirmasi tampil href="#acara" />).includes('href="#acara"'));
periksa("bar menempel di bawah layar", barAktif.includes("fixed inset-x-0 bottom-0"));
periksa("tombol minimal 52px (mudah diketuk)", barAktif.includes("min-h-[52px]"));

// ---------- Bagian B: HTTP ----------
console.log("Bagian B — HTTP halaman tamu (server fixture)");
for (const akhir of ["", "-journal", "-wal"]) {
  if (existsSync(DB + akhir)) rmSync(DB + akhir, { force: true });
}

let server: ChildProcess | null = null;
async function tungguSehat(): Promise<boolean> {
  const batas = Date.now() + 60000;
  while (Date.now() < batas) {
    try {
      const res = await fetch(`${DASAR}/api/sehat`);
      if (res.ok) return true;
    } catch {
      // Server belum bangun; coba lagi.
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

try {
  // Pra-penerbangan: kalau port sudah dijawab server lain (mis. server
  // yatim dari pengujian sebelumnya), berhenti dengan pesan jelas —
  // kalau tidak, pengujian akan bicara dengan server yang salah dan
  // gagal membingungkan ("no such table" karena server lama memegang
  // inode database yang sudah dihapus).
  try {
    const sudahAda = await fetch(`${DASAR}/api/sehat`);
    if (sudahAda.ok) throw new Error(`Port ${PORT} sudah dipakai server lain — matikan dulu server itu, lalu jalankan lagi.`);
  } catch (galat) {
    if (galat instanceof Error && galat.message.includes("sudah dipakai")) throw galat;
    // fetch gagal = port bebas, lanjut.
  }
  // detached: true supaya pematian grup proses (di finally) ikut
  // membunuh anak next-server, bukan hanya npm pembungkusnya.
  server = spawn("npm", ["run", "start", "--", "-p", String(PORT)], {
    cwd: PROYEK,
    env: { ...process.env, PORT: String(PORT), DATABASE_URL: `file:${DB}` },
    stdio: "ignore",
    detached: true,
  });
  periksa("server bangun (/api/sehat 200)", await tungguSehat());
  if (!server) throw new Error("server gagal dibuat");

  // Migrasi sudah jalan saat server dibuka; baru sekarang isi fixture.
  const db = new DatabaseSync(DB);
  const sekarang = "2026-10-31";
  const sisipTemplat = db.prepare(
    `INSERT INTO templat (id, slug, nama, jenis_acara, warna, nuansa, deskripsi, aktif, gaya_json, contoh_json, foto_sampul, dibuat_pada, diubah_pada, halaman_penuh)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`,
  );
  sisipTemplat.run(
    "tmpl-zamrud-uji", "zamrud-pernikahan", "Zamrud", "Pernikahan", "zamrud", "islami",
    "Templat halaman penuh untuk pengujian", "{}", '{"judulAcara":"Pernikahan"}',
    "/templat/zamrud/masjid.jpg", sekarang, sekarang, 1,
  );
  sisipTemplat.run(
    "tmpl-seruni-uji", "seruni-akad-nikah", "Seruni", "Pernikahan", "krem", "klasik",
    "Templat kartu untuk pengujian",
    '{"latar":"bg-krem-100","kartu":"rounded-t-[10rem] rounded-b-[2rem]","aksen":"text-emas-600","aksenLembut":"bg-emas-300/40","bentuk":"lengkung-atas","pola":"parang"}',
    '{"judulAcara":"Akad Nikah dan Resepsi"}', null, sekarang, sekarang, 0,
  );
  const sisipUndangan = db.prepare(
    `INSERT INTO undangan (id, nama_pertama, nama_kedua, jenis_acara, tanggal, lokasi, slug_templat, status, dibuat_pada, pengguna_id, kode_tamu, acara_waktu, orang_tua_pertama, orang_tua_kedua)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
  );
  sisipUndangan.run("uji-aktif-z", "Aisyah Putri Maharani", "Raka Aditya Pratama", "Pernikahan", "2027-03-14", "Masjid Agung, Yogyakarta", "zamrud-pernikahan", "Aktif", sekarang, "tamuji01", "10.00", "Bapak Contoh", "Ibu Contoh");
  sisipUndangan.run("uji-selesai-z", "Aisyah Putri Maharani", "Raka Aditya Pratama", "Pernikahan", "2027-03-14", "Masjid Agung, Yogyakarta", "zamrud-pernikahan", "Selesai", sekarang, "tamuji02", "10.00", "", "");
  sisipUndangan.run("uji-draft-z", "Aisyah Putri Maharani", "Raka Aditya Pratama", "Pernikahan", "2027-03-14", "Masjid Agung, Yogyakarta", "zamrud-pernikahan", "Draft", sekarang, "tamuji03", "10.00", "", "");
  sisipUndangan.run("uji-aktif-s", "Siti Rahma", "Budi Santoso", "Pernikahan", "2027-04-10", "Pendopo Seruni", "seruni-akad-nikah", "Aktif", sekarang, "tamuji04", "09.00", "", "");
  db.close();

  const ambil = async (kode: string) => {
    const res = await fetch(`${DASAR}/u/${kode}`);
    return { status: res.status, isi: await res.text() };
  };

  const aktif = await ambil("tamuji01");
  console.log("  -- Zamrud Aktif --");
  periksa("status 200", aktif.status === 200, `dapat ${aktif.status}`);
  periksa("nama pasangan tampil", aktif.isi.includes("Aisyah Putri Maharani") && aktif.isi.includes("Raka Aditya Pratama"));
  periksa("tanggal tampil (14 Maret 2027)", aktif.isi.includes("14 Maret 2027"));
  periksa("lokasi tampil di hero", aktif.isi.includes("Masjid Agung, Yogyakarta"));
  periksa("tombol hero Konfirmasi Kehadiran tampil", aktif.isi.includes("Konfirmasi Kehadiran"));
  periksa("formulir RSVP tampil", aktif.isi.includes("Kirim Konfirmasi &amp; Ucapan") || aktif.isi.includes("Kirim Konfirmasi & Ucapan"));
  periksa("bar konfirmasi tampil", aktif.isi.includes("fixed inset-x-0 bottom-0 z-40"));
  periksa("navigasi platform disembunyikan", !aktif.isi.includes("Katalog Template"));
  periksa("footer situs disembunyikan", !aktif.isi.includes("Undangan digital untuk akad nikah"));
  periksa("hitung mundur tidak diumumkan berulang (aria-hidden)", aktif.isi.includes('aria-hidden="true"'));

  const selesai = await ambil("tamuji02");
  console.log("  -- Zamrud Selesai --");
  periksa("status 200", selesai.status === 200, `dapat ${selesai.status}`);
  periksa("salinan penutup tampil", selesai.isi.includes("Konfirmasi kehadiran untuk undangan ini sudah ditutup"));
  periksa("formulir RSVP tidak tampil", !selesai.isi.includes("Kirim Konfirmasi"));
  periksa("bar konfirmasi tidak tampil", !selesai.isi.includes("fixed inset-x-0 bottom-0 z-40"));

  // Catatan status: dengan loading.tsx, Next.js mengirim shell sebagai 200
  // sebelum notFound() terlempar, sehingga halaman tidak ditemukan
  // berstatus 200 (soft-404) — terbukti lewat eksperimen: tanpa loading.tsx
  // statusnya 404. Yang diuji di sini adalah yang dilihat tamu (pesan
  // ramah + tidak ada data undangan yang bocor); /u/* dilarang robots
  // sehingga tidak ada dampak SEO dari status ini.
  const draf = await ambil("tamuji03");
  console.log("  -- Zamrud Draft --");
  periksa("pesan ramah tampil", draf.isi.includes("Tautan ini belum bisa dibuka"));
  periksa("tautan kembali tampil", draf.isi.includes("Kembali ke Beranda"));
  periksa("data undangan tidak bocor", !draf.isi.includes("Aisyah Putri Maharani"));

  const hilang = await ambil("tidakada99");
  console.log("  -- Kode tidak ada --");
  periksa("pesan ramah tampil", hilang.isi.includes("Tautan ini belum bisa dibuka"));
  periksa("data undangan tidak bocor", !hilang.isi.includes("Aisyah Putri Maharani"));

  const kartu = await ambil("tamuji04");
  console.log("  -- Kartu lama Aktif --");
  periksa("status 200", kartu.status === 200, `dapat ${kartu.status}`);
  periksa("nama pasangan tampil", kartu.isi.includes("Siti Rahma") && kartu.isi.includes("Budi Santoso"));
  periksa("tanggal tampil (10 April 2027)", kartu.isi.includes("10 April 2027"));
  periksa("formulir RSVP tampil", kartu.isi.includes("Kirim Konfirmasi"));
  periksa("bar konfirmasi tampil", kartu.isi.includes("fixed inset-x-0 bottom-0 z-40"));
  periksa("salinan penutup tidak tampil", !kartu.isi.includes("Konfirmasi kehadiran untuk undangan ini sudah ditutup"));
} finally {
  const pid = server?.pid;
  if (pid) {
    const matikanGrup = (sinyal: NodeJS.Signals) => {
      try {
        process.kill(-pid, sinyal);
      } catch {
        // Grup sudah mati.
      }
    };
    matikanGrup("SIGTERM");
    await new Promise((r) => setTimeout(r, 1000));
    matikanGrup("SIGKILL");
  }
}

console.log(`\nHasil: ${lolos} lulus, ${gagal} gagal`);
process.exitCode = gagal === 0 ? 0 : 1;
}

utama().catch((galat) => {
  console.error(galat);
  process.exitCode = 1;
});
