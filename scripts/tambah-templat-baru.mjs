// Menambahkan template baru dari data/toko.json yang BELUM ada di database,
// tanpa mengubah template yang sudah ada. Dipanggil entrypoint Docker di
// setiap start container, supaya template baru (mis. Zamrud) langsung muncul
// di produksi setelah redeploy — seed penuh sengaja dilewati kalau database
// sudah berisi, jadi tanpa skrip ini template baru tidak akan pernah masuk.
// Aman diulang: slug yang sudah ada dilewati, tidak ada UPDATE.
// Mendukung SQLite (node:sqlite) dan Postgres (paket `pg`), mengikuti pola
// scripts/perlu-seed.mjs. Kegagalan mencetak pesan dan keluar kode 1,
// tapi entrypoint menanganinya sebagai peringatan (aplikasi tetap jalan).
import { readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const url = process.env.DATABASE_URL || "file:./dev.db";
const jalurToko = path.join(process.cwd(), "data", "toko.json");
const toko = JSON.parse(readFileSync(jalurToko, "utf-8"));
const sekarang = new Date().toISOString();

function nilaiHalamanPenuh(templat) {
  return templat.halamanPenuh ? 1 : 0;
}

if (url === "pg-mem://") {
  console.log("tambah-templat-baru: pg-mem dilewati (database memori).");
  process.exit(0);
}

if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
  const { Client } = await import("pg");
  const klien = new Client({ connectionString: url });
  await klien.connect();
  try {
    // Skrip ini jalan SEBELUM aplikasi (entrypoint), jadi migrasi lib/db.ts
    // belum tentu sudah berjalan: pastikan kolomnya ada dulu.
    const kolom = await klien.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'templat' AND column_name = 'halaman_penuh'",
    );
    if (kolom.rows.length === 0) {
      await klien.query("ALTER TABLE templat ADD COLUMN IF NOT EXISTS halaman_penuh INTEGER NOT NULL DEFAULT 0");
    }
    for (const templat of toko.templat) {
      const ada = await klien.query("SELECT id FROM templat WHERE slug = $1", [templat.slug]);
      if (ada.rows.length > 0) continue;
      await klien.query(
        "INSERT INTO templat (id, slug, nama, jenis_acara, warna, nuansa, deskripsi, aktif, halaman_penuh, gaya_json, contoh_json, foto_sampul, dibuat_pada, diubah_pada) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)",
        [randomUUID(), templat.slug, templat.nama, templat.jenisAcara, templat.warna, templat.nuansa, templat.deskripsi, templat.aktif ? 1 : 0, nilaiHalamanPenuh(templat), JSON.stringify(templat.gaya), JSON.stringify(templat.contoh), templat.fotoSampul ?? null, sekarang, sekarang],
      );
      console.log(`tambah-templat-baru: template baru ditambahkan: ${templat.slug}`);
    }
  } finally {
    await klien.end();
  }
} else {
  const berkas = url.replace(/^file:/, "");
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(berkas);
  try {
    // Lihat catatan Postgres di atas: kolom dipastikan dulu di sini juga.
    const tabelAda = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'templat'").get();
    if (tabelAda) {
      const kolom = db.prepare("PRAGMA table_info(templat)").all();
      if (!kolom.some((c) => c.name === "halaman_penuh")) {
        db.prepare("ALTER TABLE templat ADD COLUMN halaman_penuh INTEGER NOT NULL DEFAULT 0").run();
      }
    }
    for (const templat of toko.templat) {
      const ada = db.prepare("SELECT id FROM templat WHERE slug = ?").get(templat.slug);
      if (ada) continue;
      db.prepare(
        "INSERT INTO templat (id, slug, nama, jenis_acara, warna, nuansa, deskripsi, aktif, halaman_penuh, gaya_json, contoh_json, foto_sampul, dibuat_pada, diubah_pada) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(randomUUID(), templat.slug, templat.nama, templat.jenisAcara, templat.warna, templat.nuansa, templat.deskripsi, templat.aktif ? 1 : 0, nilaiHalamanPenuh(templat), JSON.stringify(templat.gaya), JSON.stringify(templat.contoh), templat.fotoSampul ?? null, sekarang, sekarang);
      console.log(`tambah-templat-baru: template baru ditambahkan: ${templat.slug}`);
    }
  } finally {
    db.close();
  }
}
console.log("tambah-templat-baru: selesai.");
