// Server action masuk, daftar, dan keluar untuk semua pengguna.
// Admin dan pengguna biasa memakai jalur yang sama; yang membedakan
// hanyalah kolom peran di database. Halaman admin memeriksa peran itu,
// halaman pengguna biasa tidak.

"use server";

import { redirect } from "next/navigation";
import { idBaru, jalankan, satuBaris, sekarangIso, type Baris } from "./db";
import { hashKataSandi, periksaKataSandi } from "./kataSandi";
import { buatSesi, hapusSesiSaatIni } from "./sesi";

function teks(formulir: FormData, nama: string): string {
  return String(formulir.get(nama) ?? "").trim();
}

function emailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Tujuan kembali setelah masuk/daftar yang diizinkan dari formulir.
 * Sengaja daftar putih ketat (saat ini hanya /editor, dipakai tombol
 * Simpan di editor untuk pengguna yang belum masuk): tujuan sembarang
 * dari formulir tidak boleh dipakai sebagai redirect, supaya tidak bisa
 * dipakai mengarahkan pengguna ke situs luar atau ke halaman admin.
 */
function lanjutAman(formulir: FormData): string | null {
  return teks(formulir, "lanjut") === "/editor" ? "/editor" : null;
}

export async function masukPengguna(formulir: FormData, tujuanSukses = "/akun") {
  const email = teks(formulir, "email").toLowerCase();
  const kataSandi = String(formulir.get("kataSandi") ?? "");
  const lanjut = lanjutAman(formulir);
  const pengguna = email ? satuBaris<Baris>("SELECT * FROM pengguna WHERE email = ?", email) : null;
  if (!pengguna || !periksaKataSandi(kataSandi, String(pengguna.kata_sandi_hash))) {
    redirect(`/masuk?gagal=1${lanjut ? `&lanjut=${lanjut}` : ""}`);
  }
  await buatSesi(String(pengguna.id));
  redirect(lanjut ?? tujuanSukses);
}

export async function masukAdmin(formulir: FormData) {
  const email = teks(formulir, "email").toLowerCase();
  const kataSandi = String(formulir.get("kataSandi") ?? "");
  const pengguna = email ? satuBaris<Baris>("SELECT * FROM pengguna WHERE email = ?", email) : null;
  if (!pengguna || String(pengguna.peran) !== "admin" || !periksaKataSandi(kataSandi, String(pengguna.kata_sandi_hash))) {
    redirect("/admin/login?gagal=1");
  }
  await buatSesi(String(pengguna.id));
  redirect("/admin");
}

export async function daftarPengguna(formulir: FormData) {
  const email = teks(formulir, "email").toLowerCase();
  const nama = teks(formulir, "nama");
  const kataSandi = String(formulir.get("kataSandi") ?? "");
  const lanjut = lanjutAman(formulir);
  const akhiranLanjut = lanjut ? `&lanjut=${lanjut}` : "";
  if (!emailValid(email) || kataSandi.length < 8) {
    redirect(`/daftar?galat=1${akhiranLanjut}`);
  }
  const sudahAda = satuBaris<Baris>("SELECT id FROM pengguna WHERE email = ?", email);
  if (sudahAda) redirect(`/daftar?galat=sudah-ada${akhiranLanjut}`);
  const id = idBaru();
  jalankan(
    "INSERT INTO pengguna (id, email, nama, kata_sandi_hash, peran, dibuat_pada) VALUES (?, ?, ?, ?, ?, ?)",
    id,
    email,
    nama || null,
    hashKataSandi(kataSandi),
    "pengguna",
    sekarangIso(),
  );
  await buatSesi(id);
  redirect(lanjut ?? "/akun");
}

export async function keluarPengguna() {
  await hapusSesiSaatIni();
  redirect("/masuk");
}

export async function keluarAdmin() {
  await hapusSesiSaatIni();
  redirect("/admin/login");
}
