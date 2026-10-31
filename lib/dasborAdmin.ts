// Lapisan metrik dasbor admin: SEMUA angka dihitung dari database,
// bukan angka contoh. Definisi yang dipakai (ditulis juga di halaman
// Ringkasan supaya admin tidak salah baca):
//   - MRR: jumlah kontribusi bulanan langganan Aktif. Pesanan bulanan
//     menyumbang nominal penuh; pesanan tahunan menyumbang nominal/12
//     (dibulatkan per langganan). Langganan yang sudah lewat tanggal
//     berakhirnya diperiksa dulu (lazy) supaya tidak ikut terhitung.
//   - Churn 30 hari: langganan yang berakhir (status Selesai, tanggal
//     berakhir dalam 30 hari terakhir) dibagi (langganan Aktif sekarang
//     + yang berakhir 30 hari terakhir). Langganan Diganti BUKAN churn:
//     itu pengguna yang membeli paket baru, bukan yang pergi.
//   - Pendapatan per bulan: jumlah nominal pesanan Lunas, dikelompokkan
//     menurut bulan status terakhir diubah (untuk pesanan Lunas, itu
//     bulan webhook Midtrans mengonfirmasi pembayaran). Angka kotor,
//     sebelum biaya Midtrans dan pajak.
//   - Aktivitas: gabungan pesanan, langganan, dan akun baru. Waktu
//     tiap jenis: pesanan Lunas/Gagal = diubah_pada, pesanan Menunggu
//     = dibuat_pada, langganan Aktif = dibuat_pada, langganan Selesai
//     = berakhir_pada, langganan Diganti = dibuat_pada langganan
//     penggantinya (waktu pergantian tidak disimpan di baris lama),
//     akun baru = dibuat_pada.
// Batas: halaman ini hanya baca. Mengubah status pesanan tetap hanya
// lewat webhook Midtrans; admin tidak mengaktifkan langganan manual.

import { satuBaris, semuaBaris, sekarangIso, type Baris } from "./db";
import { periksaKedaluwarsaPengguna } from "./langganan";

const BULAN_SINGKAT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** Langganan Aktif yang sudah lewat tanggal berakhirnya diperiksa dulu. */
export async function periksaKedaluwarsaSemua(): Promise<void> {
  const sekarang = sekarangIso();
  const baris = await semuaBaris(
    "SELECT DISTINCT pengguna_id FROM langganan WHERE status = 'Aktif' AND berakhir_pada < ?",
    sekarang,
  );
  for (const item of baris) {
    await periksaKedaluwarsaPengguna(String(item.pengguna_id));
  }
}

export interface SebaranPaket {
  nama: string;
  jumlah: number;
  mrr: number;
}

export interface MetrikDasbor {
  mrr: number;
  langgananAktif: number;
  langgananBulanan: number;
  langgananTahunan: number;
  jumlahPengguna: number;
  penggunaBaru30Hari: number;
  /** null kalau penyebutnya nol (belum ada data untuk menghitung churn). */
  churn30Hari: number | null;
  berakhir30Hari: number;
  totalLunas: number;
  /** Pesanan Menunggu + Gagal: angka lencana "perlu perhatian" di topbar. */
  perhatian: number;
}

export async function hitungMetrikDasbor(): Promise<MetrikDasbor> {
  await periksaKedaluwarsaSemua();
  const sekarang = new Date();
  const tigaPuluhHariLalu = new Date(sekarang.getTime() - 30 * 24 * 3600 * 1000).toISOString();

  const aktif = await semuaBaris(
    "SELECT p.periode AS periode, p.nominal AS nominal FROM langganan l JOIN pesanan p ON p.id = l.pesanan_id WHERE l.status = 'Aktif'",
  );
  let mrr = 0;
  let langgananBulanan = 0;
  let langgananTahunan = 0;
  for (const baris of aktif) {
    const nominal = Number(baris.nominal);
    if (String(baris.periode) === "tahunan") {
      mrr += Math.round(nominal / 12);
      langgananTahunan += 1;
    } else {
      mrr += nominal;
      langgananBulanan += 1;
    }
  }

  const jumlahPengguna = Number(
    (await satuBaris<Baris>("SELECT COUNT(*) AS jumlah FROM pengguna"))?.jumlah ?? 0,
  );
  const penggunaBaru30Hari = Number(
    (
      await satuBaris<Baris>(
        "SELECT COUNT(*) AS jumlah FROM pengguna WHERE dibuat_pada >= ?",
        tigaPuluhHariLalu,
      )
    )?.jumlah ?? 0,
  );
  const berakhir30Hari = Number(
    (
      await satuBaris<Baris>(
        "SELECT COUNT(*) AS jumlah FROM langganan WHERE status = 'Selesai' AND berakhir_pada >= ?",
        tigaPuluhHariLalu,
      )
    )?.jumlah ?? 0,
  );
  const totalLunas = Number(
    (
      await satuBaris<Baris>(
        "SELECT COALESCE(SUM(nominal), 0) AS jumlah FROM pesanan WHERE status = 'Lunas'",
      )
    )?.jumlah ?? 0,
  );
  const perhatian = Number(
    (
      await satuBaris<Baris>(
        "SELECT COUNT(*) AS jumlah FROM pesanan WHERE status IN ('Menunggu', 'Gagal')",
      )
    )?.jumlah ?? 0,
  );

  const penyebutChurn = aktif.length + berakhir30Hari;
  const churn30Hari = penyebutChurn === 0 ? null : berakhir30Hari / penyebutChurn;

  return {
    mrr,
    langgananAktif: aktif.length,
    langgananBulanan,
    langgananTahunan,
    jumlahPengguna,
    penggunaBaru30Hari,
    churn30Hari,
    berakhir30Hari,
    totalLunas,
    perhatian,
  };
}

