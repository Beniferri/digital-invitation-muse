// Server action dasbor admin, VERSI FONDASI.
// Semua aksi memeriksa sesi admin dari database (lib/sesi.ts), menulis
// ke database SQLite lewat lib/db.ts, lalu memperbarui halaman publik
// yang terkait. Tidak ada lagi penulisan ke toko.json dan tidak ada
// kata sandi demo.

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { buatKodeTamu, idBaru, jalankan, satuBaris, sekarangIso, semuaBaris, type Baris } from "./db";
import { wajibAdmin } from "./sesi";
import { simpanFoto } from "./penyimpananFoto";
import type { StatusUndangan } from "./tokoData";
import type { JenisAcara, NuansaTemplat, Templat } from "@/data/templat";

async function perbaruiSemuaJalur(slugTemplat?: string) {
  revalidatePath("/", "page");
  revalidatePath("/katalog", "page");
  revalidatePath("/editor", "page");
  revalidatePath("/admin", "page");
  revalidatePath("/admin/templat", "page");
  revalidatePath("/admin/undangan", "page");
  revalidatePath("/admin/harga", "page");
  if (slugTemplat) revalidatePath(`/undangan/${slugTemplat}`, "page");
}

function teks(formulir: FormData, nama: string): string {
  return String(formulir.get(nama) ?? "").trim();
}

