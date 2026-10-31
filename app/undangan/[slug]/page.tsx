import Link from "next/link";
import { notFound } from "next/navigation";
import { bacaDaftarTemplatAktif, cariTemplatAktif } from "@/lib/tokoData";
import PratinjauUndangan from "@/komponen/PratinjauUndangan";
import TombolWhatsApp from "@/komponen/TombolWhatsApp";

// Route dinamis [slug] yang membaca data dari toko admin.
// Halaman ini mobile-first: undangan ditampilkan seperti layar ponsel di tengah,
// karena mayoritas penerima membukanya dari WhatsApp di ponsel.
export async function generateStaticParams() {
  const daftarTemplat = await bacaDaftarTemplatAktif();
  return daftarTemplat.map((templat) => ({ slug: templat.slug }));
}

export default async function ContohUndangan({ params }: { params: { slug: string } }) {
  const templat = await cariTemplatAktif(params.slug);
  if (!templat) notFound();

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:py-10">
      <p className="text-center text-sm font-bold uppercase tracking-widest text-tintaLembut">
        Undangan contoh · {templat.nama}
      </p>
      <div className="mt-4 overflow-hidden rounded-[2rem] shadow-kaca">
        <PratinjauUndangan
          templat={templat}
          data={{
            namaPertama: templat.contoh.namaPertama,
            namaKedua: templat.contoh.namaKedua,
            tanggal: templat.contoh.tanggal,
            lokasi: templat.contoh.lokasi,
            fotoUrl: templat.fotoSampul ?? `https://picsum.photos/seed/${templat.slug}/800/1000`,
          }}
        />
      </div>

      <div className="mt-6 space-y-3">
        <TombolWhatsApp templat={templat} />
        <Link
          href={`/editor?templat=${templat.slug}`}
          className="tombol-utama w-full border-2 border-tanah-600 text-sm text-tanah-700 hover:bg-krem-100"
        >
          Buat Versi Saya dengan Template Ini
        </Link>
        <Link
          href="/katalog"
          className="flex min-h-[48px] items-center justify-center text-sm font-bold text-tanah-600 underline underline-offset-4"
        >
          Kembali ke katalog
        </Link>
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-tintaLembut">
        Ini halaman contoh untuk demo. Foto di atas adalah foto placeholder dari
        layanan tanpa kunci API. Di editor, kamu bisa menggantinya dengan fotomu sendiri.
      </p>
    </div>
  );
}