export interface PendapatanBulan {
  kunci: string;
  label: string;
  total: number;
}

/** 12 bulan terakhir (termasuk bulan berjalan), bulan kosong = 0. */
export async function pendapatanPerBulan(): Promise<PendapatanBulan[]> {
  const sekarang = new Date();
  const daftar: PendapatanBulan[] = [];
  for (let mundur = 11; mundur >= 0; mundur -= 1) {
    const tanggal = new Date(sekarang.getFullYear(), sekarang.getMonth() - mundur, 1);
    const kunci = `${tanggal.getFullYear()}-${String(tanggal.getMonth() + 1).padStart(2, "0")}`;
    daftar.push({
      kunci,
      label: `${BULAN_SINGKAT[tanggal.getMonth()]} ${tanggal.getFullYear()}`,
      total: 0,
    });
  }
  const baris = await semuaBaris(
    "SELECT substr(diubah_pada, 1, 7) AS bulan, SUM(nominal) AS total FROM pesanan WHERE status = 'Lunas' GROUP BY bulan",
  );
  const peta = new Map<string, number>();
  for (const item of baris) {
    peta.set(String(item.bulan), Number(item.total));
  }
  for (const bulan of daftar) {
    bulan.total = peta.get(bulan.kunci) ?? 0;
  }
  return daftar;
}

export async function sebaranPaket(): Promise<SebaranPaket[]> {
  const baris = await semuaBaris(
    "SELECT l.nama_paket AS nama, p.periode AS periode, p.nominal AS nominal FROM langganan l JOIN pesanan p ON p.id = l.pesanan_id WHERE l.status = 'Aktif' ORDER BY l.nama_paket ASC",
  );
  const peta = new Map<string, SebaranPaket>();
  for (const item of baris) {
    const nama = String(item.nama);
    const nominal = Number(item.nominal);
    const kontribusi = String(item.periode) === "tahunan" ? Math.round(nominal / 12) : nominal;
    const lama = peta.get(nama) ?? { nama, jumlah: 0, mrr: 0 };
    lama.jumlah += 1;
    lama.mrr += kontribusi;
    peta.set(nama, lama);
  }
  return Array.from(peta.values());
}

export type JenisAktivitas = "pembayaran" | "langganan" | "akun";

export interface Aktivitas {
  waktu: string;
  jenis: JenisAktivitas;
  judul: string;
  email: string;
  paket: string | null;
  nominal: number | null;
  detail: string;
}

function waktuTampil(iso: string): string {
  return String(iso).slice(0, 16).replace("T", " ");
}

/**
 * Aktivitas terbaru dari tiga sumber, digabung dan diurutkan terbaru dulu.
 * Pencarian (cari) mencocokkan email, order_id, atau nama paket.
 * Filter jenis: pembayaran (pesanan), langganan, akun (pengguna baru).
 */
