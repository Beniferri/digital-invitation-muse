// Kumpulan fungsi bantu yang murni: format tanggal dan pesan berbagi.
// Tidak ada penyimpanan, tidak ada panggilan jaringan di sini.

/** Mengubah tanggal ISO (yyyy-mm-dd) menjadi kalimat Indonesia yang lengkap. */
export function formatTanggalIndonesia(tanggalIso: string): string {
  if (!tanggalIso) return "Tanggal menyusul";
  const tanggal = new Date(`${tanggalIso}T00:00:00`);
  if (Number.isNaN(tanggal.getTime())) return tanggalIso;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(tanggal);
}

/**
 * Pesan WhatsApp yang sudah terisi untuk satu undangan, dengan tautan
 * absolut yang diberikan pemanggil (mis. dari header host saat request).
 * Tautan tidak lagi ditulis keras ke domain contoh — domain contoh itu
 * tidak pernah ada, jadi pesan lama mengirim tamu ke tautan mati.
 */
export function buatPesanBagikanUndangan(
  judulAcara: string,
  namaPertama: string,
  namaKedua: string,
  tanggalIso: string,
  lokasi: string,
  tautan: string,
): string {
  const nama = namaKedua
    ? `${namaPertama} dan ${namaKedua}`
    : namaPertama;
  const tanggal = formatTanggalIndonesia(tanggalIso);
  return (
    `Hai, kami mengundangmu ke ${judulAcara} ${nama} ` +
    `pada ${tanggal} di ${lokasi}. ` +
    `Yuk, lihat undangan lengkapnya di sini: ${tautan} ` +
    `Ditunggu kehadiran dan doanya ya, terima kasih!`
  );
}


/** Tautan WhatsApp dengan pesan yang sudah dikodekan. */
export function buatTautanWhatsApp(pesan: string): string {
  return `https://wa.me/?text=${encodeURIComponent(pesan)}`;
}
