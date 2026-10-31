// Seed database dari data/toko.json (bekas penyimpanan admin lama).
// Jalankan: npm run db:seed
// Skrip ini idempotent untuk template dan paket (berdasarkan slug/nama),
// sedangkan undangan contoh hanya ditambahkan kalau tabel undangan masih
// kosong, supaya seed ulang tidak menduplikasi undangan.
// Membuka database lewat lib/db.ts otomatis membuat tabelnya dulu.

import { readFileSync } from "fs";
import path from "path";
import { idBaru, jalankan, satuBaris, sekarangIso, type Baris } from "../lib/db";

interface TokoLama {
  templat: Array<{
    slug: string;
    nama: string;
    jenisAcara: string;
    warna: string;
    nuansa: string;
    deskripsi: string;
    aktif: boolean;
    halamanPenuh?: boolean;
    gaya: unknown;
    contoh: unknown;
    fotoSampul?: string | null;
  }>;
  undangan: Array<{
    namaPertama: string;
    namaKedua: string;
    jenisAcara: string;
    tanggal: string;
    lokasi: string;
    slugTemplat: string;
    status: string;
  }>;
  paketHarga: Array<{
    nama: string;
    keterangan: string;
    hargaBulanan: number;
    hargaTahunan: number;
    palingPopuler: boolean;
    fitur: string[];
  }>;
}

async function utama() {
  const jalur = path.join(process.cwd(), "data", "toko.json");
  const toko = JSON.parse(readFileSync(jalur, "utf-8")) as TokoLama;
  const sekarang = sekarangIso();

  for (const templat of toko.templat) {
    const sudahAda = await satuBaris<Baris>("SELECT id FROM templat WHERE slug = ?", templat.slug);
    if (sudahAda) {
      await jalankan(
        "UPDATE templat SET nama = ?, jenis_acara = ?, warna = ?, nuansa = ?, deskripsi = ?, aktif = ?, halaman_penuh = ?, gaya_json = ?, contoh_json = ?, foto_sampul = ?, diubah_pada = ? WHERE slug = ?",
        templat.nama,
        templat.jenisAcara,
        templat.warna,
        templat.nuansa,
        templat.deskripsi,
        templat.aktif ? 1 : 0,
        templat.halamanPenuh ? 1 : 0,
        JSON.stringify(templat.gaya),
        JSON.stringify(templat.contoh),
        templat.fotoSampul ?? null,
        sekarang,
        templat.slug,
      );
    } else {
      await jalankan(
        "INSERT INTO templat (id, slug, nama, jenis_acara, warna, nuansa, deskripsi, aktif, halaman_penuh, gaya_json, contoh_json, foto_sampul, dibuat_pada, diubah_pada) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        idBaru(),
        templat.slug,
        templat.nama,
        templat.jenisAcara,
        templat.warna,
        templat.nuansa,
        templat.deskripsi,
        templat.aktif ? 1 : 0,
        templat.halamanPenuh ? 1 : 0,
        JSON.stringify(templat.gaya),
        JSON.stringify(templat.contoh),
        templat.fotoSampul ?? null,
        sekarang,
        sekarang,
      );
    }
  }

  // Batas undangan aktif per paket (dipakai penegakan Tahap 2). Diambil dari
  // nama paket karena toko.json belum punya kolom ini; paket yang tidak
  // dikenal default 1 supaya tidak pernah tanpa batas.
  const maksUndanganAktif: Record<string, number> = { Hemat: 1, Populer: 3, "Keluarga Besar": 10 };
  for (let indeks = 0; indeks < toko.paketHarga.length; indeks += 1) {
    const paket = toko.paketHarga[indeks];
    const maks = maksUndanganAktif[paket.nama] ?? 1;
    const sudahAda = await satuBaris<Baris>("SELECT id FROM paket_harga WHERE nama = ?", paket.nama);
    if (sudahAda) {
      await jalankan(
        "UPDATE paket_harga SET keterangan = ?, harga_bulanan = ?, harga_tahunan = ?, paling_populer = ?, fitur_json = ?, urutan = ?, maks_undangan_aktif = ? WHERE nama = ?",
        paket.keterangan,
        paket.hargaBulanan,
        paket.hargaTahunan,
        paket.palingPopuler ? 1 : 0,
        JSON.stringify(paket.fitur),
        indeks,
        maks,
        paket.nama,
      );
    } else {
      await jalankan(
        "INSERT INTO paket_harga (id, nama, keterangan, harga_bulanan, harga_tahunan, paling_populer, fitur_json, urutan, maks_undangan_aktif) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        idBaru(),
        paket.nama,
        paket.keterangan,
        paket.hargaBulanan,
        paket.hargaTahunan,
        paket.palingPopuler ? 1 : 0,
        JSON.stringify(paket.fitur),
        indeks,
        maks,
      );
    }
  }

  const jumlahUndangan = await satuBaris<Baris>("SELECT COUNT(*) AS jumlah FROM undangan");
  const sudahAdaUndangan = Number(jumlahUndangan?.jumlah ?? 0) > 0;
  if (!sudahAdaUndangan) {
    for (const undangan of toko.undangan) {
      await jalankan(
        "INSERT INTO undangan (id, nama_pertama, nama_kedua, jenis_acara, tanggal, lokasi, slug_templat, status, dibuat_pada) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        idBaru(),
        undangan.namaPertama,
        undangan.namaKedua,
        undangan.jenisAcara,
        undangan.tanggal,
        undangan.lokasi,
        undangan.slugTemplat,
        undangan.status,
        sekarang,
      );
    }
  }

  console.log(
    `Seed selesai: ${toko.templat.length} template, ${toko.paketHarga.length} paket, undangan sudah ada sebelumnya: ${sudahAdaUndangan}`,
  );
}

utama().catch((galat) => {
  console.error(galat);
  process.exit(1);
});
