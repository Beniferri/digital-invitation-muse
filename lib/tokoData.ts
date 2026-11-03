// Lapisan baca data untuk situs publik dan admin.
// VERSI FONDASI: data dibaca dari database SQLite lewat lib/db.ts,
// bukan lagi dari berkas toko.json. Berkas toko.json kini hanya dipakai
// sebagai sumber seed awal (lihat scripts/seed.ts).
// Nama fungsi di berkas ini dipertahankan, supaya halaman-halaman yang
// sudah ada tidak perlu diubah.

import { satuBaris, semuaBaris, type Baris } from "./db";
import { daftarPaketHarga, type PaketHarga } from "@/data/paketHarga";
import { daftarTemplat, type ContohUndangan, type Templat } from "@/data/templat";
import {
  parseJadwalJson,
  parsePraAcaraJson,
  parseWarnaJson,
  type ItemJadwal,
  type ItemPraAcara,
} from "./royalGrace";

export type StatusUndangan = "Draft" | "Aktif" | "Selesai";

export interface BabakKisah {
  judul: string;
  cerita: string;
}

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
  kodeTamu: string;
  penggunaId: string | null;
  fotoUndangan: string | null;
  orangTuaPertama: string;
  orangTuaKedua: string;
  // Zamrud v2 — kolom form lengkap (opsional; kosong = seksi tersembunyi).
  kisah: BabakKisah[];
  videoKisah: string;
  rekeningBank: string;
  rekeningNomor: string;
  rekeningNama: string;
  alamatKirim: string;
  acaraWaktu: string;
  acaraKeduaJudul: string;
  acaraKeduaWaktu: string;
  acaraKeduaLokasi: string;
  // Editor kata-kata — sapaan pembuka + kata pengantar (opsional;
  // kosong = pakai teks template).
  teksPembuka: string;
  kataPengantar: string;
  // Royal Grace — kolom baru (opsional; kosong = seksi tersembunyi).
  jadwal: ItemJadwal[];
  praAcara: ItemPraAcara[];
  dressCode: string;
  dressCodeWarna: string[];
  transportasi: string;
  akomodasi: string;
}

/** Parse kisah_json dengan aman: data rusak atau bukan array -> []. */
function parseKisah(nilai: unknown): BabakKisah[] {
  try {
    const mentah = JSON.parse(String(nilai ?? "[]")) as unknown;
    if (!Array.isArray(mentah)) return [];
    return mentah
      .map((item) => ({
        judul: String((item as { judul?: unknown }).judul ?? "").trim(),
        cerita: String((item as { cerita?: unknown }).cerita ?? "").trim(),
      }))
      .filter((item) => item.judul !== "" || item.cerita !== "");
  } catch {
    return [];
  }
}

export type KehadiranRsvp = "Hadir" | "Tidak" | "Ragu";

export interface Rsvp {
  id: string;
  undanganId: string;
  nama: string;
  kehadiran: KehadiranRsvp;
  jumlahTamu: number;
  pesan: string;
  dibuatPada: string;
}

export interface RingkasanRsvp {
  totalBalasan: number;
  hadir: number;
  tidak: number;
  ragu: number;
  totalTamuHadir: number;
  totalTamuRagu: number;
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
    halamanPenuh: Number(baris.halaman_penuh) === 1 || baris.halaman_penuh === true,
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
    kodeTamu: String(baris.kode_tamu ?? ""),
    penggunaId: (baris.pengguna_id as string | null) ?? null,
    fotoUndangan: (baris.foto_undangan as string | null) ?? null,
    orangTuaPertama: String(baris.orang_tua_pertama ?? ""),
    orangTuaKedua: String(baris.orang_tua_kedua ?? ""),
    kisah: parseKisah(baris.kisah_json),
    videoKisah: String(baris.video_kisah ?? ""),
    rekeningBank: String(baris.rekening_bank ?? ""),
    rekeningNomor: String(baris.rekening_nomor ?? ""),
    rekeningNama: String(baris.rekening_nama ?? ""),
    alamatKirim: String(baris.alamat_kirim ?? ""),
    acaraWaktu: String(baris.acara_waktu ?? ""),
    acaraKeduaJudul: String(baris.acara_kedua_judul ?? ""),
    acaraKeduaWaktu: String(baris.acara_kedua_waktu ?? ""),
    acaraKeduaLokasi: String(baris.acara_kedua_lokasi ?? ""),
    teksPembuka: String(baris.teks_pembuka ?? ""),
    kataPengantar: String(baris.kata_pengantar ?? ""),
    jadwal: parseJadwalJson(baris.jadwal_json),
    praAcara: parsePraAcaraJson(baris.acara_pra_json),
    dressCode: String(baris.dress_code ?? ""),
    dressCodeWarna: parseWarnaJson(baris.dress_code_warna),
    transportasi: String(baris.transportasi ?? ""),
    akomodasi: String(baris.akomodasi ?? ""),
  };
}

/**
 * Jalur foto galeri tambahan milik satu undangan, urut sesuai urutan
 * unggah. Dipakai halaman tamu Zamrud (galeri = foto utama + daftar
 * ini + aset statis). Kosong kalau tidak ada — bukan galat.
 */
export async function bacaGaleriUndangan(undanganId: string): Promise<string[]> {
  try {
    const baris = await semuaBaris(
      "SELECT jalur FROM foto_galeri WHERE undangan_id = ? ORDER BY urutan ASC",
      undanganId,
    );
    return baris.map((item) => String(item.jalur)).filter((jalur) => jalur !== "");
  } catch {
    return [];
  }
}

