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
import { mkdirSync } from "fs";
import path from "path";
import { randomBytes, randomUUID } from "crypto";

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
  pengguna_id TEXT REFERENCES pengguna(id) ON DELETE SET NULL,
  kode_tamu TEXT
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
CREATE TABLE IF NOT EXISTS rsvp (
  id TEXT PRIMARY KEY,
  undangan_id TEXT NOT NULL REFERENCES undangan(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  kehadiran TEXT NOT NULL DEFAULT 'Hadir',
  jumlah_tamu INTEGER NOT NULL DEFAULT 1,
  pesan TEXT NOT NULL DEFAULT '',
  dibuat_pada TEXT NOT NULL,
  diubah_pada TEXT NOT NULL
);
`;

/** Kode tamu pendek (8 karakter) untuk tautan yang dibagikan ke tamu, mis. /u/k4m9x2pq. */
export function buatKodeTamu(): string {
  const abjad = "abcdefghjkmnpqrstuvwxyz23456789";
  const acak = randomBytes(8);
  let kode = "";
  for (let i = 0; i < acak.length; i += 1) kode += abjad[acak[i] % abjad.length];
  return kode;
}

/**
 * Migrasi ringan untuk database yang dibuat sebelum kolom kode_tamu ada:
 * tambah kolomnya kalau belum ada, lalu isi kode untuk undangan lama yang
 * masih kosong. Database baru langsung punya kolom ini dari skema, jadi
 * migrasi ini hanya mengisi yang kosong (biasanya tidak ada).
 */
function migrasiKodeTamu(db: DatabaseSync): void {
  const kolom = db.prepare("PRAGMA table_info(undangan)").all() as Array<{ name: string }>;
  if (!kolom.some((c) => c.name === "kode_tamu")) {
    db.exec("ALTER TABLE undangan ADD COLUMN kode_tamu TEXT");
  }
  const tanpaKode = db.prepare("SELECT id FROM undangan WHERE kode_tamu IS NULL OR kode_tamu = ''").all() as Array<{ id: string }>;
  for (const baris of tanpaKode) {
    let kode = buatKodeTamu();
    while (db.prepare("SELECT id FROM undangan WHERE kode_tamu = ?").get(kode)) {
      kode = buatKodeTamu();
    }
    db.prepare("UPDATE undangan SET kode_tamu = ? WHERE id = ?").run(kode, baris.id);
  }
}

const globalUntukDb = globalThis as unknown as { db?: DatabaseSync };

function bukaDatabase(): DatabaseSync {
  if (!globalUntukDb.db) {
    const jalur = jalurDatabase();
    // Penting untuk deploy dengan volume (mis. Coolify): kalau DATABASE_URL
    // menunjuk ke folder volume yang belum ada di image (mis. /data/dev.db
    // atau ./data/dev.db), buat foldernya dulu — SQLite hanya membuat
    // berkasnya, bukan folder induknya, dan akan gagal kalau foldernya
    // belum ada. Untuk jalur lokal biasa, foldernya sudah ada jadi
    // pemanggilan ini tidak mengubah apa-apa.
    mkdirSync(path.dirname(jalur), { recursive: true });
    const db = new DatabaseSync(jalur);
    db.exec("PRAGMA foreign_keys = ON");
    db.exec(SKEMA);
    migrasiKodeTamu(db);
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
