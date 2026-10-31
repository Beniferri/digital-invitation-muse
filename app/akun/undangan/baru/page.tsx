import Link from "next/link";
import { redirect } from "next/navigation";
import { ambilSesiSaatIni } from "@/lib/sesi";
import { bacaDaftarTemplatAktif } from "@/lib/tokoData";
import { tambahUndanganPengguna } from "@/lib/aksiPengguna";
import FormulirUndangan from "@/komponen/admin/FormulirUndangan";

// Formulir undangan milik pengguna sendiri. Template yang ditawarkan hanya
// yang aktif, dan undangan yang tersimpan tercatat atas id pengguna ini.
const pesanGalat: Record<string, string> = {
  "butuh-paket":
    "Untuk menyimpan undangan langsung sebagai Aktif, kamu butuh langganan aktif. Simpan sebagai Draft dulu (gratis), lalu beli paket dan aktifkan dari dasbor.",
  "slot-habis":
    "Slot undangan aktif di paketmu sudah penuh. Simpan sebagai Draft dulu, atau nonaktifkan satu undangan lain.",
};

export default async function UndanganBaruPengguna({
  searchParams,
}: {
  searchParams: { galat?: string };
}) {
  const sesi = await ambilSesiSaatIni();
  if (!sesi) redirect("/masuk");
  const daftarTemplat = await bacaDaftarTemplatAktif();
  const galat = searchParams.galat ? pesanGalat[searchParams.galat] : undefined;

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
      {galat && (
        <p role="alert" className="mt-6 rounded-2xl bg-terakota-100 px-4 py-3 text-sm font-bold text-tanah-700">
          {galat}
        </p>
      )}
      <div className="mt-8">
        <FormulirUndangan daftarTemplat={daftarTemplat} galat={!!searchParams.galat} aksi={tambahUndanganPengguna} />
      </div>
    </div>
  );
}
