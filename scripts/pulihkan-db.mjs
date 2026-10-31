// Pulihkan database SQLite dari cadangan (Tahap 4). JS polos, tanpa tsx.
//   node scripts/pulihkan-db.mjs <file-cadangan>
// PENTING: hentikan dulu server/aplikasi sebelum menjalankan skrip ini.
// Skrip menolak jalan kalau ada berkas jurnal (db-journal) di samping
// database aktif — itu tandanya server masih jalan atau mati tidak
// bersih. Alurnya: verifikasi cadangan (bisa dibuka + berisi tabel inti),
// simpan salinan pengaman database aktif saat ini, lalu timpa dengan
// cadangan. Setelah itu nyalakan lagi servernya. Salinan pengaman TIDAK
// dihapus otomatis — hapus manual kalau restore sudah terbukti benar.

import { DatabaseSync } from "node:sqlite";
import { copyFileSync, existsSync, statSync } from "fs";
import path from "path";

const cadangan = process.argv[2];
if (!cadangan || !existsSync(cadangan)) {
  console.error("Pemakaian: node scripts/pulihkan-db.mjs <file-cadangan>");
  process.exit(1);
}
const url = process.env.DATABASE_URL ?? "file:./dev.db";
if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
  console.error("DATABASE_URL menunjuk Postgres. Skrip ini khusus SQLite.");
  process.exit(1);
}
const mentah = url.startsWith("file:") ? url.slice("file:".length) : url;
const dbPath = path.isAbsolute(mentah) ? mentah : path.join(process.cwd(), mentah);

// 1. Verifikasi cadangan.
const periksa = new DatabaseSync(cadangan, { readOnly: true });
try {
  const tabel = periksa.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((b) => b.name);
  for (const wajib of ["pengguna", "templat", "undangan", "paket_harga"]) {
    if (!tabel.includes(wajib)) throw new Error(`cadangan tidak berisi tabel ${wajib}`);
  }
  console.log(`Cadangan terverifikasi: ${cadangan} (${statSync(cadangan).size} byte, tabel: ${tabel.join(", ")})`);
} finally {
  periksa.close();
}

// 2. Tolak kalau server kemungkinan masih jalan.
if (existsSync(`${dbPath}-journal`) || existsSync(`${dbPath}-wal`)) {
  console.error("Berkas jurnal database aktif ditemukan — hentikan dulu servernya, lalu ulangi.");
  process.exit(1);
}

// 3. Salinan pengaman + timpa.
const stempel = new Date().toISOString().replace(/[:.]/g, "-");
const pengaman = `${dbPath}.sebelum-pulih-${stempel}`;
if (existsSync(dbPath)) {
  copyFileSync(dbPath, pengaman);
  console.log(`Salinan pengaman database aktif: ${pengaman}`);
}
copyFileSync(cadangan, dbPath);
console.log(`Database dipulihkan dari ${cadangan}. Nyalakan lagi servernya dan periksa situsnya.`);
console.log(`Kalau restore sudah benar, hapus manual salinan pengaman di atas.`);
