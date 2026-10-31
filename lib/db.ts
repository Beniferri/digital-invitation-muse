// Lapisan database fondasi: SQLite bawaan Node (node:sqlite).
// Alasan memilih ini: tidak butuh unduhan biner engine eksternal, tidak
// butuh akun layanan luar, dan proyek langsung jalan di perangkat mana pun
// yang memakai Node 24. Tabel dibuat otomatis saat database pertama kali
// dibuka (CREATE TABLE IF NOT EXISTS), jadi tidak ada langkah migrate
// terpisah untuk SQLite lokal.
// BATAS: lapisan ini hanya untuk SQLite lokal. Untuk Postgres yang
// di-hosting (misalnya Supabase), ganti berkas ini dengan driver Postgres
// tanpa mengubah pemanggilnya: pemanggil hanya memakai fungsi-fungsi
// di bawah (baris, semuaBaris, jalankan) dan bentuk barisnya.

import { DatabaseSync } from "node:sqlite";
import path from "path";
import { randomUUID } from "crypto";

export type Baris = Record<string, unknown>;

function jalurDatabase(): string {
  const mentah = process.env.DATABASE_URL || "file:./dev.db";
  const jalur = mentah.startsWith("file:") ? mentah.slice("file:".length) : mentah;
  return path.isAbsolute(jalur) ? jalur : path.join(process.cwd(), jalur);
}

const SKEMA = `
CREATE TABLE IF NOT EXISTS pengguna (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nama TEXT,
  kata_sandi_hash TEXT NOT NULL,
  peran TEXT NOT NULL DEFAULT 'pengguna',
  dibuat_pada TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sesi (
  id TEXT PRIMARY KEY,
  token_hash TEXT UNIQUE NOT NULL,
  pengguna_id TEXT NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  kedaluwarsa TEXT NOT NULL,
  dibuat_pada TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS templat (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  jenis_acara TEXT NOT NULL,
  warna TEXT NOT NULL,
  nuansa TEXT NOT NULL,
  deskripsi TEXT NOT NULL DEFAULT '',
  aktif INTEGER NOT NULL DEFAULT 1,
  gaya_json TEXT NOT NULL,
  contoh_json TEXT NOT NULL,
  foto_sampul TEXT,
  dibuat_pada TEXT NOT NULL,
  diubah_pada TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS undangan (
  id TEXT PRIMARY KEY,
  nama_pertama TEXT NOT NULL,
  nama_kedua TEXT NOT NULL DEFAULT '',
  jenis_acara TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  lokasi TEXT NOT NULL,
  slug_templat TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  dibuat_pada TEXT NOT NULL,
  pengguna_id TEXT REFERENCES pengguna(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS paket_harga (
  id TEXT PRIMARY KEY,
  nama TEXT UNIQUE NOT NULL,
  keterangan TEXT NOT NULL,
  harga_bulanan INTEGER NOT NULL,
  harga_tahunan INTEGER NOT NULL,
  paling_populer INTEGER NOT NULL DEFAULT 0,
  fitur_json TEXT NOT NULL,
  urutan INTEGER NOT NULL DEFAULT 0
);
`;

const globalUntukDb = globalThis as unknown as { db?: DatabaseSync };

function bukaDatabase(): DatabaseSync {
  if (!globalUntukDb.db) {
    const db = new DatabaseSync(jalurDatabase());
    db.exec("PRAGMA foreign_keys = ON");
    db.exec(SKEMA);
    globalUntukDb.db = db;
  }
  return globalUntukDb.db;
}

export function idBaru(): string {
  return randomUUID();
}

export function sekarangIso(): string {
  return new Date().toISOString();
}

/** Satu baris hasil query, atau null kalau tidak ada. */
export function satuBaris<T extends Baris>(sql: string, ...parameter: unknown[]): T | null {
  const db = bukaDatabase();
  const hasil = db.prepare(sql).get(...(parameter as never[])) as T | undefined;
  return hasil ?? null;
}

/** Semua baris hasil query. */
export function semuaBaris<T extends Baris>(sql: string, ...parameter: unknown[]): T[] {
  const db = bukaDatabase();
  return db.prepare(sql).all(...(parameter as never[])) as T[];
}

/** Perintah tulis (INSERT/UPDATE/DELETE). Mengembalikan jumlah baris berubah. */
export function jalankan(sql: string, ...parameter: unknown[]): number {
  const db = bukaDatabase();
  const hasil = db.prepare(sql).run(...(parameter as never[]));
  return Number(hasil.changes);
}