function petakanRsvp(baris: Baris): Rsvp {
  const kehadiranMentah = String(baris.kehadiran);
  const kehadiran: KehadiranRsvp =
    kehadiranMentah === "Tidak" || kehadiranMentah === "Ragu" ? kehadiranMentah : "Hadir";
  return {
    id: String(baris.id),
    undanganId: String(baris.undangan_id),
    nama: String(baris.nama),
    kehadiran,
    jumlahTamu: Number(baris.jumlah_tamu),
    pesan: String(baris.pesan ?? ""),
    dibuatPada: String(baris.dibuat_pada).slice(0, 10),
  };
}

export async function bacaToko(): Promise<TokoData> {
  try {
    const templat = await semuaBaris("SELECT * FROM templat ORDER BY dibuat_pada ASC");
    const undangan = await semuaBaris("SELECT * FROM undangan ORDER BY dibuat_pada DESC");
    const paketHarga = await semuaBaris("SELECT * FROM paket_harga ORDER BY urutan ASC");
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

export async function cariUndanganOlehKode(kode: string): Promise<UndanganAdmin | null> {
  try {
    const baris = await satuBaris<Baris>("SELECT * FROM undangan WHERE kode_tamu = ?", kode);
    return baris ? petakanUndangan(baris) : null;
  } catch {
    return null;
  }
}

export async function bacaDaftarUndanganOlehPengguna(penggunaId: string): Promise<UndanganAdmin[]> {
  try {
    const baris = await semuaBaris("SELECT * FROM undangan WHERE pengguna_id = ? ORDER BY dibuat_pada DESC", penggunaId);
    return baris.map(petakanUndangan);
  } catch {
    return [];
  }
}

export async function cariUndanganOlehId(id: string): Promise<UndanganAdmin | null> {
  try {
    const baris = await satuBaris<Baris>("SELECT * FROM undangan WHERE id = ?", id);
    return baris ? petakanUndangan(baris) : null;
  } catch {
    return null;
  }
}

export async function bacaDaftarRsvp(undanganId: string): Promise<Rsvp[]> {
  try {
    const baris = await semuaBaris("SELECT * FROM rsvp WHERE undangan_id = ? ORDER BY dibuat_pada DESC", undanganId);
    return baris.map(petakanRsvp);
  } catch {
    return [];
  }
}

/**
 * Nilai filter kehadiran dari parameter tautan. Hanya tiga nilai persis
 * yang diterima; nilai lain (termasuk "Semua" atau kosong) berarti tanpa
 * filter, supaya parameter buatan tidak bisa memunculkan status yang
 * tidak ada.
 */
export function kehadiranBersih(nilai: string | string[] | undefined): KehadiranRsvp | null {
  if (nilai === "Hadir" || nilai === "Tidak" || nilai === "Ragu") return nilai;
  return null;
}

/**
 * Daftar RSVP dengan filter kehadiran (Tahap 3). Tanpa filter, hasilnya
 * sama persis dengan bacaDaftarRsvp. Ringkasan di halaman detail SELALU
 * dihitung dari daftar penuh (bukan yang terfilter), supaya angka
 * ringkasan tidak berubah saat pengguna memfilter daftar.
 */
export async function bacaDaftarRsvpTersaring(
  undanganId: string,
  kehadiran: KehadiranRsvp | null,
): Promise<Rsvp[]> {
  if (!kehadiran) return bacaDaftarRsvp(undanganId);
  try {
    const baris = await semuaBaris(
      "SELECT * FROM rsvp WHERE undangan_id = ? AND kehadiran = ? ORDER BY dibuat_pada DESC",
      undanganId,
      kehadiran,
    );
    return baris.map(petakanRsvp);
  } catch {
    return [];
  }
}

export interface RsvpTerbaru extends Rsvp {
  namaUndangan: string;
  undanganKodeTamu: string;
}

export async function bacaRsvpTerbaru(batas: number): Promise<RsvpTerbaru[]> {
  try {
    const baris = await semuaBaris(
      "SELECT r.*, u.nama_pertama AS undangan_nama_pertama, u.nama_kedua AS undangan_nama_kedua, u.kode_tamu AS undangan_kode_tamu FROM rsvp r JOIN undangan u ON u.id = r.undangan_id ORDER BY r.dibuat_pada DESC LIMIT ?",
      batas,
    );
    return baris.map((item) => ({
      ...petakanRsvp(item),
      namaUndangan: String(item.undangan_nama_pertama) + (String(item.undangan_nama_kedua) ? ` dan ${String(item.undangan_nama_kedua)}` : ""),
      undanganKodeTamu: String(item.undangan_kode_tamu ?? ""),
    }));
  } catch {
    return [];
  }
}

export async function bacaRingkasanRsvp(undanganId: string): Promise<RingkasanRsvp> {
  const daftar = await bacaDaftarRsvp(undanganId);
  const kosong: RingkasanRsvp = {
    totalBalasan: 0,
    hadir: 0,
    tidak: 0,
    ragu: 0,
    totalTamuHadir: 0,
    totalTamuRagu: 0,
  };
  return daftar.reduce((ringkasan, rsvp) => {
    ringkasan.totalBalasan += 1;
    if (rsvp.kehadiran === "Hadir") {
      ringkasan.hadir += 1;
      ringkasan.totalTamuHadir += rsvp.jumlahTamu;
    } else if (rsvp.kehadiran === "Tidak") {
      ringkasan.tidak += 1;
    } else {
      ringkasan.ragu += 1;
      ringkasan.totalTamuRagu += rsvp.jumlahTamu;
    }
    return ringkasan;
  }, kosong);
}
