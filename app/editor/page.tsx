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
  title: "Editor Undangan — BETA Storia",
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
  // Shell tiga kolom dirender penuh oleh FormulirEditor (header aplikasi
  // + sidebar + formulir + pratinjau) — halaman ini tidak membungkusnya
  // dengan judul/deskripsi lagi, supaya tidak ada ganda dengan header
  // editor. Galat simpan diteruskan ke panel tengah.
  if (daftarTemplat.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="kartu-kaca rounded-[2rem] p-6 text-center text-tintaLembut">
          Belum ada template aktif. Aktifkan satu template lewat dasbor admin dulu.
        </p>
      </div>
    );
  }
  return (
    <Suspense fallback={<p className="p-6 text-tintaLembut">Memuat editor…</p>}>
      <FormulirEditor
        daftar={daftarTemplat}
        sudahMasuk={!!sesi}
        aksi={tambahUndanganDariEditor}
        galat={galat}
      />
    </Suspense>
  );
}
