import Link from "next/link";
import { hapusTemplat, ubahStatusTemplat } from "@/lib/aksiAdmin";
import { bacaDaftarTemplat } from "@/lib/tokoData";
import { wajibAdmin } from "@/lib/sesi";

export const dynamic = "force-dynamic";

// Daftar template untuk admin: semua status tampil, bukan hanya yang aktif,
// supaya admin bisa mengaktifkan kembali template yang sempat dinonaktifkan.
export default async function DaftarTemplatAdmin() {
  await wajibAdmin();
  const daftar = await bacaDaftarTemplat();
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Template</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-tintaLembut">
            Tambah, ubah, aktifkan, nonaktifkan, atau hapus template. Template
            aktif langsung tampil di landing, katalog, editor, dan halaman contoh.
          </p>
        </div>
        <Link href="/admin/templat/baru" className="min-h-[44px] rounded-full bg-tanah-600 px-5 py-3 text-sm font-bold text-white hover:bg-tanah-700">
          Tambah Template
        </Link>
      </div>

      <div className="mt-8 grid gap-4">
        {daftar.map((templat) => (
          <article key={templat.slug} className="rounded-2xl kartu-kaca p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{templat.nama}</h2>
                <p className="mt-1 text-sm text-tintaLembut">
                  {templat.jenisAcara} · {templat.nuansa} · Warna {templat.warna} · /undangan/{templat.slug}
                </p>
                <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-tintaLembut">{templat.deskripsi}</p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${templat.aktif ? "bg-daun-100 text-daun-700" : "bg-krem-200 text-tintaLembut"}`}>
                {templat.aktif ? "Aktif" : "Nonaktif"}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/admin/templat/${templat.slug}/ubah`} className="flex min-h-[44px] items-center rounded-full border border-tanah-600 px-4 text-sm font-bold text-tanah-700">
                Ubah
              </Link>
              <form action={ubahStatusTemplat}>
                <input type="hidden" name="slug" value={templat.slug} />
                <button type="submit" className="min-h-[44px] rounded-full border border-tanah-600 px-4 text-sm font-bold text-tanah-700">
                  {templat.aktif ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </form>
              <form action={hapusTemplat}>
                <input type="hidden" name="slug" value={templat.slug} />
                <button type="submit" className="min-h-[44px] rounded-full bg-terakota-100 px-4 text-sm font-bold text-tanah-700">
                  Hapus
                </button>
              </form>
              <Link href={`/undangan/${templat.slug}`} className="flex min-h-[44px] items-center text-sm font-bold text-tanah-600 underline underline-offset-4">
                Lihat contoh publik
              </Link>
            </div>
          </article>
        ))}
      </div>
      {daftar.length === 0 && (
        <p className="mt-8 rounded-2xl kartu-kaca p-6 text-center text-tintaLembut">
          Belum ada template. Tambah template pertama dari tombol di atas.
        </p>
      )}
    </div>
  );
}
