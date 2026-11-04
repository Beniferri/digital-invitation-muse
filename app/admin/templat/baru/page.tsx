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
      <h1 className="text-3xl font-bold tracking-tight">Tambah Template</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-tintaLembut">
        Isi data template dan contoh undangannya. Setelah disimpan, template
        langsung bisa dipakai di katalog dan editor.
      </p>
      <div className="mt-8 rounded-2xl kartu-kaca p-5 sm:p-6">
        <FormulirTemplat galat={Boolean(searchParams?.galat)} />
      </div>
    </div>
  );
}