export async function bacaAktivitas(
  cari: string,
  jenis: JenisAktivitas | null,
  batas: number,
): Promise<Aktivitas[]> {
  const kata = cari.trim();
  const pola = `%${kata}%`;
  const daftar: Aktivitas[] = [];

  if (!jenis || jenis === "pembayaran") {
    const baris = kata
      ? await semuaBaris(
          "SELECT p.*, u.email AS email FROM pesanan p JOIN pengguna u ON u.id = p.pengguna_id WHERE (u.email LIKE ? OR p.order_id LIKE ? OR p.nama_paket LIKE ?) ORDER BY p.dibuat_pada DESC LIMIT ?",
          pola,
          pola,
          pola,
          100,
        )
      : await semuaBaris(
          "SELECT p.*, u.email AS email FROM pesanan p JOIN pengguna u ON u.id = p.pengguna_id ORDER BY p.dibuat_pada DESC LIMIT ?",
          100,
        );
    for (const item of baris) {
      const status = String(item.status);
      daftar.push({
        waktu: waktuTampil(status === "Menunggu" ? String(item.dibuat_pada) : String(item.diubah_pada)),
        jenis: "pembayaran",
        judul:
          status === "Lunas"
            ? "Pembayaran lunas"
            : status === "Gagal"
              ? "Pembayaran gagal"
              : "Pesanan baru",
        email: String(item.email),
        paket: String(item.nama_paket),
        nominal: Number(item.nominal),
        detail: `${String(item.order_id)} · ${status === "Lunas" ? "Lunas" : status === "Gagal" ? "Gagal" : "Menunggu"}${item.metode_pembayaran ? ` · ${String(item.metode_pembayaran)}` : ""}`,
      });
    }
  }

  if (!jenis || jenis === "langganan") {
    const baris = kata
      ? await semuaBaris(
          "SELECT l.*, u.email AS email FROM langganan l JOIN pengguna u ON u.id = l.pengguna_id WHERE (u.email LIKE ? OR l.nama_paket LIKE ?) ORDER BY l.dibuat_pada DESC LIMIT ?",
          pola,
          pola,
          100,
        )
      : await semuaBaris(
          "SELECT l.*, u.email AS email FROM langganan l JOIN pengguna u ON u.id = l.pengguna_id ORDER BY l.dibuat_pada DESC LIMIT ?",
          100,
        );
    // Waktu pergantian: dibuat_pada langganan pengganti pengguna yang sama.
    const pengganti = new Map<string, string>();
    const perPengguna = new Map<string, { id: string; dibuat: string }[]>();
    for (const item of baris) {
      const daftarPengguna = perPengguna.get(String(item.pengguna_id)) ?? [];
      daftarPengguna.push({ id: String(item.id), dibuat: String(item.dibuat_pada) });
      perPengguna.set(String(item.pengguna_id), daftarPengguna);
    }
    perPengguna.forEach((daftarPengguna) => {
      const urut = [...daftarPengguna].sort((a, b) => a.dibuat.localeCompare(b.dibuat));
      for (let i = 0; i < urut.length - 1; i += 1) {
        pengganti.set(urut[i].id, urut[i + 1].dibuat);
      }
    });
    for (const item of baris) {
      const status = String(item.status);
      daftar.push({
        waktu: waktuTampil(
          status === "Aktif"
            ? String(item.dibuat_pada)
            : status === "Selesai"
              ? String(item.berakhir_pada)
              : (pengganti.get(String(item.id)) ?? String(item.dibuat_pada)),
        ),
        jenis: "langganan",
        judul:
          status === "Aktif"
            ? "Langganan aktif"
            : status === "Selesai"
              ? "Langganan berakhir"
              : "Langganan diganti",
        email: String(item.email),
        paket: String(item.nama_paket),
        nominal: null,
        detail: `${Number(item.maks_undangan_aktif)} slot · sampai ${String(item.berakhir_pada).slice(0, 10)}`,
      });
    }
  }

  if (!jenis || jenis === "akun") {
    const baris = kata
      ? await semuaBaris(
          "SELECT * FROM pengguna WHERE email LIKE ? OR nama LIKE ? ORDER BY dibuat_pada DESC LIMIT ?",
          pola,
          pola,
          100,
        )
      : await semuaBaris("SELECT * FROM pengguna ORDER BY dibuat_pada DESC LIMIT ?", 100);
    for (const item of baris) {
      daftar.push({
        waktu: waktuTampil(String(item.dibuat_pada)),
        jenis: "akun",
        judul: "Akun baru",
        email: String(item.email),
        paket: null,
        nominal: null,
        detail: String(item.peran) === "admin" ? "Akun admin" : "Akun pengguna",
      });
    }
  }

  daftar.sort((a, b) => b.waktu.localeCompare(a.waktu));
  return daftar.slice(0, batas);
}

