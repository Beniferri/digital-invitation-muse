import FormulirUndangan from "@/komponen/admin/FormulirUndangan";
import { bacaDaftarTemplat } from "@/lib/tokoData";
import { wajibAdmin } from "@/lib/sesi";

export const dynamic = "force-dynamic";

export default async function TambahUndanganAdmin({
  searchParams,
}: {
  searchParams?: { galat?: string };
}) {
  await wajibAdmin();
  const daftarTemplat = await bacaDaftarTemplat();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight text-stone-900">Tambah Undangan</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-500">
        Catat undangan yang sedang kamu urus. Data ini hanya untuk admin,
        bukan hasil isian editor pengunjung.
      </p>
      <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <FormulirUndangan daftarTemplat={daftarTemplat} galat={Boolean(searchParams?.galat)} />
      </div>
    </div>
  );
}
