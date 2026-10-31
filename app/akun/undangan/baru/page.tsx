import Link from "next/link";
import { redirect } from "next/navigation";
import { ambilSesiSaatIni } from "@/lib/sesi";
import { bacaDaftarTemplatAktif } from "@/lib/tokoData";
import { tambahUndanganPengguna } from "@/lib/aksiPengguna";
import FormulirUndangan from "@/komponen/admin/FormulirUndangan";

// Formulir undangan milik pengguna sendiri. Template yang ditawarkan hanya
// yang aktif, dan undangan yang tersimpan tercatat atas id pengguna ini.
export default async function UndanganBaruPengguna({
  searchParams,
}: {
  searchParams: { galat?: string };
}) {
  const sesi = await ambilSesiSaatIni();
  if (!sesi) redirect("/masuk");
  const daftarTemplat = await bacaDaftarTemplatAktif();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <Link href="/akun" className="text-sm font-bold text-tanah-600 underline underline-offset-4">
        Kembali ke dasbor saya
      </Link>
      <h1 className="mt-4 font-serif text-4xl font-bold">Buat Undangan Baru</h1>
      <p className="mt-2 max-w-xl text-[17px] leading-relaxed text-tintaLembut">
        Isi data acaramu, pilih template, lalu simpan. Setelah itu ubah statusnya jadi Aktif
        dan bagikan tautan tamunya ke para tamu.
      </p>
      <div className="mt-8">
        <FormulirUndangan daftarTemplat={daftarTemplat} galat={!!searchParams.galat} aksi={tambahUndanganPengguna} />
      </div>
    </div>
  );
}
