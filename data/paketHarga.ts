// Paket harga transparan. Nominal rupiah konkret, bukan "hubungi kami".
// Catatan penting: templat dipilih bebas dan tidak terikat paket.

export type PeriodeHarga = "bulanan" | "tahunan";

export interface PaketHarga {
  nama: string;
  keterangan: string;
  hargaBulanan: number;
  hargaTahunan: number;
  palingPopuler: boolean;
  fitur: string[];
}

export const daftarPaketHarga: PaketHarga[] = [
  {
    nama: "Hemat",
    keterangan: "Untuk acara keluarga kecil yang undangannya dibagikan ke lingkaran dekat.",
    hargaBulanan: 49000,
    hargaTahunan: 490000,
    palingPopuler: false,
    fitur: [
      "1 undangan aktif",
      "Semua templat bisa dipilih bebas",
      "Bagikan lewat WhatsApp",
      "Masa aktif selama langganan berjalan",
      "Bantuan lewat chat pada jam kerja",
    ],
  },
  {
    nama: "Populer",
    keterangan: "Untuk pernikahan dan aqiqah yang tamunya banyak dan butuh revisi berkali-kali.",
    hargaBulanan: 99000,
    hargaTahunan: 990000,
    palingPopuler: true,
    fitur: [
      "3 undangan aktif",
      "Semua templat bisa dipilih bebas",
      "Bagikan lewat WhatsApp",
      "Revisi data tanpa batas selama aktif",
      "Masa aktif selama langganan berjalan",
      "Prioritas bantuan lewat chat",
    ],
  },
  {
    nama: "Keluarga Besar",
    keterangan: "Untuk yang mengurus beberapa acara sekaligus, termasuk acara kantor.",
    hargaBulanan: 199000,
    hargaTahunan: 1990000,
    palingPopuler: false,
    fitur: [
      "10 undangan aktif",
      "Semua templat bisa dipilih bebas",
      "Bagikan lewat WhatsApp",
      "Revisi data tanpa batas selama aktif",
      "Masa aktif selama langganan berjalan",
      "Bantuan lewat chat dan telepon",
    ],
  },
];

/** Format angka menjadi rupiah, contoh: 99000 menjadi Rp 99.000. */
export function formatRupiah(nilai: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
}
