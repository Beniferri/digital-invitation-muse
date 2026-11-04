import { simpanHarga } from "@/lib/aksiAdmin";
import { bacaDaftarPaketHarga } from "@/lib/tokoData";
import { wajibAdmin } from "@/lib/sesi";

export const dynamic = "force-dynamic";

// Ubah nominal paket. Nama, keterangan, dan daftar fitur tidak diubah di sini
// supaya struktur paket tetap konsisten dengan yang dijanjikan di landing.
export default async function HargaAdmin({
  searchParams,
}: {
  searchParams?: { tersimpan?: string };
}) {
  await wajibAdmin();
  const daftar = await bacaDaftarPaketHarga();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Harga</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-tintaLembut">
        Ubah nominal bulanan dan tahunan. Setelah disimpan, harga baru langsung
        tampil di bagian harga landing.
      </p>
      {searchParams?.tersimpan && (
        <p role="status" className="mt-5 rounded-2xl bg-[#E9F0E9] px-4 py-3 text-sm font-bold text-tanah-600">
          Harga tersimpan dan sudah diperbarui di landing.
        </p>
      )}
      <form action={simpanHarga} className="mt-8 rounded-2xl kartu-kaca p-5 sm:p-7">
        <div className="space-y-6">
          {daftar.map((paket, indeks) => (
            <fieldset key={paket.nama} className="rounded-2xl bg-white/70 p-4">
              <legend className="px-2 text-xl font-bold">{paket.nama}</legend>
              <p className="mt-1 text-sm text-tintaLembut">{paket.keterangan}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={`bulanan-${indeks}`} className="text-sm font-bold">Harga bulanan (Rp)</label>
                  <input
                    id={`bulanan-${indeks}`}
                    name={`bulanan-${indeks}`}
                    type="number"
                    min="1"
                    defaultValue={paket.hargaBulanan}
                    className="mt-2 min-h-[48px] w-full rounded-xl border border-tanah-900/15 bg-white/80 px-4 py-3 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor={`tahunan-${indeks}`} className="text-sm font-bold">Harga tahunan (Rp)</label>
                  <input
                    id={`tahunan-${indeks}`}
                    name={`tahunan-${indeks}`}
                    type="number"
                    min="1"
                    defaultValue={paket.hargaTahunan}
                    className="mt-2 min-h-[48px] w-full rounded-xl border border-tanah-900/15 bg-white/80 px-4 py-3 outline-none"
                  />
                </div>
              </div>
            </fieldset>
          ))}
        </div>
        <button type="submit" className="mt-7 min-h-[44px] w-full rounded-full bg-tanah-600 px-5 text-sm font-bold text-white hover:bg-tanah-700">
          Simpan Semua Harga
        </button>
      </form>
    </div>
  );
}
