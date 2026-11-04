import Link from "next/link";
import { wajibAdmin } from "@/lib/sesi";
import { bacaSemuaLanggananDenganEmail } from "@/lib/langganan";
import { formatTanggalIndonesia } from "@/lib/format";

export const dynamic = "force-dynamic";

// Daftar langganan untuk admin: semua status, bisa difilter.
// Hanya baca — status berubah lewat webhook Midtrans atau pemeriksaan
// kedaluwarsa malas, bukan dari halaman ini.
export default async function LanggananAdmin({
  searchParams,
}: {
  searchParams: { status?: string | string[] };
}) {
  await wajibAdmin();
  const statusMentah = Array.isArray(searchParams.status) ? (searchParams.status[0] ?? "") : (searchParams.status ?? "");
  const status = statusMentah === "Aktif" || statusMentah === "Selesai" || statusMentah === "Diganti" ? statusMentah : null;
  const semua = await bacaSemuaLanggananDenganEmail();
  const daftar = status ? semua.filter((item) => item.status === status) : semua;
  const jumlahAktif = semua.filter((item) => item.status === "Aktif").length;
  const jumlahSelesai = semua.filter((item) => item.status === "Selesai").length;
  const jumlahDiganti = semua.filter((item) => item.status === "Diganti").length;

  const pil = (label: string, nilai: string) => (
    <Link
      href={nilai ? `/admin/langganan?status=${nilai}` : "/admin/langganan"}
      aria-current={status === (nilai || null) || (!status && !nilai) ? "page" : undefined}
      className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-bold ${
        (status ?? "") === nilai ? "bg-[#2F4A2E] text-white" : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-stone-900">Langganan</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-stone-500">
        {semua.length} langganan · {jumlahAktif} aktif · {jumlahSelesai} selesai · {jumlahDiganti} diganti.
        Langganan yang diganti berarti pengguna membeli paket baru — bukan pelanggan yang pergi.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {pil("Semua", "")}
        {pil("Aktif", "Aktif")}
        {pil("Selesai", "Selesai")}
        {pil("Diganti", "Diganti")}
      </div>

      {daftar.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-stone-200 bg-white p-6 text-center text-stone-500 shadow-sm">
          Tidak ada langganan dengan filter ini.
        </p>
      ) : (
        <div className="mt-4 grid gap-3">
          {daftar.map((langganan) => (
            <article key={langganan.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="font-bold text-stone-900">
                {langganan.email} · Paket {langganan.namaPaket} ·{" "}
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${langganan.status === "Aktif" ? "bg-[#E9F0E9] text-[#2F4A2E]" : langganan.status === "Selesai" ? "bg-stone-200 text-stone-700" : "bg-stone-100 text-stone-600"}`}>
                  {langganan.status}
                </span>
              </p>
              <p className="mt-1 text-sm text-stone-500">
                {langganan.maksUndanganAktif} slot · mulai {langganan.mulaiPada} · berakhir{" "}
                {formatTanggalIndonesia(langganan.berakhirPada)}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
