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
import { bolehAktifkanUndangan } from "./langganan";
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
  const templat = await satuBaris<Baris>("SELECT slug FROM templat WHERE slug = ? AND aktif = 1", slugTemplat);
  if (!templat) redirect("/akun/undangan/baru?galat=1");
  // Penegakan Tahap 2: membuat undangan dengan status Aktif langsung
  // butuh langganan aktif + slot tersisa. Membuat Draft selalu gratis
  // (penegakannya nanti saat status diubah jadi Aktif).
  const statusDiminta = statusBersih(teks(formulir, "status"));
  if (statusDiminta === "Aktif") {
    const cek = await bolehAktifkanUndangan(sesi.id);
    if (!cek.boleh) redirect(`/akun/undangan/baru?galat=${cek.alasan}`);
  }

  let kodeTamu = buatKodeTamu();
  while (await satuBaris<Baris>("SELECT id FROM undangan WHERE kode_tamu = ?", kodeTamu)) {
    kodeTamu = buatKodeTamu();
  }
  await jalankan(
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
 * mengaktifkannya sendiri dari dasbor, dan di sanalah penegakan batas
 * paket Tahap 2 berlaku (membuat Draft dari editor selalu gratis). Foto yang dipilih di editor ikut
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
  const templat = await satuBaris<Baris>(
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

  // Zamrud v2 — galeri tambahan: maksimal 6 foto, masing-masing ikut
  // aturan yang sama dengan foto utama (5 MB, JPG/PNG/WebP). Diproses
  // SEBELUM insert supaya galat foto tidak menyisakan undangan tanpa
  // galeri; berkas yang sudah tersimpan sebelum galat tidak dihapus
  // (sama seperti foto utama) — tidak dirujuk undangan mana pun.
  const berkasGaleri = formulir
    .getAll("galeri")
    .filter((item): item is File => item instanceof File && item.size > 0)
    .slice(0, 6);
  const jalurGaleri: string[] = [];
  for (const berkas of berkasGaleri) {
    if (berkas.size > 5 * 1024 * 1024) redirect("/editor?galat=galeri-besar");
    if (!["image/jpeg", "image/png", "image/webp"].includes(berkas.type)) {
      redirect("/editor?galat=galeri-tipe");
    }
    const jalur = await simpanFoto(berkas);
    if (!jalur) redirect("/editor?galat=galeri-gagal");
    jalurGaleri.push(jalur);
  }

  // Zamrud v2 — kisah perjalanan: 3 babak opsional (judul + cerita).
  // Hanya babak yang judul atau ceritanya terisi yang disimpan.
  const kisah = [1, 2, 3]
    .map((nomor) => ({
      judul: teks(formulir, `kisahJudul${nomor}`).slice(0, 100),
      cerita: teks(formulir, `kisahCerita${nomor}`).slice(0, 2000),
    }))
    .filter((babak) => babak.judul !== "" || babak.cerita !== "");

  let kodeTamu = buatKodeTamu();
  while (await satuBaris<Baris>("SELECT id FROM undangan WHERE kode_tamu = ?", kodeTamu)) {
    kodeTamu = buatKodeTamu();
  }
  const idUndangan = idBaru();
  await jalankan(
    "INSERT INTO undangan (id, nama_pertama, nama_kedua, jenis_acara, tanggal, lokasi, slug_templat, status, dibuat_pada, pengguna_id, kode_tamu, foto_undangan, orang_tua_pertama, orang_tua_kedua, kisah_json, video_kisah, rekening_bank, rekening_nomor, rekening_nama, alamat_kirim, acara_waktu, acara_kedua_judul, acara_kedua_waktu, acara_kedua_lokasi, teks_pembuka, kata_pengantar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    idUndangan,
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
    teks(formulir, "orangTuaPertama"),
    teks(formulir, "orangTuaKedua"),
    JSON.stringify(kisah),
    teks(formulir, "videoKisah").slice(0, 500),
    teks(formulir, "rekeningBank").slice(0, 100),
    teks(formulir, "rekeningNomor").slice(0, 100),
    teks(formulir, "rekeningNama").slice(0, 100),
    teks(formulir, "alamatKirim").slice(0, 500),
    teks(formulir, "acaraWaktu").slice(0, 100),
    teks(formulir, "acaraKeduaJudul").slice(0, 100),
    teks(formulir, "acaraKeduaWaktu").slice(0, 100),
    teks(formulir, "acaraKeduaLokasi").slice(0, 200),
    teks(formulir, "teksPembuka").slice(0, 200),
    teks(formulir, "kataPengantar").slice(0, 2000),
  );
  for (let i = 0; i < jalurGaleri.length; i += 1) {
    await jalankan(
      "INSERT INTO foto_galeri (id, undangan_id, jalur, urutan) VALUES (?, ?, ?, ?)",
      idBaru(),
      idUndangan,
      jalurGaleri[i],
      i,
    );
  }
  revalidatePath("/akun", "page");
  redirect("/akun?dari=editor");
}

async function undanganMilikPengguna(id: string, penggunaId: string): Promise<boolean> {
  const baris = await satuBaris<Baris>("SELECT pengguna_id FROM undangan WHERE id = ?", id);
  return !!baris && String(baris.pengguna_id) === penggunaId;
}

export async function ubahStatusUndanganPengguna(formulir: FormData) {
  const sesi = await wajibPengguna();
  const id = teks(formulir, "id");
  if (!(await undanganMilikPengguna(id, sesi.id))) redirect("/akun");
  const statusBaru = statusBersih(teks(formulir, "status"));
  // Penegakan Tahap 2: mengubah status MENJADI Aktif butuh langganan
  // aktif + slot tersisa. Mengubah dari Aktif ke status lain, atau
  // menyimpan ulang status Aktif yang sudah Aktif, selalu diizinkan
  // (tidak menghabiskan slot baru).
  if (statusBaru === "Aktif") {
    const statusLama = await satuBaris<Baris>("SELECT status FROM undangan WHERE id = ?", id);
    if (String(statusLama?.status ?? "") !== "Aktif") {
      const cek = await bolehAktifkanUndangan(sesi.id);
      if (!cek.boleh) redirect(`/akun?galat=${cek.alasan}`);
    }
  }
  await jalankan("UPDATE undangan SET status = ? WHERE id = ?", statusBaru, id);
  revalidatePath("/akun", "page");
  redirect("/akun");
}

export async function hapusUndanganPengguna(formulir: FormData) {
  const sesi = await wajibPengguna();
  const id = teks(formulir, "id");
  if (!(await undanganMilikPengguna(id, sesi.id))) redirect("/akun");
  await jalankan("DELETE FROM undangan WHERE id = ?", id);
  revalidatePath("/akun", "page");
  redirect("/akun");
}
