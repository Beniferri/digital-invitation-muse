// Sesi masuk berbasis database, menggantikan gerbang demo lama.
// Alurnya: token acak dibuat saat masuk, hash-nya disimpan di tabel sesi,
// token mentahnya dikirim sebagai cookie httpOnly. Setiap permintaan yang
// butuh login membaca cookie, meng-hash-nya, lalu mencari sesi yang masih
// berlaku di database. Menghapus baris sesi = keluar dari perangkat itu.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "crypto";
import { idBaru, jalankan, satuBaris, sekarangIso, type Baris } from "./db";

export const NAMA_COOKIE_SESI = "sesi_token";
const MASA_BERLAKU_JAM = 8;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface SesiPengguna {
  id: string;
  email: string;
  nama: string | null;
  peran: string;
}

export async function buatSesi(penggunaId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const kedaluwarsa = new Date(Date.now() + MASA_BERLAKU_JAM * 60 * 60 * 1000).toISOString();
  await jalankan(
    "INSERT INTO sesi (id, token_hash, pengguna_id, kedaluwarsa, dibuat_pada) VALUES (?, ?, ?, ?, ?)",
    idBaru(),
    hashToken(token),
    penggunaId,
    kedaluwarsa,
    sekarangIso(),
  );
  cookies().set(NAMA_COOKIE_SESI, token, {
    httpOnly: true,
    // Di produksi (HTTPS) cookie sesi tidak boleh dikirim lewat HTTP polos.
    // Di development (HTTP lokal) flag ini dimatikan supaya login lokal
    // tetap jalan tanpa HTTPS.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MASA_BERLAKU_JAM * 60 * 60,
  });
  return token;
}

export async function ambilSesiSaatIni(): Promise<SesiPengguna | null> {
  const token = cookies().get(NAMA_COOKIE_SESI)?.value;
  if (!token) return null;
  const baris = await satuBaris<Baris & { kedaluwarsa: string; pengguna_id: string }>(
    "SELECT s.kedaluwarsa, s.id AS sesi_id, p.id, p.email, p.nama, p.peran FROM sesi s JOIN pengguna p ON p.id = s.pengguna_id WHERE s.token_hash = ?",
    hashToken(token),
  );
  if (!baris || String(baris.kedaluwarsa) < sekarangIso()) {
    if (baris) await jalankan("DELETE FROM sesi WHERE id = ?", String(baris.sesi_id));
    return null;
  }
  return {
    id: String(baris.id),
    email: String(baris.email),
    nama: (baris.nama as string | null) ?? null,
    peran: String(baris.peran),
  };
}

export async function hapusSesiSaatIni(): Promise<void> {
  const token = cookies().get(NAMA_COOKIE_SESI)?.value;
  if (token) {
    await jalankan("DELETE FROM sesi WHERE token_hash = ?", hashToken(token));
  }
  cookies().delete(NAMA_COOKIE_SESI);
}

export async function wajibAdmin(): Promise<SesiPengguna> {
  const sesi = await ambilSesiSaatIni();
  if (!sesi || sesi.peran !== "admin") {
    redirect("/admin/login");
  }
  return sesi;
}
