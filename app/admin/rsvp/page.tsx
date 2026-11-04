import Link from "next/link";
import { wajibAdmin } from "@/lib/sesi";
import { bacaRingkasanRsvp, bacaRsvpTerbaru, bacaToko } from "@/lib/tokoData";

export const dynamic = "force-dynamic";

// Halaman RSVP khusus: isi bagian RSVP dari Ringkasan lama, dipindah ke
// sini supaya Ringkasan fokus ke langganan & pendapatan. Ringkasan per
// undangan SELALU dari daftar penuh (bukan filter), sama seperti dulu.
export default async function RsvpAdmin() {
  await wajibAdmin();
  const toko = await bacaToko();
  const daftarRingkasan = await Promise.all(
    toko.undangan.map(async (undangan) => ({
      undangan,
      ringkasan: await bacaRingkasanRsvp(undangan.id),
    })),
  );
  const totalBalasan = daftarRingkasan.reduce((jumlah, item) => jumlah + item.ringkasan.totalBalasan, 0);
  const totalTamuHadir = daftarRingkasan.reduce((jumlah, item) => jumlah + item.ringkasan.totalTamuHadir, 0);
  const totalHadir = daftarRingkasan.reduce((jumlah, item) => jumlah + item.ringkasan.hadir, 0);
  const rsvpTerbaru = await bacaRsvpTerbaru(20);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-stone-900">RSVP</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-stone-500">
        {totalBalasan} balasan · {totalHadir} balasan hadir ({totalTamuHadir} tamu) dari semua undangan.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-stone-900">RSVP terbaru</h2>
          {rsvpTerbaru.length === 0 ? (
            <p className="mt-4 text-[15px] text-stone-500">Belum ada balasan RSVP.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {rsvpTerbaru.map((rsvp) => (
                <li key={rsvp.id} className="rounded-xl bg-stone-50 px-4 py-3">
                  <p className="font-bold text-stone-900">
                    {rsvp.nama}
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${rsvp.kehadiran === "Hadir" ? "bg-[#E9F0E9] text-[#2F4A2E]" : rsvp.kehadiran === "Ragu" ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-700"}`}>
                      {rsvp.kehadiran === "Hadir" ? `Hadir · ${rsvp.jumlahTamu} tamu` : rsvp.kehadiran === "Ragu" ? "Masih ragu" : "Tidak bisa hadir"}
                    </span>
                  </p>
                  <p className="text-sm text-stone-500">
                    {rsvp.namaUndangan} · {rsvp.dibuatPada}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-stone-900">RSVP per undangan</h2>
          {daftarRingkasan.length === 0 ? (
            <p className="mt-4 text-[15px] text-stone-500">Belum ada undangan. Tambah dari menu Undangan.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {daftarRingkasan.map(({ undangan, ringkasan }) => (
                <li key={undangan.id} className="rounded-xl bg-stone-50 px-4 py-3">
                  <p className="font-bold text-stone-900">
                    {undangan.namaPertama}
                    {undangan.namaKedua ? ` dan ${undangan.namaKedua}` : ""}
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${undangan.status === "Aktif" ? "bg-[#E9F0E9] text-[#2F4A2E]" : undangan.status === "Draft" ? "bg-stone-100 text-stone-600" : "bg-stone-200 text-stone-700"}`}>
                      {undangan.status}
                    </span>
                  </p>
                  <p className="text-sm text-stone-500">
                    {ringkasan.totalBalasan} balasan · {ringkasan.hadir} hadir ({ringkasan.totalTamuHadir} tamu)
                  </p>
                  <Link href={`/admin/undangan/${undangan.id}`} className="text-sm font-bold text-[#2F4A2E] underline underline-offset-4">
                    Lihat detail RSVP
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
