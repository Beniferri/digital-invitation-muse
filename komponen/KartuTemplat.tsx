import Link from "next/link";
import type { Templat } from "@/data/templat";
import PratinjauUndangan from "./PratinjauUndangan";

// Kartu galeri: pratinjau kecil di atas, keterangan di bawah, dua aksi yang jelas.
// Templat dipilih bebas, tidak ada label paket di kartu ini.
export default function KartuTemplat({ templat }: { templat: Templat }) {
  return (
    <article className="kartu-kaca animasi-masuk overflow-hidden rounded-[2rem]">
      <PratinjauUndangan
        templat={templat}
        tampilkanCatatan={false}
        data={{
          namaPertama: templat.contoh.namaPertama,
          namaKedua: templat.contoh.namaKedua,
          tanggal: templat.contoh.tanggal,
          lokasi: templat.contoh.lokasi,
          fotoUrl: templat.fotoSampul ?? `https://picsum.photos/seed/${templat.slug}/800/1000`,
        }}
      />
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-krem-200 px-3 py-1 text-tanah-700">{templat.jenisAcara}</span>
          <span className="rounded-full bg-krem-200 px-3 py-1 text-tanah-700">{templat.nuansa}</span>
          <span className="rounded-full bg-krem-200 px-3 py-1 text-tanah-700">Warna {templat.warna}</span>
        </div>
        <h3 className="mt-3 font-serif text-2xl font-bold">{templat.nama}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-tintaLembut">{templat.deskripsi}</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link href={`/undangan/${templat.slug}`} className="tombol-utama flex-1 bg-tanah-600 text-sm text-white hover:bg-tanah-700">
            Lihat Contoh
          </Link>
          <Link href={`/editor?templat=${templat.slug}`} className="tombol-utama flex-1 border-2 border-tanah-600 text-sm text-tanah-700 hover:bg-krem-100">
            Pakai di Editor
          </Link>
        </div>
      </div>
    </article>
  );
}
