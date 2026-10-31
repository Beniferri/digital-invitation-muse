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
  halaman_penuh INTEGER NOT NULL DEFAULT 0,
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
  orang_tua_pertama TEXT NOT NULL DEFAULT '',
  orang_tua_kedua TEXT NOT NULL DEFAULT ''
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
CREATE TABLE IF NOT EXISTS percobaan_rsvp (
  id TEXT PRIMARY KEY,
  undangan_id TEXT NOT NULL REFERENCES undangan(id) ON DELETE CASCADE,
  ip_hash TEXT NOT NULL,
  dibuat_pada TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_percobaan_rsvp ON percobaan_rsvp(undangan_id, ip_hash, dibuat_pada);
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
