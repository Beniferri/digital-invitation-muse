import { Suspense } from "react";
import FormulirEditor from "@/komponen/FormulirEditor";
import { bacaDaftarTemplatAktif } from "@/lib/tokoData";

// Suspense diperlukan karena editor membaca parameter tautan (?templat=...).
// Dinamis dengan alasan yang sama seperti landing: daftar template harus
// dibaca segar dari database runtime, bukan dari hasil build.
export const dynamic = "force-dynamic";

export default async function Editor() {
  const daftarTemplat = await bacaDaftarTemplatAktif();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-4xl font-bold sm:text-5xl">Editor Undangan</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-tintaLembut">
        Isi data di kiri, lihat hasilnya langsung di kanan. Tidak perlu pindah
        halaman, dan tidak ada data yang disimpan.
      </p>
      <div className="mt-8">
        {daftarTemplat.length === 0 ? (
          <p className="kartu-kaca rounded-[2rem] p-6 text-center text-tintaLembut">
            Belum ada template aktif. Aktifkan satu template lewat dasbor admin dulu.
          </p>
        ) : (
          <Suspense fallback={<p className="text-tintaLembut">Memuat editor…</p>}>
            <FormulirEditor daftar={daftarTemplat} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
