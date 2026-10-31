import Link from "next/link";
import { daftarJenisAcara } from "@/data/jenisAcara";
import { daftarPertanyaanUmum } from "@/data/pertanyaanUmum";
import { bacaDaftarPaketHarga, bacaDaftarTemplatAktif } from "@/lib/tokoData";
import BagianHarga from "@/komponen/BagianHarga";
import DaftarPertanyaan from "@/komponen/DaftarPertanyaan";
import KartuTemplat from "@/komponen/KartuTemplat";
import PratinjauUndangan from "@/komponen/PratinjauUndangan";

// Halaman landing (server component). Data diambil dari database
// lewat toko admin, bukan dari CMS. Bagian interaktif (harga, FAQ)
// dipisah ke komponen klien.
// WAJIB dinamis: datanya berasal dari SQLite runtime yang berubah lewat
// admin dan seed tanpa rebuild. Kalau halaman ini statis, hasil build
// (yang databasenya masih kosong di builder Docker/Railpack) akan
// membeku dalam keadaan kosong dan tidak pernah menampilkan template
// walaupun database runtime sudah di-seed.
export const dynamic = "force-dynamic";

export default async function Beranda() {
  const daftarTemplat = await bacaDaftarTemplatAktif();
  const daftarPaketHarga = await bacaDaftarPaketHarga();
  const templatUnggulan = daftarTemplat[0];

  return (
    <div className="relative overflow-hidden">
      {/* Cahaya ambient hangat untuk hero, bukan gradasi ungu-biru. */}
      <div aria-hidden="true" className="cahaya-hangat -top-20 left-1/4 h-72 w-72 bg-emas-300/40" />
      <div aria-hidden="true" className="cahaya-hangat top-64 -right-20 h-72 w-72 bg-terakota-500/25" />

      {/* HERO */}
      <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="inline-block rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-tanah-700 ring-1 ring-emas-500/40">
              Untuk pernikahan, aqiqah, wisuda, dan syukuran
            </p>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-[1.1] text-tanah-900 sm:text-5xl lg:text-6xl">
              Kabar bahagia, dibagikan dengan cara yang rapi dan hangat.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-tintaLembut">
              Pilih templat yang kamu suka, isi nama, tanggal, dan lokasi, lalu
              kirim lewat WhatsApp. Tamu membukanya langsung dari ponsel,
              tanpa mengunduh aplikasi apa pun.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/editor" className="tombol-utama bg-tanah-600 text-white hover:bg-tanah-700">
                Buat Undangan Sekarang
              </Link>
              <Link href="/katalog" className="tombol-utama border-2 border-tanah-600 text-tanah-700 hover:bg-krem-100">
                Lihat Semua Template
              </Link>
            </div>
            <p className="mt-4 text-sm text-tintaLembut">
              Coba editor dulu tanpa daftar. Pratinjau langsung berubah saat kamu mengetik.
            </p>
          </div>

          {/* Contoh undangan nyata di hero, bukan tangkapan layar stok. */}
          {templatUnggulan ? (
          <div className="relative">
            <div className="mx-auto max-w-md overflow-hidden rounded-[2rem] shadow-kaca">
              <PratinjauUndangan
                templat={templatUnggulan}
                tampilkanCatatan={false}
                data={{
                  namaPertama: templatUnggulan.contoh.namaPertama,
                  namaKedua: templatUnggulan.contoh.namaKedua,
                  tanggal: templatUnggulan.contoh.tanggal,
                  lokasi: templatUnggulan.contoh.lokasi,
                  fotoUrl: templatUnggulan.fotoSampul ?? `https://picsum.photos/seed/${templatUnggulan.slug}/800/1000`,
                }}
              />
            </div>
            <p className="mt-3 text-center text-sm font-semibold text-tintaLembut">
              Contoh nyata: {templatUnggulan.nama} untuk {templatUnggulan.contoh.judulAcara.toLowerCase()}
            </p>
          </div>
          ) : (
            <p className="text-center text-tintaLembut">Belum ada template aktif. Aktifkan satu template lewat dasbor admin.</p>
          )}
        </div>
      </section>

      {/* JENIS ACARA */}
      <section aria-labelledby="judul-jenis-acara" className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 id="judul-jenis-acara" className="font-serif text-3xl font-bold sm:text-4xl">
          Satu tempat untuk semua acara keluarga
        </h2>
        <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-tintaLembut">
          Kolom editornya sama untuk semua acara, jadi kamu tidak perlu belajar
          ulang tiap kali ada acara baru.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {daftarJenisAcara.map((jenis) => (
            <article key={jenis.nama} className="kartu-kaca rounded-[1.75rem] p-5 sm:p-6">
              <h3 className="font-serif text-xl font-bold">{jenis.nama}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-tintaLembut">{jenis.deskripsi}</p>
              <p className="mt-3 text-sm font-semibold text-tanah-600">{jenis.contohMomen}</p>
            </article>
          ))}
        </div>
        <p className="mt-5 text-sm text-tintaLembut">
          Tidak menemukan acaramu di daftar? Pilih saja templat terdekat, lalu ganti
          judul dan datanya di editor.
        </p>
      </section>

      {/* CARA KERJA */}
      <section aria-labelledby="judul-cara-kerja" className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="kartu-kaca rounded-[2rem] p-6 sm:p-10">
          <h2 id="judul-cara-kerja" className="font-serif text-3xl font-bold sm:text-4xl">
            Tiga langkah, selesai dalam beberapa menit
          </h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            <li>
              <p className="font-serif text-4xl font-bold text-emas-500">1</p>
              <h3 className="mt-2 text-lg font-bold">Pilih templat yang terasa pas</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-tintaLembut">
                Lihat contohnya dulu di katalog. Kalau sudah cocok, buka di editor
                tanpa perlu mendaftar.
              </p>
            </li>
            <li>
              <p className="font-serif text-4xl font-bold text-emas-500">2</p>
              <h3 className="mt-2 text-lg font-bold">Isi nama, tanggal, dan lokasi</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-tintaLembut">
                Tambahkan foto dari perangkatmu kalau mau. Pratinjau di samping
                langsung berubah setiap kamu mengetik.
              </p>
            </li>
            <li>
              <p className="font-serif text-4xl font-bold text-emas-500">3</p>
              <h3 className="mt-2 text-lg font-bold">Bagikan lewat WhatsApp</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-tintaLembut">
                Kirim tautan undangan ke grup keluarga atau satu per satu.
                Tamu cukup mengetuk tautan untuk membukanya.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* GALERI TEMPLATE */}
      <section aria-labelledby="judul-galeri" className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="judul-galeri" className="font-serif text-3xl font-bold sm:text-4xl">Template contoh</h2>
            <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-tintaLembut">
              Tiga gaya yang sengaja dibuat berbeda: lengkung tradisional, hijau
              islami yang teduh, dan tata letak modern yang hangat.
            </p>
          </div>
          <Link href="/katalog" className="min-h-[48px] font-bold text-tanah-600 underline underline-offset-4">
            Buka katalog lengkap
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {daftarTemplat.map((templat) => (
            <KartuTemplat key={templat.slug} templat={templat} />
          ))}
        </div>
      </section>

      {/* HARGA */}
      <section id="harga" aria-labelledby="judul-harga" className="relative mx-auto max-w-6xl scroll-mt-28 px-4 py-14 sm:px-6">
        <h2 id="judul-harga" className="text-center font-serif text-3xl font-bold sm:text-4xl">
          Harga yang jelas dari awal
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-[17px] leading-relaxed text-tintaLembut">
          Tidak ada templat yang dikunci di balik paket mahal. Pilih paket dari
          jumlah undangan dan lama aktifnya saja.
        </p>
        <div className="mt-8">
          <BagianHarga daftar={daftarPaketHarga} />
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="judul-faq" className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h2 id="judul-faq" className="text-center font-serif text-3xl font-bold sm:text-4xl">
          Pertanyaan yang sering ditanyakan
        </h2>
        <div className="mt-8">
          <DaftarPertanyaan daftar={daftarPertanyaanUmum} />
        </div>
      </section>

      {/* PENUTUP */}
      <section className="relative mx-auto max-w-6xl px-4 pb-4 sm:px-6">
        <div className="kartu-kaca-gelap relative overflow-hidden rounded-[2rem] px-6 py-10 text-center sm:px-10">
          <div aria-hidden="true" className="cahaya-hangat -top-10 left-1/3 h-48 w-48 bg-emas-500/40" />
          <h2 className="relative font-serif text-3xl font-bold sm:text-4xl">
            Sudah siap memberi kabar ke keluarga besar?
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-[17px] leading-relaxed text-krem-200">
            Mulai dari contoh akad nikah, aqiqah, atau wisuda di atas, lalu ganti
            dengan datamu sendiri.
          </p>
          <Link href="/editor" className="tombol-utama relative mt-7 bg-emas-500 text-tanah-900 hover:bg-emas-300">
            Buka Editor Sekarang
          </Link>
        </div>
      </section>
    </div>
  );
}
