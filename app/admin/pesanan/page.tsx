import { wajibAdmin } from "@/lib/sesi";
import {
  bacaSemuaLanggananDenganEmail,
  bacaSemuaPesananDenganEmail,
} from "@/lib/langganan";
import { formatRupiah } from "@/data/paketHarga";
import { formatTanggalIndonesia } from "@/lib/format";

export const dynamic = "force-dynamic";

// Daftar pesanan + langganan untuk admin: siapa membeli apa, berapa,
// lewat metode apa, dan langganan siapa yang masih aktif. Halaman ini
// hanya baca — mengubah status pesanan hanya lewat webhook Midtrans,
// dan admin tidak boleh mengaktifkan langganan manual dari sini (kalau
// ada kasus khusus, urus lewat database langsung dengan dicatat).
export default async function PesananAdmin() {
  await wajibAdmin();
  const daftarPesanan = await bacaSemuaPesananDenganEmail();
  const daftarLangganan = await bacaSemuaLanggananDenganEmail();
  const totalLunas = daftarPesanan
    .filter((pesanan) => pesanan.status === "Lunas")
    .reduce((jumlah, pesanan) => jumlah + pesanan.nominal, 0);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-stone-900">Pesanan &amp; Langganan</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-stone-500">
        {daftarPesanan.length} pesanan · {daftarLangganan.filter((item) => item.status === "Aktif").length} langganan aktif ·{" "}
        Total lunas: {formatRupiah(totalLunas)} (angka kasar dari pesanan berstatus Lunas, sebelum biaya Midtrans dan pajak).
      </p>

      <h2 className="mt-10 text-2xl font-bold tracking-tight text-stone-900">Pesanan</h2>
      <div className="mt-4 grid gap-3">
        {daftarPesanan.map((pesanan) => (
          <article key={pesanan.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="font-bold text-stone-900">
              {pesanan.email} · Paket {pesanan.namaPaket} ({pesanan.periode === "bulanan" ? "bulanan" : "tahunan"})
            </p>
            <p className="mt-1 text-sm text-stone-500">
              {pesanan.orderId} · <span className="tabular-nums">{formatRupiah(pesanan.nominal)}</span> ·{" "}
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${pesanan.status === "Lunas" ? "bg-[#E9F0E9] text-[#2F4A2E]" : pesanan.status === "Gagal" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
                {pesanan.status === "Lunas" ? "Lunas" : pesanan.status === "Gagal" ? "Gagal" : "Menunggu"}
              </span>
              {pesanan.metodePembayaran ? ` · ${pesanan.metodePembayaran}` : ""} · {pesanan.dibuatPada}
            </p>
          </article>
        ))}
      </div>
      {daftarPesanan.length === 0 && (
        <p className="mt-4 rounded-2xl border border-stone-200 bg-white p-6 text-center text-stone-500 shadow-sm">
          Belum ada pesanan.
        </p>
      )}

      <h2 className="mt-10 text-2xl font-bold tracking-tight text-stone-900">Langganan</h2>
      <div className="mt-4 grid gap-3">
        {daftarLangganan.map((langganan) => (
          <article key={langganan.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="font-bold text-stone-900">
              {langganan.email} · Paket {langganan.namaPaket} ·{" "}
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${langganan.status === "Aktif" ? "bg-[#E9F0E9] text-[#2F4A2E]" : langganan.status === "Selesai" ? "bg-stone-200 text-stone-700" : "bg-stone-100 text-stone-600"}`}>
                {langganan.status}
              </span>
            </p>
            <p className="mt-1 text-sm text-stone-500">
              {langganan.maksUndanganAktif} slot · aktif sampai {formatTanggalIndonesia(langganan.berakhirPada)} · mulai {langganan.mulaiPada}
            </p>
          </article>
        ))}
      </div>
      {daftarLangganan.length === 0 && (
        <p className="mt-4 rounded-2xl border border-stone-200 bg-white p-6 text-center text-stone-500 shadow-sm">
          Belum ada langganan.
        </p>
      )}
    </div>
  );
}
