// Batas percobaan masuk (login) per IP — tanpa layanan luar, tanpa CAPTCHA.
// Polanya sama seperti anti-spam RSVP di lib/antiSpam.ts: yang disimpan
// HANYA hash IP (bukan IP mentah), dan hanya kegagalan yang dicatat,
// supaya pengguna yang berhasil masuk tidak pernah terhitung.
// Aturan: maks 10 kegagalan per 15 menit per IP. Di atas itu, server
// action masuk menolak dengan pesan gagal yang sama seperti kata sandi
// salah — sengaja tidak dibedakan, supaya penyerang tidak bisa tahu
// apakah IP-nya sudah dibatasi atau kata sandinya yang salah.
// Baris yang lebih tua dari 15 menit dihapus di setiap pengecekan,
// jadi tabel ini membersihkan dirinya sendiri tanpa cron.

import { headers } from "next/headers";
import { createHash } from "crypto";
import { idBaru, jalankan, satuBaris, sekarangIso, type Baris } from "./db";

export const BATAS_GAGAL_MASUK_PER_15_MENIT = 10;
export const JENDELA_GAGAL_MASUK_MENIT = 15;

function ipKlien(): string {
  const daftar = headers();
  const diteruskan = daftar.get("x-forwarded-for");
  if (diteruskan) {
    const pertama = diteruskan.split(",")[0]?.trim();
    if (pertama) return pertama;
  }
  return daftar.get("x-real-ip")?.trim() || "tidak-diketahui";
}

export function hashIpMasuk(ip: string): string {
  const garam = process.env.MASUK_IP_SALT ?? "";
  return createHash("sha256").update(`${garam}:${ip}`).digest("hex");
}

/** Mencatat satu kegagalan masuk untuk hash IP ini. */
export async function catatGagalMasukUntukIp(ipHash: string): Promise<void> {
  await jalankan(
    "INSERT INTO upaya_masuk (id, ip_hash, dibuat_pada) VALUES (?, ?, ?)",
    idBaru(),
    ipHash,
    sekarangIso(),
  );
}

/** True kalau hash IP ini masih di bawah batas kegagalan dalam jendela. */
export async function masihBolehMasukUntukIp(ipHash: string): Promise<boolean> {
  const batas = new Date(Date.now() - JENDELA_GAGAL_MASUK_MENIT * 60 * 1000).toISOString();
  await jalankan("DELETE FROM upaya_masuk WHERE dibuat_pada < ?", batas);
  const hitung = await satuBaris<Baris>(
    "SELECT COUNT(*) AS jumlah FROM upaya_masuk WHERE ip_hash = ? AND dibuat_pada >= ?",
    ipHash,
    batas,
  );
  return Number(hitung?.jumlah ?? 0) < BATAS_GAGAL_MASUK_PER_15_MENIT;
}

export async function masihBolehMasuk(): Promise<boolean> {
  return masihBolehMasukUntukIp(hashIpMasuk(ipKlien()));
}

export async function catatGagalMasuk(): Promise<void> {
  await catatGagalMasukUntukIp(hashIpMasuk(ipKlien()));
}
