// Cadangan database SQLite (Tahap 4). JS polos, tanpa tsx, supaya bisa
// jalan dari cron container maupun terminal Coolify.
//   node scripts/cadangkan-db.mjs [folder-cadangan]
// Cara kerja: VACUUM INTO membuat salinan yang konsisten BAHKAN saat
// server sedang jalan (tidak perlu menghentikan aplikasi), lalu skrip
// memeriksa salinannya dan menghapus cadangan lama di luar retensi.
// Default folder: CADANGAN_DIR, atau /data/cadangan kalau database di
// /data (Coolify), atau ./cadangan untuk lokal. Retensi default 7
// (CADANGAN_RETENSI). Skrip ini KHUSUS SQLite — kalau DATABASE_URL
// menunjuk Postgres, skrip berhenti dan mengarahkan ke pg_dump.

import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from "fs";
import path from "path";

function jalurDatabase() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    console.error("DATABASE_URL menunjuk Postgres. Skrip ini khusus SQLite — pakai pg_dump untuk Postgres.");
    process.exit(1);
  }
  const mentah = url.startsWith("file:") ? url.slice("file:".length) : url;
  return path.isAbsolute(mentah) ? mentah : path.join(process.cwd(), mentah);
}

function folderDefault(dbPath) {
  if (process.env.CADANGAN_DIR) return process.env.CADANGAN_DIR;
  if (dbPath.startsWith("/data/")) return "/data/cadangan";
  return path.join(process.cwd(), "cadangan");
}

function stempel() {
  const kini = new Date();
  const dua = (n) => String(n).padStart(2, "0");
  return `${kini.getFullYear()}${dua(kini.getMonth() + 1)}${dua(kini.getDate())}-${dua(kini.getHours())}${dua(kini.getMinutes())}${dua(kini.getSeconds())}`;
}

const dbPath = jalurDatabase();
if (!existsSync(dbPath)) {
  console.error(`Database tidak ditemukan: ${dbPath}`);
  process.exit(1);
}
const folder = process.argv[2] ?? folderDefault(dbPath);
mkdirSync(folder, { recursive: true });
const tujuan = path.join(folder, `cadangan-${stempel()}.db`);

// VACUUM INTO butuh literal string SQL — petik tunggal digandakan.
const db = new DatabaseSync(dbPath, { readOnly: true });
try {
  db.exec(`VACUUM INTO '${tujuan.replace(/'/g, "''")}'`);
} finally {
  db.close();
}
// Verifikasi: salinan bisa dibuka dan berisi tabel yang diharapkan.
const periksa = new DatabaseSync(tujuan, { readOnly: true });
try {
  const tabel = periksa.prepare("SELECT COUNT(*) AS j FROM sqlite_master WHERE type = 'table'").get();
  if (Number(tabel.j) < 5) throw new Error("salinan tidak berisi tabel yang diharapkan");
} finally {
  periksa.close();
}
const ukuran = statSync(tujuan).size;
console.log(`Cadangan dibuat: ${tujuan} (${ukuran} byte)`);

// Retensi: hanya N terbaru yang dipertahankan.
const retensi = Number(process.env.CADANGAN_RETENSI ?? 7) || 7;
const daftar = readdirSync(folder)
  .filter((nama) => nama.startsWith("cadangan-") && nama.endsWith(".db"))
  .sort()
  .reverse();
for (const nama of daftar.slice(retensi)) {
  rmSync(path.join(folder, nama));
  console.log(`Cadangan lama dihapus: ${nama}`);
}
console.log(`Selesai. ${Math.min(daftar.length, retensi)} cadangan dipertahankan.`);