function slugValid(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function gayaDariPilihan(
  warna: Templat["warna"],
  nuansa: NuansaTemplat,
): Templat["gaya"] {
  if (nuansa === "Tradisional") {
    return {
      latar: "bg-krem-100",
      kartu: "rounded-t-[10rem] rounded-b-[2rem]",
      aksen: warna === "Hijau" ? "text-daun-700" : warna === "Terakota" ? "text-terakota-600" : "text-emas-600",
      aksenLembut: warna === "Hijau" ? "bg-daun-100" : warna === "Terakota" ? "bg-terakota-100" : "bg-emas-300/40",
      bentuk: "lengkung-atas",
      pola: "parang",
    };
  }
  if (nuansa === "Islami") {
    return {
      latar: "bg-daun-100",
      kartu: "rounded-[2.5rem]",
      aksen: "text-daun-700",
      aksenLembut: "bg-daun-100",
      bentuk: "kotak-bulat",
      pola: "melati",
    };
  }
  return {
    latar: warna === "Terakota" ? "bg-terakota-100" : warna === "Hijau" ? "bg-daun-100" : "bg-krem-100",
    kartu: "rounded-[1.75rem]",
    aksen: warna === "Hijau" ? "text-daun-700" : warna === "Terakota" ? "text-terakota-600" : "text-emas-600",
    aksenLembut: warna === "Hijau" ? "bg-daun-100" : warna === "Terakota" ? "bg-terakota-100" : "bg-emas-300/40",
    bentuk: "asimetris",
    pola: "garis",
  };
}

// ---------- Templat ----------

export async function simpanTemplat(formulir: FormData) {
  await wajibAdmin();
  const slugLama = teks(formulir, "slugLama");
  const slug = teks(formulir, "slug").toLowerCase();
  const nama = teks(formulir, "nama");
  const tujuanGalat = slugLama ? `/admin/templat/${slugLama}/ubah?galat=1` : "/admin/templat/baru?galat=1";

  if (!nama || !slugValid(slug)) redirect(tujuanGalat);

  const yangSudahAda = satuBaris<Baris>("SELECT slug FROM templat WHERE slug = ?", slug);
  if (yangSudahAda && String(yangSudahAda.slug) !== slugLama) redirect(tujuanGalat);

  const warnaMentah = teks(formulir, "warna") as Templat["warna"];
  const warnaBersih: Templat["warna"] =
    warnaMentah === "Hijau" || warnaMentah === "Terakota" ? warnaMentah : "Emas";
  const nuansaMentah = teks(formulir, "nuansa") as NuansaTemplat;
  const nuansaBersih: NuansaTemplat =
    nuansaMentah === "Islami" || nuansaMentah === "Modern" || nuansaMentah === "Minimalis"
      ? nuansaMentah
      : "Tradisional";

  const berkasFoto = formulir.get("fotoSampul");
  const fotoBaru = berkasFoto instanceof File ? await simpanFoto(berkasFoto) : null;
  const fotoLama = slugLama
    ? (satuBaris<Baris>("SELECT foto_sampul FROM templat WHERE slug = ?", slugLama)?.foto_sampul as string | null) ?? null
    : null;

  const gayaJson = JSON.stringify(gayaDariPilihan(warnaBersih, nuansaBersih));
  const contohJson = JSON.stringify({
    judulAcara: teks(formulir, "judulAcara"),
    namaPertama: teks(formulir, "namaPertama"),
    namaKedua: teks(formulir, "namaKedua"),
    tanggal: teks(formulir, "tanggal"),
    lokasi: teks(formulir, "lokasi"),
    salamPembuka: teks(formulir, "salamPembuka"),
    kutipan: teks(formulir, "kutipan"),
    catatan: teks(formulir, "catatan"),
  });
  const aktif = formulir.get("aktif") === "on" ? 1 : 0;
  const fotoSampul = fotoBaru ?? fotoLama;

  if (slugLama) {
    jalankan(
      "UPDATE templat SET slug = ?, nama = ?, jenis_acara = ?, warna = ?, nuansa = ?, deskripsi = ?, aktif = ?, gaya_json = ?, contoh_json = ?, foto_sampul = ?, diubah_pada = ? WHERE slug = ?",
      slug,
      nama,
      teks(formulir, "jenisAcara") as JenisAcara,
      warnaBersih,
      nuansaBersih,
      teks(formulir, "deskripsi"),
      aktif,
      gayaJson,
      contohJson,
      fotoSampul,
      sekarangIso(),
      slugLama,
    );
  } else {
    const sekarang = sekarangIso();
    jalankan(
      "INSERT INTO templat (id, slug, nama, jenis_acara, warna, nuansa, deskripsi, aktif, gaya_json, contoh_json, foto_sampul, dibuat_pada, diubah_pada) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      idBaru(),
      slug,
      nama,
      teks(formulir, "jenisAcara") as JenisAcara,
      warnaBersih,
      nuansaBersih,
      teks(formulir, "deskripsi"),
      aktif,
      gayaJson,
      contohJson,
      fotoSampul,
      sekarang,
      sekarang,
    );
  }
  await perbaruiSemuaJalur(slug);
  redirect("/admin/templat");
}

export async function ubahStatusTemplat(formulir: FormData) {
  await wajibAdmin();
  const slug = teks(formulir, "slug");
  const templat = satuBaris<Baris>("SELECT aktif FROM templat WHERE slug = ?", slug);
  if (templat) {
    jalankan("UPDATE templat SET aktif = ?, diubah_pada = ? WHERE slug = ?", Number(templat.aktif) === 1 ? 0 : 1, sekarangIso(), slug);
  }
  await perbaruiSemuaJalur(slug);
  redirect("/admin/templat");
}

export async function hapusTemplat(formulir: FormData) {
  await wajibAdmin();
  const slug = teks(formulir, "slug");
  jalankan("DELETE FROM templat WHERE slug = ?", slug);
  await perbaruiSemuaJalur(slug);
  redirect("/admin/templat");
}

// ---------- Undangan ----------

export async function tambahUndangan(formulir: FormData) {
  await wajibAdmin();
  const namaPertama = teks(formulir, "namaPertama");
  if (!namaPertama) redirect("/admin/undangan/baru?galat=1");
  let kodeTamu = buatKodeTamu();
  while (satuBaris<Baris>("SELECT id FROM undangan WHERE kode_tamu = ?", kodeTamu)) {
    kodeTamu = buatKodeTamu();
  }
  jalankan(
    "INSERT INTO undangan (id, nama_pertama, nama_kedua, jenis_acara, tanggal, lokasi, slug_templat, status, dibuat_pada, kode_tamu) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    idBaru(),
    namaPertama,
    teks(formulir, "namaKedua"),
    teks(formulir, "jenisAcara"),
    teks(formulir, "tanggal"),
    teks(formulir, "lokasi"),
    teks(formulir, "slugTemplat"),
    (teks(formulir, "status") as StatusUndangan) || "Draft",
    sekarangIso(),
    kodeTamu,
  );
  await perbaruiSemuaJalur();
  redirect("/admin/undangan");
}

export async function hapusRsvp(formulir: FormData) {
  await wajibAdmin();
  const id = teks(formulir, "id");
  const baris = satuBaris<Baris>("SELECT undangan_id FROM rsvp WHERE id = ?", id);
  jalankan("DELETE FROM rsvp WHERE id = ?", id);
  await perbaruiSemuaJalur();
  redirect(baris ? `/admin/undangan/${String(baris.undangan_id)}` : "/admin/undangan");
}

export async function ubahStatusUndangan(formulir: FormData) {
  await wajibAdmin();
  const id = teks(formulir, "id");
  const status = teks(formulir, "status") as StatusUndangan;
  jalankan("UPDATE undangan SET status = ? WHERE id = ?", status, id);
  await perbaruiSemuaJalur();
  redirect("/admin/undangan");
}

export async function hapusUndangan(formulir: FormData) {
  await wajibAdmin();
  const id = teks(formulir, "id");
  jalankan("DELETE FROM undangan WHERE id = ?", id);
  await perbaruiSemuaJalur();
  redirect("/admin/undangan");
}

// ---------- Harga ----------

export async function simpanHarga(formulir: FormData) {
  await wajibAdmin();
  const daftar = semuaBaris("SELECT * FROM paket_harga ORDER BY urutan ASC");
  for (let indeks = 0; indeks < daftar.length; indeks += 1) {
    const paket = daftar[indeks];
    const bulanan = Number(formulir.get(`bulanan-${indeks}`));
    const tahunan = Number(formulir.get(`tahunan-${indeks}`));
    jalankan(
      "UPDATE paket_harga SET harga_bulanan = ?, harga_tahunan = ? WHERE id = ?",
      Number.isFinite(bulanan) && bulanan > 0 ? bulanan : Number(paket.harga_bulanan),
      Number.isFinite(tahunan) && tahunan > 0 ? tahunan : Number(paket.harga_tahunan),
      String(paket.id),
    );
  }
  await perbaruiSemuaJalur();
  redirect("/admin/harga?tersimpan=1");
}