export interface PenggunaAdmin {
  email: string;
  nama: string | null;
  peran: string;
  dibuatPada: string;
  jumlahUndangan: number;
  langgananAktif: string | null;
  langgananBerakhir: string | null;
}

export async function bacaDaftarPenggunaAdmin(cari: string): Promise<PenggunaAdmin[]> {
  const kata = cari.trim();
  const pola = `%${kata}%`;
  const baris = kata
    ? await semuaBaris(
        "SELECT * FROM pengguna WHERE email LIKE ? OR nama LIKE ? ORDER BY dibuat_pada DESC",
        pola,
        pola,
      )
    : await semuaBaris("SELECT * FROM pengguna ORDER BY dibuat_pada DESC");
  const daftar: PenggunaAdmin[] = [];
  for (const item of baris) {
    const penggunaId = String(item.id);
    const jumlahUndangan = Number(
      (
        await satuBaris<Baris>("SELECT COUNT(*) AS jumlah FROM undangan WHERE pengguna_id = ?", penggunaId)
      )?.jumlah ?? 0,
    );
    const langganan = await satuBaris<Baris>(
      "SELECT * FROM langganan WHERE pengguna_id = ? AND status = 'Aktif' ORDER BY berakhir_pada DESC LIMIT 1",
      penggunaId,
    );
    daftar.push({
      email: String(item.email),
      nama: (item.nama as string | null) ?? null,
      peran: String(item.peran),
      dibuatPada: String(item.dibuat_pada).slice(0, 10),
      jumlahUndangan,
      langgananAktif: langganan ? String(langganan.nama_paket) : null,
      langgananBerakhir: langganan ? String(langganan.berakhir_pada).slice(0, 10) : null,
    });
  }
  return daftar;
}

export interface HasilCariAdmin {
  pengguna: PenggunaAdmin[];
  undangan: { id: string; nama: string; jenisAcara: string; status: string; kodeTamu: string; email: string | null }[];
  pesanan: { orderId: string; email: string; namaPaket: string; nominal: number; status: string }[];
}

export async function cariAdmin(kata: string): Promise<HasilCariAdmin> {
  const pola = `%${kata.trim()}%`;
  const pengguna = await bacaDaftarPenggunaAdmin(kata);
  const undanganBaris = await semuaBaris(
    "SELECT u.*, p.email AS email FROM undangan u LEFT JOIN pengguna p ON p.id = u.pengguna_id WHERE u.nama_pertama LIKE ? OR u.nama_kedua LIKE ? OR u.kode_tamu LIKE ? ORDER BY u.dibuat_pada DESC LIMIT 20",
    pola,
    pola,
    pola,
  );
  const pesananBaris = await semuaBaris(
    "SELECT p.*, u.email AS email FROM pesanan p JOIN pengguna u ON u.id = p.pengguna_id WHERE p.order_id LIKE ? OR u.email LIKE ? ORDER BY p.dibuat_pada DESC LIMIT 20",
    pola,
    pola,
  );
  return {
    pengguna,
    undangan: undanganBaris.map((item) => ({
      id: String(item.id),
      nama:
        String(item.nama_pertama) + (String(item.nama_kedua) ? ` dan ${String(item.nama_kedua)}` : ""),
      jenisAcara: String(item.jenis_acara),
      status: String(item.status),
      kodeTamu: String(item.kode_tamu ?? ""),
      email: (item.email as string | null) ?? null,
    })),
    pesanan: pesananBaris.map((item) => ({
      orderId: String(item.order_id),
      email: String(item.email),
      namaPaket: String(item.nama_paket),
      nominal: Number(item.nominal),
      status: String(item.status),
    })),
  };
}

function selCsv(nilai: string | number | null): string {
  const teks = nilai === null ? "" : String(nilai);
  if (teks.includes(",") || teks.includes('"') || teks.includes("\n") || teks.includes("\r")) {
    return `"${teks.replace(/"/g, '""')}"`;
  }
  return teks;
}

/** CSV aktivitas (RFC 4180 + BOM), urutan sama seperti tabel. */
export function bangunCsvAktivitas(daftar: Aktivitas[]): string {
  const baris = [
    "Waktu,Jenis,Email,Paket,Nominal,Detail",
    ...daftar.map((item) =>
      [
        selCsv(item.waktu),
        selCsv(item.judul),
        selCsv(item.email),
        selCsv(item.paket),
        selCsv(item.nominal === null ? "" : item.nominal),
        selCsv(item.detail),
      ].join(","),
    ),
  ];
  return "\uFEFF" + baris.join("\n") + "\n";
}
