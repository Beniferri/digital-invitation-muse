import { notFound } from "next/navigation";
import FormulirTemplat from "@/komponen/admin/FormulirTemplat";
import { bacaDaftarTemplat } from "@/lib/tokoData";
import { wajibAdmin } from "@/lib/sesi";

export const dynamic = "force-dynamic";

export default async function UbahTemplatAdmin({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { galat?: string };
}) {
  await wajibAdmin();
  const daftar = await bacaDaftarTemplat();
  const templat = daftar.find((item) => item.slug === params.slug);
  if (!templat) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-4xl font-bold">Ubah Template: {templat.nama}</h1>
      <p className="mt-2 text-[17px] leading-relaxed text-tintaLembut">
        Mengubah slug akan mengubah tautan contohnya juga. Undangan lama yang
        memakai slug lama perlu diperbarui manual.
      </p>
      <div className="mt-8">
        <FormulirTemplat templat={templat} galat={Boolean(searchParams?.galat)} />
      </div>
    </div>
  );
}
