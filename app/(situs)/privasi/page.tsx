// Kebijakan Privasi BETA Storia (Tahap 5). Halaman statis.
// Isinya ditulis sesuai data yang benar-benar dikumpulkan produk ini:
// akun (email, nama, hash kata sandi scrypt), undangan, RSVP, pesanan
// (tanpa nomor kartu — pembayaran ditangani Midtrans), cookie sesi
// httpOnly 8 jam, dan hash IP untuk batas kirim RSVP yang terhapus
// otomatis setelah 1 jam. Tidak ada pelacak iklan atau analitik pihak
// ketiga di situs ini saat halaman ini ditulis.

import type { Metadata } from "next";
import HalamanTeks from "@/komponen/HalamanTeks";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — BETA Storia",
  description:
    "Data apa yang dikumpulkan BETA Storia, untuk apa dipakai, kepada siapa dibagikan, dan hakmu atas datamu.",
};

const judulBagian = "font-serif text-xl font-bold text-tanah-900";

export default function Privasi() {
  return (
    <HalamanTeks judul="Kebijakan Privasi" pembaruan="31 Oktober 2026">
      <p>
        Halaman ini menjelaskan data apa yang dikumpulkan BETA Storia,
        untuk apa dipakai, kepada siapa dibagikan, dan apa yang bisa kamu
        lakukan atas datamu. Prinsipnya sederhana: kami mengumpulkan
        sesedikit mungkin yang dibutuhkan agar undanganmu jalan, tidak
        menjual datamu, dan tidak memasang pelacak iklan.
      </p>

      <section>
        <h2 className={judulBagian}>1. Data yang dikumpulkan</h2>
        <p className="mt-2">
          <strong>Akun:</strong> alamat email, nama, dan kata sandi dalam
          bentuk hash (scrypt) — kata sandi aslimu tidak pernah disimpan
          dan tidak bisa dibaca kembali, termasuk oleh pengelola.
          <strong> Undangan:</strong> nama, jenis acara, tanggal, lokasi,
          templat yang dipilih, status, dan foto yang kamu unggah
          (maksimal 5 MB, JPG/PNG/WebP).
          <strong> RSVP:</strong> nama tamu, kehadiran, jumlah tamu, dan
          pesan atau doa yang ditulis tamu.
          <strong> Pesanan:</strong> paket, periode, nominal, status,
          dan jenis metode pembayaran dari Midtrans — bukan nomor kartu
          atau rekening, yang sepenuhnya ditangani Midtrans.
          <strong> Teknis:</strong> cookie sesi login (httpOnly,
          kedaluwarsa 8 jam) dan hash alamat IP untuk batas kirim RSVP
          (maksimal 20 kiriman per jam per IP per undangan), yang
          terhapus otomatis setelah 1 jam. Alamat IP mentah tidak pernah
          disimpan.
        </p>
      </section>

      <section>
        <h2 className={judulBagian}>2. Untuk apa data dipakai</h2>
        <p className="mt-2">
          Data dipakai hanya untuk menjalankan layanan: menampilkan
          undanganmu ke tamu, mencatat dan menampilkan RSVP di dasbor
          pemilik undangan, mengekspor RSVP ke CSV atas permintaan
          pemilik, menegakkan batas paket dan masa aktif, memproses
          pesanan lewat Midtrans, serta menahan spam RSVP. Data tidak
          dipakai untuk iklan dan tidak dibagikan untuk keperluan
          pemasaran pihak lain.
        </p>
      </section>

      <section>
        <h2 className={judulBagian}>3. Yang perlu kamu ketahui soal pesan tamu</h2>
        <p className="mt-2">
          Pesan atau doa yang ditulis tamu di formulir RSVP ditampilkan
          di halaman undangan dan bisa dibaca siapa pun yang memegang
          tautan tamu. Jangan menulis nomor telepon, alamat, atau
          informasi pribadi sensitif lainnya di kolom pesan. Sebagai
          pemilik undangan, kamu bisa menghapus balasan RSVP apa pun dari
          dasbormu.
        </p>
      </section>

      <section>
        <h2 className={judulBagian}>4. Pihak ketiga</h2>
        <p className="mt-2">
          Hanya dua pihak ketiga yang terlibat: Midtrans (memproses
          pembayaran; data pembayaranmu tunduk pada kebijakan privasi
          Midtrans) dan penyedia server tempat aplikasi ini berjalan.
          Tidak ada pelacak iklan, tidak ada analitik pihak ketiga, dan
          tidak ada penjualan data ke siapa pun saat kebijakan ini
          ditulis. Kalau hal ini berubah, halaman ini akan diperbarui
          lebih dulu.
        </p>
      </section>

      <section>
        <h2 className={judulBagian}>5. Penyimpanan dan keamanan</h2>
        <p className="mt-2">
          Data disimpan di database server aplikasi, dengan cadangan
          berkala di server yang sama. Kata sandi di-hash dengan scrypt,
          sesi login memakai cookie httpOnly yang tidak bisa dibaca
          JavaScript di peramban, dan halaman akun serta admin hanya bisa
          dibuka setelah masuk. Tidak ada sistem yang sepenuhnya kebal
          — kalau kamu menduga akunmu disalahgunakan, segera ganti kata
          sandi dan hubungi dukungan lewat halaman Bantuan.
        </p>
      </section>

      <section>
        <h2 className={judulBagian}>6. Hakmu atas datamu</h2>
        <p className="mt-2">
          Kamu bisa menghapus undanganmu sendiri dan balasan RSVP di
          dalamnya lewat dasbor. Data undangan yang sudah disimpan saat
          ini belum bisa diubah — kalau ada kesalahan, hapus undangan
          itu dan buat ulang. Untuk penghapusan akun beserta seluruh
          datanya, sampaikan permintaan lewat kontak dukungan di halaman
          Bantuan (prosesnya manual lewat pengelola). Data yang sudah
          dihapus dari dasbor tidak muncul lagi di situs; salinan di
          cadangan database akan hilang mengikuti rotasi cadangan.
        </p>
      </section>

      <section>
        <h2 className={judulBagian}>7. Cookie</h2>
        <p className="mt-2">
          Satu-satunya cookie yang dipakai situs ini adalah cookie sesi
          login (untuk mengingat kamu sudah masuk, selama 8 jam). Tidak
          ada cookie pelacak, cookie iklan, atau cookie analitik.
        </p>
      </section>

      <section>
        <h2 className={judulBagian}>8. Perubahan dan kontak</h2>
        <p className="mt-2">
          Kebijakan ini bisa berubah mengikuti perubahan fitur, dan
          perubahan berlaku sejak tanggal pembaruan di atas. Pertanyaan
          soal data pribadimu bisa disampaikan lewat kontak dukungan di
          halaman Bantuan.
        </p>
      </section>
    </HalamanTeks>
  );
}
