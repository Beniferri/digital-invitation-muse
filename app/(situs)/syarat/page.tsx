// Syarat & Ketentuan BETA Storia (Tahap 5). Halaman statis — tidak
// membaca database, jadi aman diprerender saat build.
// Isinya ditulis sesuai perilaku produk yang sebenarnya (bukan templat
// generik): Draft gratis, Aktif butuh langganan, langganan baru
// menggantikan yang lama, pembayaran lewat Midtrans, pengembalian dana
// manual. Kalau perilaku produk berubah, halaman ini wajib diperbarui
// bersamaan dengan kodenya.

import type { Metadata } from "next";
import HalamanTeks from "@/komponen/HalamanTeks";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan — BETA Storia",
  description:
    "Syarat penggunaan BETA Storia: akun, undangan, paket dan masa aktif, pembayaran lewat Midtrans, serta pengembalian dana.",
};

const judulBagian = "font-serif text-xl font-bold text-tanah-900";

export default function Syarat() {
  return (
    <HalamanTeks judul="Syarat & Ketentuan" pembaruan="31 Oktober 2026">
      <p>
        Dengan membuat akun atau memakai BETA Storia, kamu menyetujui
        syarat di halaman ini. BETA Storia adalah layanan undangan digital:
        kamu memilih templat, mengisi data acara, membagikan tautan tamu,
        dan menerima konfirmasi kehadiran (RSVP) dari tamu.
      </p>

      <section>
        <h2 className={judulBagian}>1. Akun</h2>
        <p className="mt-2">
          Satu alamat email hanya untuk satu akun. Kamu bertanggung jawab
          menjaga kerahasiaan kata sandimu dan atas semua aktivitas yang
          terjadi lewat akunmu. Kata sandi tidak pernah disimpan dalam
          bentuk yang bisa dibaca — yang disimpan hanya hasil hash-nya.
          BETA Storia boleh menonaktifkan akun yang dipakai untuk
          menyalahgunakan layanan (misalnya mengirim spam RSVP, mengunggah
          konten yang melanggar hukum, atau mencoba merusak sistem).
        </p>
      </section>

      <section>
        <h2 className={judulBagian}>2. Undangan dan kontenmu</h2>
        <p className="mt-2">
          Undangan berstatus Draft gratis dan tidak bisa dibuka tamu.
          Undangan berstatus Aktif bisa dibuka lewat tautan tamu dan
          menerima RSVP; undangan berstatus Selesai masih bisa dilihat
          tamu, tapi formulir RSVP-nya sudah ditutup. Data undangan yang
          sudah disimpan (nama, tanggal, lokasi, foto) saat ini belum
          bisa diubah — kalau ada kesalahan, hapus undangan itu dan buat
          ulang selama slot paketmu masih tersedia. Kamu bertanggung
          jawab atas foto dan data yang kamu unggah: pastikan kamu punya
          hak atas foto tersebut dan isinya tidak melanggar hukum,
          menipu, atau merugikan pihak lain. Undangan yang melanggar
          aturan ini boleh dinonaktifkan tanpa pemberitahuan sebelumnya.
        </p>
      </section>

      <section>
        <h2 className={judulBagian}>3. Paket dan masa aktif</h2>
        <p className="mt-2">
          Paket yang tersedia saat ini: Hemat (1 undangan aktif,
          Rp&nbsp;49.000/bulan atau Rp&nbsp;490.000/tahun), Populer
          (3 undangan aktif, Rp&nbsp;99.000/bulan atau
          Rp&nbsp;990.000/tahun), dan Keluarga Besar (10 undangan aktif,
          Rp&nbsp;199.000/bulan atau Rp&nbsp;1.990.000/tahun). Semua
          templat bisa dipilih di paket apa pun — paket hanya membedakan
          jumlah undangan aktif dan lama masa aktif, bukan pilihan
          desainnya. Masa aktif mengikuti periode bayar: paket bulanan
          aktif 30 hari, paket tahunan aktif 1 tahun. Membeli langganan
          baru akan menggantikan langganan lama yang masih aktif (masa
          aktif tidak ditumpuk). Kalau langganan berakhir, undangan Aktif
          milikmu otomatis menjadi Selesai: tamu tetap bisa melihatnya,
          tapi RSVP sudah ditutup. Harga untuk pembelian baru bisa berubah
          sewaktu-waktu; langganan yang sudah dibeli tetap memakai
          ketentuan saat pembelian sampai masa aktifnya habis.
        </p>
      </section>

      <section>
        <h2 className={judulBagian}>4. Pembayaran dan pengembalian dana</h2>
        <p className="mt-2">
          Pembayaran diproses oleh Midtrans. BETA Storia tidak pernah
          menerima atau menyimpan nomor kartu atau rekeningmu — data
          pembayaran sepenuhnya ditangani Midtrans. Status pesanan
          ditentukan dari pemberitahuan resmi Midtrans: pesanan baru
          dianggap lunas kalau Midtrans menyatakan pembayaran berhasil.
          Kalau pesananmu masih berstatus Menunggu setelah kamu membayar,
          tunggu beberapa menit lalu periksa halaman pembayaranmu — ada
          tombol untuk melanjutkan atau membuat ulang pembayaran.
          Pengembalian dana tidak otomatis: ajukan lewat kontak dukungan
          di halaman Bantuan, dan setiap pengajuan diproses manual serta
          diputuskan per kasus. Pembayaran yang kedaluwarsa, dibatalkan,
          atau ditolak tidak mengaktifkan langganan.
        </p>
      </section>

      <section>
        <h2 className={judulBagian}>5. RSVP dan data tamu</h2>
        <p className="mt-2">
          Tamu mengisi nama, kehadiran, jumlah tamu (maksimal 10 orang
          per balasan), dan pesan atau doa. Pesan tamu ditampilkan di
          halaman undangan dan bisa dilihat siapa pun yang memegang
          tautan tamu — jadi jangan menulis informasi pribadi yang
          sensitif di kolom pesan. Sebagai pemilik undangan, kamu bisa
          melihat, menyaring, mengunduh (CSV), dan menghapus balasan RSVP
          dari dasbormu.
        </p>
      </section>

      <section>
        <h2 className={judulBagian}>6. Perubahan dan batas tanggung jawab</h2>
        <p className="mt-2">
          BETA Storia masih dalam pengembangan aktif: fitur, harga, dan
          syarat ini bisa berubah, dan perubahan berlaku sejak tanggal
          pembaruan di atas. Pemakaian lanjutan setelah perubahan berarti
          kamu menyetujui syarat yang baru. Layanan diberikan sebagaimana
          adanya; BETA Storia tidak bertanggung jawab atas tamu yang
          tidak datang, kesalahan data yang kamu isi sendiri, atau
          gangguan dari pihak ketiga (misalnya jaringan atau layanan
          pembayaran). Kalau ada bagian syarat ini yang tidak bisa
          diberlakukan, bagian lainnya tetap berlaku.
        </p>
      </section>

      <section>
        <h2 className={judulBagian}>7. Kontak</h2>
        <p className="mt-2">
          Pertanyaan soal syarat ini, akun, atau pembayaran bisa
          disampaikan lewat kontak dukungan di halaman Bantuan.
        </p>
      </section>
    </HalamanTeks>
  );
}
