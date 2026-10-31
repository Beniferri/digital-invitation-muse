import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import FormulirEditor from "@/komponen/FormulirEditor";
import { bacaDaftarTemplatAktif } from "@/lib/tokoData";
import { ambilSesiSaatIni } from "@/lib/sesi";
import { tambahUndanganDariEditor } from "@/lib/aksiPengguna";

// Suspense diperlukan karena editor membaca parameter tautan (?templat=...).
// Dinamis dengan alasan yang sama seperti landing: daftar template harus
// dibaca segar dari database runtime, bukan dari hasil build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editor Undangan — UndanganKita",
  description:
    "Pilih templat, isi nama, tanggal, dan lokasi, lalu simpan undanganmu. Gratis untuk draf; aktifkan dengan paket saat siap dibagikan.",
};

// Pesan galat dari server action simpan (lihat tambahUndanganDariEditor).
// Draf teks pengguna tetap ada di localStorage perangkatnya, jadi ia bisa
// memperbaiki (mis. memilih ulang foto) tanpa mengisi ulang dari nol.
const pesanGalat: Record<string, string> = {
  nama: "Nama pertama wajib diisi.",
  templat: "Template yang dipilih tidak aktif lagi. Pilih template lain.",
  "foto-besar": "Foto terlalu besar, maksimal 5 MB.",
  "foto-tipe": "Foto harus JPG, PNG, atau WebP.",
  "foto-gagal": "Foto gagal diunggah. Coba lagi dengan foto lain.",
  "galeri-besar": "Satu foto galeri terlalu besar, maksimal 5 MB per foto.",
  "galeri-tipe": "Foto galeri harus JPG, PNG, atau WebP.",
  "galeri-gagal": "Satu foto galeri gagal diunggah. Coba lagi dengan foto lain.",
};

export default async function Editor({
  searchParams,
}: {
  searchParams?: { galat?: string };
}) {
  const daftarTemplat = await bacaDaftarTemplatAktif();
  const sesi = await ambilSesiSaatIni();
  const galat = searchParams?.galat ? pesanGalat[searchParams.galat] : undefined;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {sesi ? (
        <Link href="/akun" className="text-sm font-bold text-tanah-600 underline underline-offset-4">
          Kembali ke dasbor saya
        </Link>
      ) : (
        <p className="text-sm font-bold">
          <Link href="/daftar" className="text-tanah-600 underline underline-offset-4">Daftar</Link>
          {" atau "}
          <Link href="/masuk" className="text-tanah-600 underline underline-offset-4">Masuk</Link>
          {" untuk menyimpan undanganmu."}
        </p>
      )}
      <h1 className="mt-4 font-serif text-4xl font-bold sm:text-5xl">Editor Undangan</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-tintaLembut">
        Isi datanya, lihat hasilnya langsung di pratinjau. Tekan Simpan untuk
        menyimpan undangan ke dasbor saya — kalau belum masuk, daftar atau
        masuk dulu dan isianmu tetap ada saat kembali.
      </p>
      {galat && (
        <p role="alert" className="mt-6 rounded-2xl bg-terakota-100 px-4 py-3 text-sm font-bold text-tanah-700">
          {galat}
        </p>
      )}
      <div className="mt-8">
        {daftarTemplat.length === 0 ? (
          <p className="kartu-kaca rounded-[2rem] p-6 text-center text-tintaLembut">
            Belum ada template aktif. Aktifkan satu template lewat dasbor admin dulu.
          </p>
        ) : (
          <Suspense fallback={<p className="text-tintaLembut">Memuat editor…</p>}>
            <FormulirEditor
              daftar={daftarTemplat}
              sudahMasuk={!!sesi}
              aksi={tambahUndanganDariEditor}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
