// Pusat Bantuan UndanganKita (Tahap 5). Halaman ini SENGAJA dinamis
// (force-dynamic), bukan diprerender: bagian Kontak membaca environment
// DUKUNGAN_EMAIL / DUKUNGAN_WHATSAPP_URL yang dipasang di server
// produksi (Coolify), dan nilai itu harus dibaca saat request, bukan
// saat build. Kalau kedua variabel belum dipasang, halaman menampilkan
// pemberitahuan jujur bahwa kontak dukungan belum diumumkan — dan itu
// adalah item yang memblokir pengumuman di DAFTAR-PELUNCURAN.md, bukan
// sesuatu yang boleh lolos diam-diam.

import type { Metadata } from "next";
import HalamanTeks from "@/komponen/HalamanTeks";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bantuan — UndanganKita",
  description:
    "Cara membuat dan membagikan undangan, RSVP, paket dan masa aktif, pembayaran, serta solusi masalah umum di UndanganKita.",
};

const judulBagian = "font-serif text-xl font-bold text-tanah-900";

function KontakDukungan() {
  const email = process.env.DUKUNGAN_EMAIL?.trim();
  const whatsapp = process.env.DUKUNGAN_WHATSAPP_URL?.trim();
  if (!email && !whatsapp) {
    return (
      <p className="mt-2 rounded-2xl border border-tanah-900/15 bg-krem-100 px-4 py-3">
        Kontak dukungan belum diumumkan. Halaman ini akan diperbarui
        dengan alamat email atau WhatsApp dukungan saat peluncuran resmi.
      </p>
    );
  }
  return (
    <div className="mt-2 flex flex-wrap gap-3">
      {email && (
        <a href={`mailto:${email}`} className="tombol-utama bg-tanah-600 px-4 py-2 text-sm text-white hover:bg-tanah-700">
          Email: {email}
        </a>
      )}
      {whatsapp && (
        <a href={whatsapp} target="_blank" rel="noreferrer" className="tombol-utama bg-tanah-600 px-4 py-2 text-sm text-white hover:bg-tanah-700">
          WhatsApp Dukungan
        </a>
      )}
    </div>
  );
}

