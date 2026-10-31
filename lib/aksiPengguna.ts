// Server action dasbor pengguna (/akun).
// Berbeda dengan aksi admin, semua aksi di sini memeriksa kepemilikan:
// pengguna hanya boleh mengubah undangan yang pengguna_id-nya sama dengan
// id sesi mereka sendiri. Undangan admin lama (pengguna_id kosong) tidak
// muncul di dasbor pengguna dan tidak bisa diubah dari sini.

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { buatKodeTamu, idBaru, jalankan, satuBaris, sekarangIso, type Baris } from "./db";
import { simpanFoto } from "./penyimpananFoto";
import { ambilSesiSaatIni, type SesiPengguna } from "./sesi";
import type { StatusUndangan } from "./tokoData";

function teks(formulir: FormData, nama: string): string {
  return String(formulir.get(nama) ?? "").trim();
}

async function wajibPengguna(): Promise<SesiPengguna> {
  const sesi = await ambilSesiSaatIni();
  if (!sesi) redirect("/masuk");
  return sesi;
}

function statusBersih(nilai: string): StatusUndangan {
  return nilai === "Aktif" || nilai === "Selesai" ? nilai : "Draft";
}

export async function tambahUndanganPengguna(formulir: FormData) {
  const sesi = await wajibPengguna();
  const namaPertama = teks(formulir, "namaPertama");
  if (!namaPertama) redirect("/akun/undangan/baru?galat=1");
  const slugTemplat = teks(formulir, "slugTemplat");
  const templat = satuBaris<Baris>("SELECT slug FROM templat WHERE slug = ? AND aktif = 1", slugTemplat);
  if (!templat) redirect("/akun/undangan/baru?galat=1");

  let kodeTamu = buatKodeTamu();
  while (satuBaris<Baris>("SELECT id FROM undangan WHERE kode_tamu = ?", kodeTamu)) {
    kodeTamu = buatKodeTamu();
  }
  jalankan(
    "INSERT INTO undangan (id, nama_pertama, nama_kedua, jenis_acara, tanggal, lokasi, slug_templat, status, dibuat_pada, pengguna_id, kode_tamu) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    idBaru(),
    namaPertama,
    teks(formulir, "namaKedua"),
    teks(formulir, "jenisAcara"),
    teks(formulir, "tanggal"),
    teks(formulir, "lokasi"),
    slugTemplat,
    statusBersih(teks(formulir, "status")),
    sekarangIso(),
    sesi.id,
    kodeTamu,
  );
  revalidatePath("/akun", "page");
  redirect("/akun");
}

/**
 * Simpan undangan dari editor (/editor) sebagai milik pengguna yang masuk.
 * Berbeda dengan tambahUndanganPengguna (formulir dasbor): jenis acara
 * diambil dari template yang dipilih di editor, bukan dari isian pengguna
 * (editor tidak punya kolom jenis acara); status selalu Draft — pemilik
 * mengaktifkannya sendiri dari dasbor. Foto yang dipilih di editor ikut
 * diunggah lewat simpanFoto yang sama dengan foto sampul template
 * (maks 5 MB, JPG/PNG/WebP); tanpa foto, undangan memakai foto sampul
 * template di halaman tamu. Kegagalan dikembalikan ke /editor dengan kode
 * galat, supaya draf yang tersimpan di perangkat pengguna tetap bisa
 * dipulihkan dari localStorage (kecuali foto yang harus dipilih ulang).
 */
export async function tambahUndanganDariEditor(formulir: FormData) {
  const sesi = await wajibPengguna();
  const namaPertama = teks(formulir, "namaPertama");
  if (!namaPertama) redirect("/editor?galat=nama");
  const slugTemplat = teks(formulir, "slugTemplat");
  const templat = satuBaris<Baris>(
    "SELECT slug, jenis_acara FROM templat WHERE slug = ? AND aktif = 1",
    slugTemplat,
  );
  if (!templat) redirect("/editor?galat=templat");

  const berkasFoto = formulir.get("foto");
  let fotoUndangan: string | null = null;
  if (berkasFoto instanceof File && berkasFoto.size > 0) {
    if (berkasFoto.size > 5 * 1024 * 1024) redirect("/editor?galat=foto-besar");
    if (!["image/jpeg", "image/png", "image/webp"].includes(berkasFoto.type)) {
      redirect("/editor?galat=foto-tipe");
    }
    fotoUndangan = await simpanFoto(berkasFoto);
    if (!fotoUndangan) redirect("/editor?galat=foto-gagal");
  }

  let kodeTamu = buatKodeTamu();
  while (satuBaris<Baris>("SELECT id FROM undangan WHERE kode_tamu = ?", kodeTamu)) {
    kodeTamu = buatKodeTamu();
  }
  jalankan(
    "INSERT INTO undangan (id, nama_pertama, nama_kedua, jenis_acara, tanggal, lokasi, slug_templat, status, dibuat_pada, pengguna_id, kode_tamu, foto_undangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    idBaru(),
    namaPertama,
    teks(formulir, "namaKedua"),
    String(templat.jenis_acara),
    teks(formulir, "tanggal"),
    teks(formulir, "lokasi"),
    slugTemplat,
    "Draft",
    sekarangIso(),
    sesi.id,
    kodeTamu,
    fotoUndangan,
  );
  revalidatePath("/akun", "page");
  redirect("/akun?dari=editor");
}

async function undanganMilikPengguna(id: string, penggunaId: string): Promise<boolean> {
  const baris = satuBaris<Baris>("SELECT pengguna_id FROM undangan WHERE id = ?", id);
  return !!baris && String(baris.pengguna_id) === penggunaId;
}

export async function ubahStatusUndanganPengguna(formulir: FormData) {
  const sesi = await wajibPengguna();
  const id = teks(formulir, "id");
  if (!(await undanganMilikPengguna(id, sesi.id))) redirect("/akun");
  jalankan("UPDATE undangan SET status = ? WHERE id = ?", statusBersih(teks(formulir, "status")), id);
  revalidatePath("/akun", "page");
  redirect("/akun");
}

export async function hapusUndanganPengguna(formulir: FormData) {
  const sesi = await wajibPengguna();
  const id = teks(formulir, "id");
  if (!(await undanganMilikPengguna(id, sesi.id))) redirect("/akun");
  jalankan("DELETE FROM undangan WHERE id = ?", id);
  revalidatePath("/akun", "page");
  redirect("/akun");
}
