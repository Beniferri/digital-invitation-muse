import type { Metadata } from "next";
import { bacaDaftarTemplatAktif } from "@/lib/tokoData";
import FilterKatalog from "@/komponen/FilterKatalog";

// Halaman katalog (server component): datanya dari toko admin, filternya komponen klien.
// Dinamis dengan alasan yang sama seperti landing: database runtime bisa
// berubah tanpa rebuild, jadi katalog harus selalu dibaca segar.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Katalog Template — UndanganKita",
  description:
    "Pilih templat undangan digital untuk pernikahan, aqiqah, wisuda, dan syukuran — semuanya bisa dipakai di paket apa pun.",
};

export default async function Katalog() {
  const daftarTemplat = await bacaDaftarTemplatAktif();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-4xl font-bold sm:text-5xl">Katalog Template</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-tintaLembut">
        Saring berdasarkan jenis acara, warna, dan nuansa. Templat dipilih bebas
        dan tidak terikat paket harga apa pun.
      </p>
      <div className="mt-8">
        <FilterKatalog daftar={daftarTemplat} />
      </div>
    </div>
  );
}
