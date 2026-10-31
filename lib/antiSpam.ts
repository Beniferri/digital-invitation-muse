// Pengaman spam RSVP dasar (Tahap 4) — tanpa layanan luar, tanpa CAPTCHA.
// Tiga lapis, dari yang paling murah ke yang paling kuat:
//   1. Honeypot: kolom tersembunyi di formulir yang hanya diisi bot.
//      Pengecekannya ada di aksiRsvp (bukan di sini).
//   2. Jeda minimum: kiriman yang datang < 3 detik setelah halaman
//      dirender ditolak — manusia tidak bisa mengisi formulir secepat itu.
//      Pengecekannya ada di aksiRsvp (butuh waktu render dari halaman).
//   3. Batas kirim: maks 20 percobaan per jam per IP per undangan.
//      Lapisan inilah yang ada di berkas ini.
// Batas 20/jam sengaja longgar: tamu yang berkali-kali memperbaiki
// jawabannya tetap lolos, tapi banjir kiriman dari satu IP tertahan.
// Yang disimpan HANYA hash IP, tidak pernah IP mentah. Kalau environment
// RSVP_IP_SALT dipasang, hash tidak bisa dibalik dengan brute force
// daftar IPv4; kalau tidak dipasang, hash tetap lebih baik daripada IP
// mentah, dan barisnya terhapus otomatis setelah 1 jam (lihat bawah).

import { headers } from "next/headers";
import { createHash } from "crypto";
import { idBaru, jalankan, satuBaris, sekarangIso, type Baris } from "./db";

export const BATAS_RSVP_PER_JAM = 20;
export const JEDA_MINIMUM_RSVP_MS = 3000;

function ipKlien(): string {
  const daftar = headers();
  const diteruskan = daftar.get("x-forwarded-for");
  if (diteruskan) {
    const pertama = diteruskan.split(",")[0]?.trim();
    if (pertama) return pertama;
  }
  return daftar.get("x-real-ip")?.trim() || "tidak-diketahui";
}

export function hashIp(ip: string): string {
  const garam = process.env.RSVP_IP_SALT ?? "";
  return createHash("sha256").update(`${garam}:${ip}`).digest("hex");
}

/**
 * Mencatat satu percobaan kirim RSVP dan mengembalikan apakah masih
 * dalam batas. Baris yang lebih tua dari 1 jam dihapus dulu di setiap
 * pengecekan, jadi tabel ini membersihkan dirinya sendiri tanpa cron.
 * Panggil HANYA setelah lolos honeypot + jeda, supaya bot yang sudah
 * tertangkap dua lapis pertama tidak ikut mengisi tabel ini.
 * Versi "UntukIp" ini murni database (bisa dites tanpa request Next);
 * cekBatasRsvp hanya membungkusnya dengan IP dari header request.
 */
export async function cekBatasRsvpUntukIp(undanganId: string, ipHash: string): Promise<{ boleh: boolean }> {
  const sekarang = new Date();
  const satuJamLalu = new Date(sekarang.getTime() - 3600 * 1000).toISOString();
  await jalankan("DELETE FROM percobaan_rsvp WHERE dibuat_pada < ?", satuJamLalu);
  const hitung = await satuBaris<Baris>(
    "SELECT COUNT(*) AS jumlah FROM percobaan_rsvp WHERE undangan_id = ? AND ip_hash = ? AND dibuat_pada >= ?",
    undanganId,
    ipHash,
    satuJamLalu,
  );
  if (Number(hitung?.jumlah ?? 0) >= BATAS_RSVP_PER_JAM) return { boleh: false };
  await jalankan(
    "INSERT INTO percobaan_rsvp (id, undangan_id, ip_hash, dibuat_pada) VALUES (?, ?, ?, ?)",
    idBaru(),
    undanganId,
    ipHash,
    sekarangIso(),
  );
  return { boleh: true };
}

export async function cekBatasRsvp(undanganId: string): Promise<{ boleh: boolean }> {
  return cekBatasRsvpUntukIp(undanganId, hashIp(ipKlien()));
}
