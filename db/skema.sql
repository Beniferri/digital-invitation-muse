-- Skema database UndanganKita (SQLite).
-- Salinan dokumentasi dari SKEMA di lib/db.ts. Tabel dibuat otomatis
-- oleh lib/db.ts saat database pertama kali dibuka, jadi berkas ini
-- tidak perlu dijalankan manual untuk SQLite lokal. Berkas ini ada
-- supaya struktur tabel mudah dibaca dan mudah dipindahkan ke Postgres
-- nanti (tipe TEXT/INTEGER di bawah punya padanan langsung di Postgres,
-- kecuali id TEXT yang di Postgres bisa diganti uuid/text).
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
