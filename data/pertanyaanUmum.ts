// Pertanyaan yang paling sering ditanyakan calon pengguna non-teknis.
// Jawabannya singkat, sesuai perilaku produk saat ini, dan tanpa janji
// berlebihan. Kalau perilaku produk berubah, jawaban di sini wajib
// diperbarui bersamaan (lihat juga halaman Bantuan untuk panduan lengkap).

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
      "Belum bisa. Nama, tanggal, lokasi, dan foto yang sudah disimpan belum bisa diubah — yang bisa diubah dari dasbor adalah status undangan (Draft, Aktif, Selesai) dan menghapus undangan. Kalau ada kesalahan ketik, hapus undangan itu dan buat ulang selama slot paketmu masih tersedia.",
  },
  {
    pertanyaan: "Apakah ada biaya tersembunyi di luar harga paket?",
    jawaban:
      "Tidak. Harga yang tertera adalah harga yang kamu bayar untuk paket itu. Pembayaran diproses lewat Midtrans, dan UndanganKita tidak menambahkan biaya lain di luar harga paket.",
  },
];
