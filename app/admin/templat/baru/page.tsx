import FormulirTemplat from "@/komponen/admin/FormulirTemplat";
import { wajibAdmin } from "@/lib/sesi";

export const dynamic = "force-dynamic";

export default async function TambahTemplatAdmin({
  searchParams,
}: {
  searchParams?: { galat?: string };
}) {
  await wajibAdmin();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight text-stone-900">Tambah Template</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-500">
        Isi data template dan contoh undangannya. Setelah disimpan, template
        langsung bisa dipakai di katalog dan editor.
      </p>
      <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <FormulirTemplat galat={Boolean(searchParams?.galat)} />
      </div>
    </div>
  );
}