export default function Bantuan() {
  return (
    <HalamanTeks judul="Bantuan" pembaruan="31 Oktober 2026">
      <p>
        Semua yang perlu kamu ketahui untuk memakai UndanganKita — dari
        membuat undangan pertama sampai mengatasi kendala yang paling
        sering terjadi. Kalau jawabanmu tidak ada di sini, hubungi
        dukungan di bagian bawah halaman.
      </p>

      <section>
        <h2 className={judulBagian}>Membuat undangan</h2>
        <p className="mt-2">
          Buka Editor, pilih templat, isi nama, tanggal, dan lokasi, lalu
          tekan Simpan. Kalau kamu belum masuk, kamu akan diminta masuk
          atau daftar dulu — draf teksmu tersimpan di peramban selama
          itu, tapi foto harus dipilih ulang setelah masuk. Undangan
          yang tersimpan selalu berstatus Draft: gratis, dan belum bisa
          dibuka tamu. Supaya bisa dibagikan, beli paket di halaman
          Paket, lalu ubah status undangan menjadi Aktif dari dasbor.
        </p>
      </section>

      <section>
        <h2 className={judulBagian}>Membagikan undangan ke tamu</h2>
        <p className="mt-2">
          Dari halaman undangan Aktif, pakai tombol bagikan WhatsApp atau
          salin tautan, lalu kirim ke tamu. Tamu cukup mengetuk tautan
          — undangan terbuka langsung di peramban ponsel, tanpa perlu
          mengunduh aplikasi atau membuat akun. Tautan tamu berbentuk
          /u/kode-pendek dan hanya berlaku untuk undangan itu.
        </p>
      </section>

      <section>
        <h2 className={judulBagian}>RSVP untuk tamu</h2>
        <p className="mt-2">
          Tamu mengisi nama, memilih Hadir, Masih ragu, atau Tidak bisa
          hadir, mengisi jumlah tamu (maksimal 10 orang per balasan,
          termasuk yang mengisi), dan boleh menulis pesan atau doa.
          Kalau sudah pernah mengisi, kirim ulang saja dengan nama yang
          sama untuk memperbarui jawaban — balasan lama diperbarui, bukan
          mengganda. Pesan yang dikirim akan tampil di halaman undangan
          dan bisa dibaca siapa pun yang memegang tautan, jadi jangan
          menulis informasi pribadi yang sensitif di sana. Tamu yang
          memilih Tidak bisa hadir tidak menyumbang hitungan tamu.
        </p>
      </section>

      <section>
        <h2 className={judulBagian}>Paket, slot, dan masa aktif</h2>
        <p className="mt-2">
          Hemat: 1 undangan aktif. Populer: 3 undangan aktif. Keluarga
          Besar: 10 undangan aktif. Semua templat bisa dipilih di paket
          apa pun. Masa aktif mengikuti periode bayar: bulanan 30 hari,
          tahunan 1 tahun. Membeli langganan baru menggantikan langganan
          lama (masa aktif tidak ditumpuk). Kalau langganan berakhir,
          undangan Aktif otomatis menjadi Selesai: tamu tetap bisa
          melihatnya, tapi RSVP sudah ditutup. Undangan Draft tidak
          memakai slot dan selalu gratis.
        </p>
      </section>

      <section>
        <h2 className={judulBagian}>Pembayaran</h2>
        <p className="mt-2">
          Pilih paket di halaman Paket, lalu bayar lewat Midtrans dengan
          metode yang tersedia di sana. UndanganKita tidak pernah
          menerima nomor kartu atau rekeningmu. Setelah membayar,
          tunggu beberapa menit: status pesanan berubah menjadi Lunas
          begitu pemberitahuan resmi Midtrans diterima, dan langgananmu
          langsung aktif. Kalau pesanan masih Menunggu, buka halaman
          pembayaran itu dari Riwayat Pembayaran di dasbor — ada tombol
          untuk melanjutkan atau membuat ulang pembayaran. Pengembalian
          dana diajukan lewat kontak dukungan dan diproses manual per
          kasus (tidak otomatis).
        </p>
      </section>

      <section>
        <h2 className={judulBagian}>Mengelola undangan dan RSVP</h2>
        <p className="mt-2">
          Dari dasbor, kamu bisa mengubah status undangan (Draft, Aktif,
          Selesai), menghapus undangan, dan membuka detail RSVP: ringkasan
          jumlah balasan dan tamu, filter per kehadiran (Hadir, Masih
          ragu, Tidak bisa hadir), sorotan tamu yang akan datang, dan
          tombol Unduh CSV. Perlu diingat: CSV selalu berisi semua
          balasan, bukan hanya yang sedang terfilter, supaya angkanya
          sama persis dengan yang tampil di dasbor. Foto undangan
          maksimal 5 MB dengan format JPG, PNG, atau WebP.
        </p>
      </section>

      <section>
        <h2 className={judulBagian}>Masalah umum</h2>
        <p className="mt-2">
          <strong>Tautan tamu menampilkan halaman tidak ditemukan:</strong>{" "}
          undangan itu mungkin masih Draft — hanya undangan Aktif yang
          bisa dibuka tamu.
          <br />
          <strong>Formulir RSVP sudah tidak bisa diisi:</strong> undangan
          itu sudah Selesai (masa aktif habis atau pemilik menutupnya).
          <br />
          <strong>RSVP ditolak karena terlalu cepat atau terlalu banyak
          percobaan:</strong> tunggu sebentar (untuk batas per jam,
          tunggu sampai satu jam berlalu) lalu coba lagi. Ini pengaman
          spam, bukan galat di undanganmu.
          <br />
          <strong>Diminta masuk berulang kali:</strong> sesi login
          berlaku 8 jam; setelah itu kamu perlu masuk ulang. Itu normal.
          <br />
          <strong>Sudah bayar tapi langganan belum aktif:</strong>{" "}
          periksa status pesanan di Riwayat Pembayaran. Kalau sudah
          Lunas tapi langganan tidak muncul, atau pesanan macet di
          Menunggu lebih dari satu jam, hubungi dukungan dengan
          menyebutkan tanggal bayar dan nominalnya.
          <br />
          <strong>Data undangan salah ketik:</strong> data yang sudah
          disimpan belum bisa diubah. Hapus undangan itu dan buat ulang
          selama slot paketmu masih tersedia.
        </p>
      </section>

      <section>
        <h2 className={judulBagian}>Kontak dukungan</h2>
        <KontakDukungan />
        <p className="mt-3 text-sm text-tintaLembut">
          Saat menghubungi dukungan soal pembayaran, sebutkan tanggal
          bayar, nominal, dan paket yang dibeli supaya bisa dilacak
          lebih cepat. Syarat lengkap ada di halaman Syarat &amp;
          Ketentuan, dan penjelasan data ada di Kebijakan Privasi.
        </p>
      </section>
    </HalamanTeks>
  );
}
