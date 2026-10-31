// Lapisan data pesanan + langganan (Tahap 2). Hanya memakai lib/db.ts,
// jadi fungsi-fungsi di sini bisa dites langsung tanpa runtime Next.
// Aturan bisnis yang dipegang berkas ini:
//   - Membuat undangan (Draft) gratis; yang butuh langganan aktif adalah
//     mengaktifkan undangan (status Aktif). Undangan admin lama
//     (pengguna_id kosong) tidak kena batas paket.
//   - Langganan baru menggantikan langganan aktif lama (status Diganti);
//     tidak ada penumpukan masa aktif.
//   - Kedaluwarsa diperiksa malas (lazy): setiap kali langganan pengguna
//     dibaca (dasbor, halaman tamu, penegakan batas), langganan yang sudah
//     lewat tanggal berakhirnya diubah jadi Selesai, dan undangannya yang
//     masih Aktif ikut diubah jadi Selesai — kecuali pengguna itu sudah
//     punya langganan aktif lain yang masih berlaku.

import { idBaru, jalankan, satuBaris, semuaBaris, sekarangIso, type Baris } from "./db";
import { durasiHariPeriode, type PeriodePembayaran, type StatusPesanan } from "./midtrans";

export interface PaketJual {
  nama: string;
  keterangan: string;
  hargaBulanan: number;
  hargaTahunan: number;
  maksUndanganAktif: number;
}

export interface Pesanan {
  id: string;
  orderId: string;
  penggunaId: string;
  namaPaket: string;
  periode: PeriodePembayaran;
  nominal: number;
  status: StatusPesanan;
  snapToken: string | null;
  snapRedirectUrl: string | null;
  metodePembayaran: string | null;
  dibuatPada: string;
  diubahPada: string;
}

export interface Langganan {
  id: string;
  penggunaId: string;
  pesananId: string;
  namaPaket: string;
  maksUndanganAktif: number;
  mulaiPada: string;
  berakhirPada: string;
  status: "Aktif" | "Selesai" | "Diganti";
  dibuatPada: string;
}

function petakanPesanan(baris: Baris): Pesanan {
  return {
    id: String(baris.id),
    orderId: String(baris.order_id),
    penggunaId: String(baris.pengguna_id),
    namaPaket: String(baris.nama_paket),
    periode: String(baris.periode) === "tahunan" ? "tahunan" : "bulanan",
    nominal: Number(baris.nominal),
    status: String(baris.status) as StatusPesanan,
    snapToken: (baris.snap_token as string | null) ?? null,
    snapRedirectUrl: (baris.snap_redirect_url as string | null) ?? null,
    metodePembayaran: (baris.metode_pembayaran as string | null) ?? null,
    dibuatPada: String(baris.dibuat_pada).slice(0, 10),
    diubahPada: String(baris.diubah_pada).slice(0, 10),
  };
}

function petakanLangganan(baris: Baris): Langganan {
  return {
    id: String(baris.id),
    penggunaId: String(baris.pengguna_id),
    pesananId: String(baris.pesanan_id),
    namaPaket: String(baris.nama_paket),
    maksUndanganAktif: Number(baris.maks_undangan_aktif),
    mulaiPada: String(baris.mulai_pada).slice(0, 10),
    berakhirPada: String(baris.berakhir_pada).slice(0, 10),
    status: String(baris.status) as Langganan["status"],
    dibuatPada: String(baris.dibuat_pada).slice(0, 10),
  };
}

export async function cariPaket(nama: string): Promise<PaketJual | null> {
  const baris = await satuBaris<Baris>("SELECT * FROM paket_harga WHERE nama = ?", nama);
  if (!baris) return null;
  return {
    nama: String(baris.nama),
    keterangan: String(baris.keterangan),
    hargaBulanan: Number(baris.harga_bulanan),
    hargaTahunan: Number(baris.harga_tahunan),
    maksUndanganAktif: Number(baris.maks_undangan_aktif ?? 1),
  };
}

export async function bacaDaftarPaketJual(): Promise<PaketJual[]> {
  return (await semuaBaris("SELECT * FROM paket_harga ORDER BY urutan ASC")).map((baris) => ({
    nama: String(baris.nama),
    keterangan: String(baris.keterangan),
    hargaBulanan: Number(baris.harga_bulanan),
    hargaTahunan: Number(baris.harga_tahunan),
    maksUndanganAktif: Number(baris.maks_undangan_aktif ?? 1),
  }));
}

export function nominalPaket(paket: PaketJual, periode: PeriodePembayaran): number {
  return periode === "tahunan" ? paket.hargaTahunan : paket.hargaBulanan;
}

/** order_id Midtrans: hanya huruf, angka, dan setrip (aturan Midtrans). */
export function buatOrderId(): string {
  const acak = Math.random().toString(36).slice(2, 8);
  return `UK-${Date.now()}-${acak}`;
}

