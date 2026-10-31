// Lapisan baca data untuk situs publik dan admin.
// VERSI FONDASI: data dibaca dari database SQLite lewat lib/db.ts,
// bukan lagi dari berkas toko.json. Berkas toko.json kini hanya dipakai
// sebagai sumber seed awal (lihat scripts/seed.ts).
// Nama fungsi di berkas ini dipertahankan, supaya halaman-halaman yang
// sudah ada tidak perlu diubah.

import { semuaBaris, type Baris } from "./db";
import { daftarPaketHarga, type PaketHarga } from "@/data/paketHarga";
import { daftarTemplat, type ContohUndangan, type Templat } from "@/data/templat";

export type StatusUndangan = "Draft" | "Aktif" | "Selesai";

export interface UndanganAdmin {
  id: string;
  namaPertama: string;
  namaKedua: string;
  jenisAcara: string;
  tanggal: string;
  lokasi: string;
  slugTemplat: string;
  status: StatusUndangan;
  dibuatPada: string;
}

export interface TokoData {
  templat: Templat[];
  undangan: UndanganAdmin[];
  paketHarga: PaketHarga[];
}

function petakanTemplat(baris: Baris): Templat {
  return {
    slug: String(baris.slug),
    nama: String(baris.nama),
    jenisAcara: String(baris.jenis_acara) as Templat["jenisAcara"],
    warna: String(baris.warna) as Templat["warna"],
    nuansa: String(baris.nuansa) as Templat["nuansa"],
    deskripsi: String(baris.deskripsi),
    aktif: Number(baris.aktif) === 1,
    gaya: JSON.parse(String(baris.gaya_json)) as Templat["gaya"],
    contoh: JSON.parse(String(baris.contoh_json)) as ContohUndangan,
    fotoSampul: (baris.foto_sampul as string | null) ?? null,
  };
}

function petakanPaket(baris: Baris): PaketHarga {
  return {
    nama: String(baris.nama),
    keterangan: String(baris.keterangan),
    hargaBulanan: Number(baris.harga_bulanan),
    hargaTahunan: Number(baris.harga_tahunan),
    palingPopuler: Number(baris.paling_populer) === 1,
    fitur: JSON.parse(String(baris.fitur_json)) as string[],
  };
}

function petakanUndangan(baris: Baris): UndanganAdmin {
  return {
    id: String(baris.id),
    namaPertama: String(baris.nama_pertama),
    namaKedua: String(baris.nama_kedua),
    jenisAcara: String(baris.jenis_acara),
    tanggal: String(baris.tanggal),
    lokasi: String(baris.lokasi),
    slugTemplat: String(baris.slug_templat),
    status: String(baris.status) as StatusUndangan,
    dibuatPada: String(baris.dibuat_pada).slice(0, 10),
  };
}

export async function bacaToko(): Promise<TokoData> {
  try {
    const templat = semuaBaris("SELECT * FROM templat ORDER BY dibuat_pada ASC");
    const undangan = semuaBaris("SELECT * FROM undangan ORDER BY dibuat_pada DESC");
    const paketHarga = semuaBaris("SELECT * FROM paket_harga ORDER BY urutan ASC");
    return {
      templat: templat.map(petakanTemplat),
      undangan: undangan.map(petakanUndangan),
      paketHarga: paketHarga.map(petakanPaket),
    };
  } catch {
    // Cadangan saat build tanpa database (misalnya clone baru yang belum
    // menjalankan seed): tampilkan data statis lama supaya build tidak
    // gagal. Begitu database sudah di-seed, jalur database di atas yang
    // dipakai, bukan cadangan ini.
    return { templat: daftarTemplat, undangan: [], paketHarga: daftarPaketHarga };
  }
}

export async function bacaDaftarTemplat(): Promise<Templat[]> {
  const toko = await bacaToko();
  return toko.templat;
}

export async function bacaDaftarTemplatAktif(): Promise<Templat[]> {
  const toko = await bacaToko();
  return toko.templat.filter((templat) => templat.aktif);
}

export async function cariTemplatAktif(slug: string): Promise<Templat | undefined> {
  const daftar = await bacaDaftarTemplatAktif();
  return daftar.find((templat) => templat.slug === slug);
}

export async function bacaDaftarPaketHarga(): Promise<PaketHarga[]> {
  const toko = await bacaToko();
  return toko.paketHarga;
}

export async function bacaDaftarUndangan(): Promise<UndanganAdmin[]> {
  const toko = await bacaToko();
  return toko.undangan;
}
