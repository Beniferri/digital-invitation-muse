// Pembangun CSV RSVP (Tahap 3) — fungsi murni, tanpa database dan tanpa
// Next, supaya bisa dites langsung dan hasilnya selalu sama dengan yang
// ditampilkan dasbor selama sumber daftarnya sama (bacaDaftarRsvp).
// Format: RFC 4180 (sel yang mengandung koma, petik, atau baris baru
// dibungkus petik ganda dan petik di dalamnya digandakan), diawali BOM
// UTF-8 supaya Microsoft Excel membuka nama Indonesia dengan benar.
// Kolom dan label kehadiran disamakan dengan yang tampil di halaman
// detail: Hadir / Masih ragu / Tidak bisa hadir. Urutan baris mengikuti
// urutan daftar yang diberikan (terbaru dulu, sama seperti dasbor).
// Ekspor SELALU berisi semua balasan (bukan yang terfilter di layar),
// supaya jumlah baris CSV sama dengan total balasan di dasbor.

import type { Rsvp } from "./tokoData";

export function labelKehadiran(kehadiran: Rsvp["kehadiran"]): string {
  return kehadiran === "Hadir" ? "Hadir" : kehadiran === "Ragu" ? "Masih ragu" : "Tidak bisa hadir";
}

function selCsv(nilai: string | number): string {
  const teks = String(nilai);
  if (teks.includes(",") || teks.includes('"') || teks.includes("\n") || teks.includes("\r")) {
    return `"${teks.replace(/"/g, '""')}"`;
  }
  return teks;
}

export function bangunCsvRsvp(daftar: Rsvp[]): string {
  const baris = [
    "Nama,Kehadiran,Jumlah Tamu,Pesan,Tanggal Balasan",
    ...daftar.map((rsvp) =>
      [
        selCsv(rsvp.nama),
        selCsv(labelKehadiran(rsvp.kehadiran)),
        selCsv(rsvp.jumlahTamu),
        selCsv(rsvp.pesan),
        selCsv(rsvp.dibuatPada),
      ].join(","),
    ),
  ];
  // BOM UTF-8 eksplisit (U+FEFF) di awal, ditulis sebagai escape supaya
  // tidak hilang kalau berkas dibuka editor yang membersihkan karakter
  // tak terlihat.
  return "\uFEFF" + baris.join("\n") + "\n";
}
