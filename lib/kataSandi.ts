// Hash kata sandi sungguhan dengan scrypt (modul crypto bawaan Node).
// Tidak ada kata sandi mentah yang disimpan di database, dan tidak ada
// kata sandi bawaan di kode: akun admin dibuat lewat skrip buat-admin
// dengan kata sandi yang kamu tentukan sendiri.

import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Format simpanan: "garam:hash", keduanya heksadesimal.
export function hashKataSandi(kataSandi: string): string {
  const garam = randomBytes(16).toString("hex");
  const hash = scryptSync(kataSandi, garam, 64).toString("hex");
  return `${garam}:${hash}`;
}

export function periksaKataSandi(kataSandi: string, simpanan: string): boolean {
  const [garam, hashTersimpan] = simpanan.split(":");
  if (!garam || !hashTersimpan) return false;
  const hashBaru = scryptSync(kataSandi, garam, 64);
  const hashLama = Buffer.from(hashTersimpan, "hex");
  if (hashBaru.length !== hashLama.length) return false;
  return timingSafeEqual(hashBaru, hashLama);
}