/** Membuat pesanan baru berstatus Menunggu. Tidak memanggil Midtrans —
 *  token Snap dibuat terpisah oleh aksi pembayaran, supaya kegagalan
 *  Midtrans tidak menghapus pesanan yang sudah dibuat. */
export async function buatPesanan(
  penggunaId: string,
  namaPaket: string,
  periode: PeriodePembayaran,
): Promise<Pesanan> {
  const paket = await cariPaket(namaPaket);
  if (!paket) throw new Error("Paket tidak ditemukan.");
  const nominal = nominalPaket(paket, periode);
  if (nominal <= 0) throw new Error("Nominal paket tidak valid.");
  const sekarang = sekarangIso();
  const id = idBaru();
  const orderId = buatOrderId();
  await jalankan(
    "INSERT INTO pesanan (id, order_id, pengguna_id, nama_paket, periode, nominal, status, dibuat_pada, diubah_pada) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    id,
    orderId,
    penggunaId,
    namaPaket,
    periode,
    nominal,
    "Menunggu",
    sekarang,
    sekarang,
  );
  const baris = await satuBaris<Baris>("SELECT * FROM pesanan WHERE id = ?", id);
  if (!baris) throw new Error("Pesanan gagal dibuat.");
  return petakanPesanan(baris);
}

export async function cariPesananOlehOrderId(orderId: string): Promise<Pesanan | null> {
  const baris = await satuBaris<Baris>("SELECT * FROM pesanan WHERE order_id = ?", orderId);
  return baris ? petakanPesanan(baris) : null;
}

export async function cariPesananOlehIdDanPengguna(id: string, penggunaId: string): Promise<Pesanan | null> {
  const baris = await satuBaris<Baris>("SELECT * FROM pesanan WHERE id = ? AND pengguna_id = ?", id, penggunaId);
  return baris ? petakanPesanan(baris) : null;
}

export async function bacaDaftarPesananOlehPengguna(penggunaId: string): Promise<Pesanan[]> {
  return (await semuaBaris(
    "SELECT * FROM pesanan WHERE pengguna_id = ? ORDER BY dibuat_pada DESC",
    penggunaId,
  )).map(petakanPesanan);
}

export async function bacaSemuaPesanan(): Promise<Pesanan[]> {
  return (await semuaBaris("SELECT * FROM pesanan ORDER BY dibuat_pada DESC")).map(petakanPesanan);
}

export async function bacaSemuaLangganan(): Promise<Langganan[]> {
  return (await semuaBaris("SELECT * FROM langganan ORDER BY dibuat_pada DESC")).map(petakanLangganan);
}

export interface PesananDenganEmail extends Pesanan {
  email: string;
}

export interface LanggananDenganEmail extends Langganan {
  email: string;
}

/** Daftar pesanan + langganan untuk dasbor admin (dengan email pembeli). */
export async function bacaSemuaPesananDenganEmail(): Promise<PesananDenganEmail[]> {
  return (await semuaBaris(
    "SELECT p.*, u.email AS email FROM pesanan p JOIN pengguna u ON u.id = p.pengguna_id ORDER BY p.dibuat_pada DESC",
  )).map((baris) => ({ ...petakanPesanan(baris), email: String(baris.email) }));
}

export async function bacaSemuaLanggananDenganEmail(): Promise<LanggananDenganEmail[]> {
  return (await semuaBaris(
    "SELECT l.*, u.email AS email FROM langganan l JOIN pengguna u ON u.id = l.pengguna_id ORDER BY l.dibuat_pada DESC",
  )).map((baris) => ({ ...petakanLangganan(baris), email: String(baris.email) }));
}

export async function bacaLanggananOlehPengguna(penggunaId: string): Promise<Langganan[]> {
  return (await semuaBaris(
    "SELECT * FROM langganan WHERE pengguna_id = ? ORDER BY dibuat_pada DESC",
    penggunaId,
  )).map(petakanLangganan);
}

export async function simpanTokenSnap(
  pesananId: string,
  token: string,
  redirectUrl: string,
): Promise<void> {
  await jalankan(
    "UPDATE pesanan SET snap_token = ?, snap_redirect_url = ?, diubah_pada = ? WHERE id = ?",
    token,
    redirectUrl,
    sekarangIso(),
    pesananId,
  );
}

export async function ubahStatusPesanan(
  orderId: string,
  status: StatusPesanan,
  metodePembayaran: string | null,
): Promise<Pesanan | null> {
  await jalankan(
    "UPDATE pesanan SET status = ?, metode_pembayaran = COALESCE(?, metode_pembayaran), diubah_pada = ? WHERE order_id = ?",
    status,
    metodePembayaran,
    sekarangIso(),
    orderId,
  );
  return await cariPesananOlehOrderId(orderId);
}

/**
 * Memeriksa kedaluwarsa: langganan Aktif yang sudah lewat tanggal
 * berakhirnya diubah jadi Selesai. Undangannya yang masih Aktif ikut
 * diubah jadi Selesai — kecuali pengguna sudah punya langganan aktif lain
 * yang masih berlaku (mis. baru saja membeli paket baru sebelum sempat
 * ada pemeriksaan; dalam kasus itu undangannya tetap hidup di bawah
 * langganan baru).
 */
