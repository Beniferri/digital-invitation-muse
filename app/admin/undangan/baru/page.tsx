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
      <h1 className="font-serif text-4xl font-bold">Tambah Undangan</h1>
      <p className="mt-2 text-[17px] leading-relaxed text-tintaLembut">
        Catat undangan yang sedang kamu urus. Data ini hanya untuk admin,
        bukan hasil isian editor pengunjung.
      </p>
      <div className="mt-8">
        <FormulirUndangan daftarTemplat={daftarTemplat} galat={Boolean(searchParams?.galat)} />
      </div>
    </div>
  );
}
