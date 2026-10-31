// Data statis templat. Struktur ini sengaja rapi dan terpisah dari tampilan,
// supaya nanti mudah diganti sumber datanya tanpa mengubah komponen.

// Jenis acara yang dilayani. Satu templat bisa dipakai untuk acara apa pun
// di editor, tapi katalog memakai kolom ini sebagai filter awal.
export type JenisAcara =
  | "Pernikahan"
  | "Khitanan"
  | "Aqiqah"
  | "Ulang Tahun"
  | "Wisuda"
  | "Syukuran"
  | "Perusahaan";

export type NuansaTemplat =
  | "Tradisional"
  | "Modern"
  | "Minimalis"
  | "Islami";

export type BentukKartu = "lengkung-atas" | "kotak-bulat" | "asimetris";

export interface ContohUndangan {
  judulAcara: string;
  namaPertama: string;
  namaKedua: string;
  tanggal: string; // Format ISO yyyy-mm-dd, contoh: 2027-03-14
  lokasi: string;
  salamPembuka: string;
  kutipan: string;
  catatan: string;
}

export interface Templat {
  slug: string;
  nama: string;
  jenisAcara: JenisAcara;
  warna: "Emas" | "Hijau" | "Terakota";
  nuansa: NuansaTemplat;
  deskripsi: string;
  // Dipakai dasbor admin: templat nonaktif disembunyikan dari situs publik.
  aktif: boolean;
  // Kalau true, halaman tamu memakai perender halaman penuh (Zamrud),
  // bukan kartu pratinjau biasa. Disimpan di kolom templat.halaman_penuh.
  halamanPenuh: boolean;
  // Jalur foto sampul dari penyimpanan (misalnya /unggahan/xxx.jpg).
  // Kosong berarti pakai foto placeholder seperti sebelumnya.
  fotoSampul?: string | null;
  // Variasi visual tiap templat: latar, cahaya, bentuk kartu, dan pola.
  gaya: {
    latar: string;
    kartu: string;
    aksen: string;
    aksenLembut: string;
    bentuk: BentukKartu;
    pola: "parang" | "melati" | "garis";
  };
  contoh: ContohUndangan;
}

