// Lapisan database (Tahap 4: dua backend).
//   - Default: SQLite bawaan Node (node:sqlite), seperti dulu. Tidak butuh
//     akun layanan luar, proyek langsung jalan di perangkat mana pun yang
//     memakai Node 24. Dipakai kalau DATABASE_URL diawali "file:" atau
//     tidak diawali skema Postgres.
//   - Postgres yang di-hosting (mis. layanan Postgres di Coolify atau
//     Supabase): dipakai kalau DATABASE_URL diawali "postgres://" atau
//     "postgresql://". Drivernya `pg` (Pool). Skema dan kuerinya SAMA
//     dengan SQLite: kolom TEXT/INTEGER, tanggal sebagai string ISO,
//     dan placeholder "?" yang diterjemahkan ke $1, $2, ... di sini.
//   - "pg-mem://": HANYA untuk pengujian (emulator Postgres di memori,
//     devDependency pg-mem). DITOLAK di produksi (NODE_ENV=production)
//     supaya tidak ada yang tidak sengaja mengetes di produksi.
// KONSEKUENSI PENTING: semua fungsi di sini ASINKRON (Postgres tidak
// punya API sinkron). Pemanggil wajib await. TypeScript akan menandai
// pemanggil yang lupa await sebagai galat tipe, dan build akan gagal —
// itu sengaja, supaya konversi tidak diam-diam menghasilkan Promise
// yang tidak ditunggu.
// Tabel dibuat otomatis saat database pertama kali dibuka (CREATE TABLE
// IF NOT EXISTS), jadi tidak ada langkah migrate terpisah. Pemanggil
// hanya memakai fungsi-fungsi di bawah (satuBaris, semuaBaris, jalankan)
// dan bentuk barisnya — backend mana pun yang aktif, bentuknya sama.

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "fs";
import path from "path";
import { randomBytes, randomUUID } from "crypto";

export type Baris = Record<string, unknown>;

type JenisBackend = "sqlite" | "postgres" | "pg-mem";

function jenisBackend(): JenisBackend {
  const url = process.env.DATABASE_URL ?? "";
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) return "postgres";
  if (url === "pg-mem://") return "pg-mem";
  return "sqlite";
}

function jalurDatabaseSqlite(): string {
  const mentah = process.env.DATABASE_URL || "file:./dev.db";
  const jalur = mentah.startsWith("file:") ? mentah.slice("file:".length) : mentah;
  return path.isAbsolute(jalur) ? jalur : path.join(process.cwd(), jalur);
}

