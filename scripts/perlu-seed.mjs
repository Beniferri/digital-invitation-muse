// Pemeriksa kecil untuk entrypoint Docker: apakah database perlu di-seed?
// Mencetak "ya" kalau tabel templat belum ada atau jumlah template nol;
// selain itu mencetak "tidak".
// Mendukung dua backend (Tahap 4): SQLite (node:sqlite, tanpa dependensi
// tambahan) dan Postgres (paket `pg`, sudah termasuk di node_modules
// image karena menjadi dependensi produksi). Untuk "pg-mem://" (hanya
// pengujian) selalu mencetak "ya" — database memori tidak bertahan antar
// proses, jadi entrypoint Docker tidak relevan untuknya.
// Kegagalan apa pun dianggap "ya", karena skrip seed sendiri yang akan
// membuat tabelnya lewat lib/db.ts kalau memang belum ada.

import path from "node:path";

const url = process.env.DATABASE_URL || "file:./dev.db";

if (url === "pg-mem://") {
  console.log("ya");
} else if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
  try {
    const { Client } = await import("pg");
    const klien = new Client({ connectionString: url });
    await klien.connect();
    try {
      const hasil = await klien.query("SELECT COUNT(*) AS jumlah FROM templat");
      console.log(Number(hasil.rows[0]?.jumlah ?? 0) > 0 ? "tidak" : "ya");
    } finally {
      await klien.end();
    }
  } catch {
    console.log("ya");
  }
} else {
  try {
    const { DatabaseSync } = await import("node:sqlite");
    const mentah = url.startsWith("file:") ? url.slice("file:".length) : url;
    const jalur = path.isAbsolute(mentah) ? mentah : path.join(process.cwd(), mentah);
    const db = new DatabaseSync(jalur);
    const baris = db.prepare("SELECT COUNT(*) AS jumlah FROM templat").get();
    console.log(Number(baris?.jumlah ?? 0) > 0 ? "tidak" : "ya");
  } catch {
    console.log("ya");
  }
}