export const daftarTemplat: Templat[] = [
  {
    slug: "seruni-akad-nikah",
    nama: "Seruni",
    jenisAcara: "Pernikahan",
    warna: "Emas",
    nuansa: "Tradisional",
    aktif: true,
    halamanPenuh: false,
    deskripsi:
      "Untuk akad nikah dan resepsi yang hangat dan khidmat. Lengkung atasnya mengingatkan pada gerbang pendopo, dengan garis parang yang halus di pinggir kartu.",
    gaya: {
      latar: "bg-krem-100",
      kartu: "rounded-t-[10rem] rounded-b-[2rem]",
      aksen: "text-emas-600",
      aksenLembut: "bg-emas-300/40",
      bentuk: "lengkung-atas",
      pola: "parang",
    },
    contoh: {
      judulAcara: "Akad Nikah dan Resepsi",
      namaPertama: "Nadia Ayu Prameswari",
      namaKedua: "Arka Pradana Wijaya",
      tanggal: "2027-03-14",
      lokasi: "Pendopo Seruni, Sleman, Yogyakarta",
      salamPembuka:
        "Dengan penuh syukur dan doa dari kedua keluarga, kami mengundang Bapak, Ibu, dan Saudara/i tercinta untuk hadir dan mendoakan kami.",
      kutipan:
        "Dua keluarga, satu doa yang sama: semoga rumah tangga ini selalu dijaga dalam kebaikan.",
      catatan:
        "Kehadiranmu sudah jadi hadiah. Kalau mau memberi doa lewat bingkisan, kabari kami dulu ya.",
    },
  },
  {
    slug: "melati-aqiqah",
    nama: "Melati",
    jenisAcara: "Aqiqah",
    warna: "Hijau",
    nuansa: "Islami",
    aktif: true,
    halamanPenuh: false,
    deskripsi:
      "Untuk aqiqah dan syukuran kelahiran yang lembut dan teduh. Kartu kacanya dibingkai bunga melati kecil, dengan hijau sage yang menenangkan mata.",
    gaya: {
      latar: "bg-daun-100",
      kartu: "rounded-[2.5rem]",
      aksen: "text-daun-700",
      aksenLembut: "bg-daun-100",
      bentuk: "kotak-bulat",
      pola: "melati",
    },
    contoh: {
      judulAcara: "Aqiqah dan Syukuran",
      namaPertama: "Bilqis Zahra Putri",
      namaKedua: "Putri dari Ahmad dan Siti Rahmawati",
      tanggal: "2026-11-22",
      lokasi: "Rumah Keluarga, Bandung",
      salamPembuka:
        "Alhamdulillah, putri kecil kami sudah lahir dengan sehat. Kami mengundang keluarga dan sahabat untuk ikut mendoakan dan merayakan bersama.",
      kutipan:
        "Semoga Bilqis tumbuh jadi anak yang sehat, salehah, dan membawa berkah untuk banyak orang.",
      catatan:
        "Acara digelar santai di rumah. Datang dengan pakaian yang nyaman saja, yang penting silaturahmi.",
    },
  },
  {
    slug: "kala-wisuda",
    nama: "Kala Senja",
    jenisAcara: "Wisuda",
    warna: "Terakota",
    nuansa: "Modern",
    aktif: true,
    halamanPenuh: false,
    deskripsi:
      "Untuk syukuran wisuda dan ulang tahun yang ceria tapi tetap rapi. Tata letaknya asimetris, cahayanya hangat seperti sore hari, dan teksnya mudah dibaca.",
    gaya: {
      latar: "bg-terakota-100",
      kartu: "rounded-[1.75rem]",
      aksen: "text-terakota-600",
      aksenLembut: "bg-terakota-100",
      bentuk: "asimetris",
      pola: "garis",
    },
    contoh: {
      judulAcara: "Syukuran Wisuda",
      namaPertama: "Raisa Prameswari, S.T.",
      namaKedua: "",
      tanggal: "2026-12-12",
      lokasi: "Balai Serbaguna Kampus, Jakarta Selatan",
      salamPembuka:
        "Akhirnya sampai juga di garis akhir kuliah ini. Terima kasih untuk semua yang sudah menemani, dan yuk rayakan bareng di acara syukuran ini.",
      kutipan:
        "Gelar boleh selesai, tapi belajar dan silaturahmi jangan sampai berhenti di sini.",
      catatan:
        "Ada makan siang bersama setelah prosesi. Boleh ajak satu teman atau anggota keluarga.",
    },
  },
  {
    slug: "zamrud-pernikahan",
    nama: "Zamrud",
    jenisAcara: "Pernikahan",
    warna: "Hijau",
    nuansa: "Islami",
    aktif: true,
    halamanPenuh: true,
    fotoSampul: "/templat/zamrud/masjid.jpg",
    deskripsi:
      "Undangan pernikahan halaman penuh bernuansa islami: sampul pembuka dengan musik, panel hero yang tetap di desktop, hitung mundur live, galeri dengan lightbox, dan RSVP — dalam palet hijau zamrud, krem, dan emas.",
    gaya: {
      latar: "bg-emerald-950",
      kartu: "rounded-[2rem]",
      aksen: "text-emas-300",
      aksenLembut: "bg-emas-300/20",
      bentuk: "kotak-bulat",
      pola: "garis",
    },
    contoh: {
      judulAcara: "Akad Nikah dan Resepsi",
      namaPertama: "Aisyah Putri Maharani",
      namaKedua: "Raka Aditya Pratama",
      tanggal: "2027-02-20",
      lokasi: "Masjid Agung, Yogyakarta",
      salamPembuka:
        "Dengan penuh syukur dan doa dari kedua keluarga, kami mengundang Bapak, Ibu, dan Saudara/i tercinta untuk hadir dan mendoakan kami.",
      kutipan:
        "Semoga pernikahan ini menjadi awal dari keluarga yang penuh ketenangan, kasih sayang, dan keberkahan.",
      catatan:
        "Kehadiranmu sudah jadi hadiah. Kalau mau memberi doa lewat bingkisan, kabari kami dulu ya.",
    },
  },
];

/** Mencari satu templat berdasarkan slug dari route dinamis. */
export function cariTemplatBerdasarkanSlug(slug: string): Templat | undefined {
  return daftarTemplat.find((templat) => templat.slug === slug);
}
