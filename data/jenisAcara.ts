// Daftar jenis acara untuk bagian landing. Deskripsinya spesifik,
// menyebut momen nyata (akad, siraman, aqiqah) bukan kalimat generik.

export interface JenisAcaraTampil {
  nama: string;
  deskripsi: string;
  contohMomen: string;
}

export const daftarJenisAcara: JenisAcaraTampil[] = [
  {
    nama: "Pernikahan",
    deskripsi: "Akad nikah, resepsi, sampai siraman dan pengajian sebelum hari H.",
    contohMomen: "Contoh: akad pagi, resepsi sore",
  },
  {
    nama: "Khitanan",
    deskripsi: "Syukuran khitan anak dengan susunan acara yang jelas untuk keluarga besar.",
    contohMomen: "Contoh: prosesi pagi, makan bersama siang",
  },
  {
    nama: "Aqiqah",
    deskripsi: "Syukuran kelahiran, doa bersama, dan pembagian bingkisan untuk tetangga.",
    contohMomen: "Contoh: aqiqah hari ketujuh",
  },
  {
    nama: "Ulang Tahun",
    deskripsi: "Dari ulang tahun anak sampai perayaan lima puluh tahun orang tua.",
    contohMomen: "Contoh: tiup lilin, potong tumpeng",
  },
  {
    nama: "Wisuda",
    deskripsi: "Syukuran kelulusan untuk keluarga, dosen, dan sahabat seperjuangan.",
    contohMomen: "Contoh: prosesi, foto bersama, makan siang",
  },
  {
    nama: "Syukuran",
    deskripsi: "Rumah baru, usaha baru, atau kesembuhan, dirayakan dengan doa bersama.",
    contohMomen: "Contoh: pengajian dan makan bersama",
  },
  {
    nama: "Perusahaan",
    deskripsi: "Peresmian kantor, ulang tahun perusahaan, dan gathering karyawan.",
    contohMomen: "Contoh: sambutan direksi, ramah tamah",
  },
];