export const SKEMA = `
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
  kode_tamu TEXT,
  foto_undangan TEXT
);
CREATE TABLE IF NOT EXISTS paket_harga (
  id TEXT PRIMARY KEY,
  nama TEXT UNIQUE NOT NULL,
  keterangan TEXT NOT NULL,
  harga_bulanan INTEGER NOT NULL,
  harga_tahunan INTEGER NOT NULL,
  paling_populer INTEGER NOT NULL DEFAULT 0,
  fitur_json TEXT NOT NULL,
  urutan INTEGER NOT NULL DEFAULT 0,
  maks_undangan_aktif INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS pesanan (
  id TEXT PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  pengguna_id TEXT NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  nama_paket TEXT NOT NULL,
  periode TEXT NOT NULL,
  nominal INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Menunggu',
  snap_token TEXT,
  snap_redirect_url TEXT,
  metode_pembayaran TEXT,
  dibuat_pada TEXT NOT NULL,
  diubah_pada TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS langganan (
  id TEXT PRIMARY KEY,
  pengguna_id TEXT NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  pesanan_id TEXT NOT NULL REFERENCES pesanan(id) ON DELETE CASCADE,
  nama_paket TEXT NOT NULL,
  maks_undangan_aktif INTEGER NOT NULL,
  mulai_pada TEXT NOT NULL,
  berakhir_pada TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aktif',
  dibuat_pada TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS percobaan_rsvp (
  id TEXT PRIMARY KEY,
  undangan_id TEXT NOT NULL REFERENCES undangan(id) ON DELETE CASCADE,
  ip_hash TEXT NOT NULL,
  dibuat_pada TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_percobaan_rsvp ON percobaan_rsvp(undangan_id, ip_hash, dibuat_pada);
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

/**
 * Menerjemahkan placeholder "?" menjadi $1, $2, ... untuk Postgres.
 * Tanda "?" di dalam literal string SQL ('...', dengan '' sebagai
 * petik yang di-escape) dilewati, supaya tidak ikut terhitung.
 */
export function terjemahkanPlaceholderPg(sql: string): string {
  let hasil = "";
  let nomor = 0;
  let dalamLiteral = false;
  for (let i = 0; i < sql.length; i += 1) {
    const c = sql[i];
    if (c === "'") {
      if (dalamLiteral && sql[i + 1] === "'") {
        hasil += "''";
        i += 1;
        continue;
      }
      dalamLiteral = !dalamLiteral;
      hasil += c;
      continue;
    }
    if (c === "?" && !dalamLiteral) {
      nomor += 1;
      hasil += `$${nomor}`;
      continue;
    }
    hasil += c;
  }
  return hasil;
}

interface Backend {
  satu(sql: string, parameter: unknown[]): Promise<Baris | null>;
  semua(sql: string, parameter: unknown[]): Promise<Baris[]>;
  tulis(sql: string, parameter: unknown[]): Promise<number>;
  kolomAda(tabel: string, kolom: string): Promise<boolean>;
  siapkan(): Promise<void>;
}

function backendSqlite(): Backend {
  let db: DatabaseSync | null = null;
  const dapatkan = (): DatabaseSync => {
    if (!db) {
      const jalur = jalurDatabaseSqlite();
      // Penting untuk deploy dengan volume (mis. Coolify): kalau
      // DATABASE_URL menunjuk ke folder volume yang belum ada di image
      // (mis. /data/dev.db), buat foldernya dulu — SQLite hanya membuat
      // berkasnya, bukan folder induknya.
      mkdirSync(path.dirname(jalur), { recursive: true });
      db = new DatabaseSync(jalur);
      db.exec("PRAGMA foreign_keys = ON");
    }
    return db;
  };
  return {
    async satu(sql, parameter) {
      const hasil = dapatkan().prepare(sql).get(...(parameter as never[])) as Baris | undefined;
      return hasil ?? null;
    },
    async semua(sql, parameter) {
      return dapatkan().prepare(sql).all(...(parameter as never[])) as Baris[];
    },
    async tulis(sql, parameter) {
      const hasil = dapatkan().prepare(sql).run(...(parameter as never[]));
      return Number(hasil.changes);
    },
    async kolomAda(tabel, kolom) {
      const daftar = dapatkan().prepare("PRAGMA table_info(" + tabel + ")").all() as Array<{ name: string }>;
      return daftar.some((c) => c.name === kolom);
    },
    async siapkan() {
      dapatkan().exec(SKEMA);
    },
  };
}

interface KolamPg {
  query: (teks: string, nilai: unknown[]) => Promise<{ rows: Baris[]; rowCount: number | null }>;
}

function backendPostgres(kolam: KolamPg): Backend {
  const jalankanPg = async (sql: string, parameter: unknown[]) => {
    // Pernyataan DDL (CREATE TABLE/INDEX) tidak punya placeholder dan
    // tidak boleh diterjemahkan sembarangan — tapi SKEMA tidak
    // mengandung "?" sama sekali, jadi aman diterjemahkan juga.
    return kolam.query(terjemahkanPlaceholderPg(sql), parameter);
  };
  return {
    async satu(sql, parameter) {
      const hasil = await jalankanPg(sql, parameter);
      return hasil.rows[0] ?? null;
    },
    async semua(sql, parameter) {
      const hasil = await jalankanPg(sql, parameter);
      return hasil.rows;
    },
    async tulis(sql, parameter) {
      const hasil = await jalankanPg(sql, parameter);
      return hasil.rowCount ?? 0;
    },
    async kolomAda(tabel, kolom) {
      const hasil = await jalankanPg(
        "SELECT column_name FROM information_schema.columns WHERE table_name = ? AND column_name = ?",
        [tabel, kolom],
      );
      return hasil.rows.length > 0;
    },
    async siapkan() {
      // SKEMA berisi banyak pernyataan sekaligus; pg hanya menerima satu
      // pernyataan per query, jadi jalankan per pernyataan (pisahkan
      // berdasarkan titik koma di akhir baris — DDL kita tidak memakai
      // titik koma di dalam pernyataan).
      const pernyataan = SKEMA.split(";\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      for (const satu of pernyataan) {
        await kolam.query(satu, []);
      }
    },
  };
}

const globalUntukDb = globalThis as unknown as {
  backend?: Backend;
  siap?: Promise<void>;
  jenis?: JenisBackend;
};

async function dapatkanBackend(): Promise<Backend> {
  if (!globalUntukDb.backend) {
    const jenis = jenisBackend();
    if (jenis === "sqlite") {
      globalUntukDb.backend = backendSqlite();
    } else if (jenis === "postgres") {
      const { Pool } = await import("pg");
      const kolam = new Pool({ connectionString: process.env.DATABASE_URL });
      globalUntukDb.backend = backendPostgres(kolam);
    } else {
      if (process.env.NODE_ENV === "production") {
        throw new Error("DATABASE_URL pg-mem:// hanya untuk pengujian, tidak boleh di produksi.");
      }
      const { newDb } = await import("pg-mem");
      const mem = newDb();
      const { Pool } = mem.adapters.createPg();
      const kolam = new Pool() as unknown as KolamPg;
      globalUntukDb.backend = backendPostgres(kolam);
    }
    globalUntukDb.jenis = jenis;
  }
  if (!globalUntukDb.siap) {
    globalUntukDb.siap = (async () => {
      const backend = globalUntukDb.backend!;
      await backend.siapkan();
      await migrasiUndangan(backend);
      await migrasiPembayaran(backend);
    })();
  }
  await globalUntukDb.siap;
  return globalUntukDb.backend;
}

/** Kode tamu pendek (8 karakter) untuk tautan yang dibagikan ke tamu, mis. /u/k4m9x2pq. */
export function buatKodeTamu(): string {
  const abjad = "abcdefghjkmnpqrstuvwxyz23456789";
  const acak = randomBytes(8);
  let kode = "";
  for (let i = 0; i < acak.length; i += 1) kode += abjad[acak[i] % abjad.length];
  return kode;
}

/**
 * Migrasi ringan untuk database lama: tambah kolom undangan yang belum
 * ada (kode_tamu dari fondasi RSVP, foto_undangan dari Tahap 1 editor
 * simpan), lalu isi kode untuk undangan lama yang masih kosong. Database
 * baru langsung punya kolom-kolom ini dari skema, jadi migrasi ini
 * biasanya tidak mengubah apa-apa.
 */
async function migrasiUndangan(backend: Backend): Promise<void> {
  if (!(await backend.kolomAda("undangan", "kode_tamu"))) {
    await backend.tulis("ALTER TABLE undangan ADD COLUMN kode_tamu TEXT", []);
  }
  if (!(await backend.kolomAda("undangan", "foto_undangan"))) {
    await backend.tulis("ALTER TABLE undangan ADD COLUMN foto_undangan TEXT", []);
  }
  const tanpaKode = await backend.semua(
    "SELECT id FROM undangan WHERE kode_tamu IS NULL OR kode_tamu = ''",
    [],
  );
  for (const baris of tanpaKode) {
    let kode = buatKodeTamu();
    while (await backend.satu("SELECT id FROM undangan WHERE kode_tamu = ?", [kode])) {
      kode = buatKodeTamu();
    }
    await backend.tulis("UPDATE undangan SET kode_tamu = ? WHERE id = ?", [kode, String(baris.id)]);
  }
}

/**
 * Migrasi ringan untuk pembayaran (Tahap 2): tambah kolom
 * maks_undangan_aktif di paket_harga kalau belum ada, lalu isi dari nama
 * paket (Hemat 1, Populer 3, Keluarga Besar 10). Tabel pesanan dan
 * langganan sudah dibuat lewat skema di atas, jadi tidak perlu migrasi
 * terpisah untuk keduanya.
 */
async function migrasiPembayaran(backend: Backend): Promise<void> {
  if (!(await backend.kolomAda("paket_harga", "maks_undangan_aktif"))) {
    await backend.tulis("ALTER TABLE paket_harga ADD COLUMN maks_undangan_aktif INTEGER NOT NULL DEFAULT 1", []);
  }
  const batas: Record<string, number> = { Hemat: 1, Populer: 3, "Keluarga Besar": 10 };
  for (const [nama, maks] of Object.entries(batas)) {
    await backend.tulis("UPDATE paket_harga SET maks_undangan_aktif = ? WHERE nama = ?", [maks, nama]);
  }
}

export function idBaru(): string {
  return randomUUID();
}

export function sekarangIso(): string {
  return new Date().toISOString();
}

/** Satu baris hasil query, atau null kalau tidak ada. */
export async function satuBaris<T extends Baris>(sql: string, ...parameter: unknown[]): Promise<T | null> {
  const backend = await dapatkanBackend();
  return (await backend.satu(sql, parameter)) as T | null;
}

/** Semua baris hasil query. */
export async function semuaBaris<T extends Baris>(sql: string, ...parameter: unknown[]): Promise<T[]> {
  const backend = await dapatkanBackend();
  return (await backend.semua(sql, parameter)) as T[];
}

/** Perintah tulis (INSERT/UPDATE/DELETE). Mengembalikan jumlah baris berubah. */
export async function jalankan(sql: string, ...parameter: unknown[]): Promise<number> {
  const backend = await dapatkanBackend();
  return backend.tulis(sql, parameter);
}
