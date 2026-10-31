// Pemeriksa kecil untuk entrypoint Docker: apakah database perlu di-seed?
// Mencetak "ya" kalau berkas database belum ada, tabel templat belum ada,
// atau jumlah template nol; selain itu mencetak "tidak".
// Sengaja ditulis JavaScript polos (tanpa TypeScript, tanpa dependensi)
// supaya bisa jalan dengan `node` saja di dalam image, tanpa tsx.
// Kegagalan apa pun dianggap "ya", karena skrip seed sendiri yang akan
// membuat tabelnya lewat lib/db.ts kalau memang belum ada.

import { DatabaseSync } from "node:sqlite";
import path from "node:path";

function jalurDatabase() {
  const mentah = process.env.DATABASE_URL || "file:./dev.db";
  const jalur = mentah.startsWith("file:") ? mentah.slice("file:".length) : mentah;
  return path.isAbsolute(jalur) ? jalur : path.join(process.cwd(), jalur);
}

try {
  const db = new DatabaseSync(jalurDatabase());
  const baris = db.prepare("SELECT COUNT(*) AS jumlah FROM templat").get();
  console.log(Number(baris?.jumlah ?? 0) > 0 ? "tidak" : "ya");
} catch {
  console.log("ya");
}