export async function periksaKedaluwarsaPengguna(penggunaId: string): Promise<boolean> {
  const sekarang = sekarangIso();
  const kedaluwarsa = await semuaBaris(
    "SELECT * FROM langganan WHERE pengguna_id = ? AND status = 'Aktif' AND berakhir_pada < ?",
    penggunaId,
    sekarang,
  );
  if (kedaluwarsa.length === 0) return false;
  const masihBerlaku = await satuBaris<Baris>(
    "SELECT id FROM langganan WHERE pengguna_id = ? AND status = 'Aktif' AND berakhir_pada >= ? LIMIT 1",
    penggunaId,
    sekarang,
  );
  for (const baris of kedaluwarsa) {
    await jalankan("UPDATE langganan SET status = 'Selesai' WHERE id = ?", String(baris.id));
  }
  if (!masihBerlaku) {
    await jalankan(
      "UPDATE undangan SET status = 'Selesai' WHERE pengguna_id = ? AND status = 'Aktif'",
      penggunaId,
    );
  }
  return true;
}

/** Langganan aktif pengguna (sudah melewati pemeriksaan kedaluwarsa dulu). */
export async function langgananAktifPengguna(penggunaId: string): Promise<Langganan | null> {
  await periksaKedaluwarsaPengguna(penggunaId);
  const baris = await satuBaris<Baris>(
    "SELECT * FROM langganan WHERE pengguna_id = ? AND status = 'Aktif' ORDER BY berakhir_pada DESC LIMIT 1",
    penggunaId,
  );
  return baris ? petakanLangganan(baris) : null;
}

export async function jumlahUndanganAktifPengguna(penggunaId: string): Promise<number> {
  const baris = await satuBaris<Baris>(
    "SELECT COUNT(*) AS jumlah FROM undangan WHERE pengguna_id = ? AND status = 'Aktif'",
    penggunaId,
  );
  return Number(baris?.jumlah ?? 0);
}

export interface HasilCekSlot {
  boleh: boolean;
  alasan: "ok" | "butuh-paket" | "slot-habis";
  langganan: Langganan | null;
  terpakai: number;
  maks: number;
}

/** Apakah pengguna ini boleh mengaktifkan satu undangan lagi? */
export async function bolehAktifkanUndangan(penggunaId: string): Promise<HasilCekSlot> {
  const langganan = await langgananAktifPengguna(penggunaId);
  if (!langganan) {
    return { boleh: false, alasan: "butuh-paket", langganan: null, terpakai: 0, maks: 0 };
  }
  const terpakai = await jumlahUndanganAktifPengguna(penggunaId);
  if (terpakai >= langganan.maksUndanganAktif) {
    return { boleh: false, alasan: "slot-habis", langganan, terpakai, maks: langganan.maksUndanganAktif };
  }
  return { boleh: true, alasan: "ok", langganan, terpakai, maks: langganan.maksUndanganAktif };
}

/**
 * Mengaktifkan langganan dari pesanan yang sudah Lunas. Idempotent:
 * kalau langganan untuk pesanan ini sudah ada, kembalikan yang itu tanpa
 * membuat duplikat (webhook Midtrans bisa datang lebih dari sekali).
 * Langganan aktif lama diubah jadi Diganti — masa aktif tidak ditumpuk.
 */
export async function aktifkanLanggananDariPesanan(pesanan: Pesanan): Promise<Langganan | null> {
  if (pesanan.status !== "Lunas") return null;
  const sudahAda = await satuBaris<Baris>("SELECT * FROM langganan WHERE pesanan_id = ?", pesanan.id);
  if (sudahAda) return petakanLangganan(sudahAda);
  const paket = await cariPaket(pesanan.namaPaket);
  if (!paket) return null;
  await jalankan(
    "UPDATE langganan SET status = 'Diganti' WHERE pengguna_id = ? AND status = 'Aktif'",
    pesanan.penggunaId,
  );
  const sekarang = new Date();
  const berakhir = new Date(sekarang.getTime() + durasiHariPeriode(pesanan.periode) * 24 * 3600 * 1000);
  const id = idBaru();
  await jalankan(
    "INSERT INTO langganan (id, pengguna_id, pesanan_id, nama_paket, maks_undangan_aktif, mulai_pada, berakhir_pada, status, dibuat_pada) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    id,
    pesanan.penggunaId,
    pesanan.id,
    pesanan.namaPaket,
    paket.maksUndanganAktif,
    sekarang.toISOString(),
    berakhir.toISOString(),
    "Aktif",
    sekarang.toISOString(),
  );
  const baris = await satuBaris<Baris>("SELECT * FROM langganan WHERE id = ?", id);
  return baris ? petakanLangganan(baris) : null;
}
