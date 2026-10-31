// Pertanyaan yang paling sering ditanyakan calon pengguna non-teknis.
// Jawabannya singkat, jujur soal batas MVP, dan tanpa janji berlebihan.

export interface PertanyaanUmum {
  pertanyaan: string;
  jawaban: string;
}

export const daftarPertanyaanUmum: PertanyaanUmum[] = [
  {
    pertanyaan: "Saya tidak paham teknologi, apakah bisa membuat undangan sendiri?",
    jawaban:
      "Bisa. Kamu hanya perlu memilih templat, mengisi nama, tanggal, dan lokasi, lalu membagikan tautannya lewat WhatsApp. Tidak perlu memasang aplikasi tambahan dan tidak perlu mengerti soal desain.",
  },
  {
    pertanyaan: "Apakah templat tertentu hanya bisa dipakai di paket mahal?",
    jawaban:
      "Tidak. Semua templat bisa dipilih bebas di paket apa pun. Paket hanya membedakan jumlah undangan aktif dan lama masa aktifnya, bukan pilihan desainnya.",
  },
  {
    pertanyaan: "Bagaimana cara tamu membuka undangan saya?",
    jawaban:
      "Tamu cukup mengetuk tautan yang kamu kirim lewat WhatsApp. Undangan terbuka langsung di peramban ponsel, tanpa perlu mengunduh aplikasi atau membuat akun.",
  },
  {
    pertanyaan: "Bisakah saya mengganti foto dan data setelah undangan dibagikan?",
    jawaban:
      "Di editor demo ini, perubahan hanya terlihat sebagai pratinjau dan akan hilang kalau halaman dimuat ulang. Pada versi lengkapnya, perubahan di paket Populer dan Keluarga Besar bisa dilakukan tanpa batas selama masa aktif.",
  },
  {
    pertanyaan: "Apakah ada biaya tersembunyi di luar harga paket?",
    jawaban:
      "Tidak. Harga yang tertera adalah harga paketnya. Pada prototipe ini belum ada pembayaran sungguhan, jadi tombol harga mengarahkanmu ke editor untuk mencoba dulu.",
  },
];
