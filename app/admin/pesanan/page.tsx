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
      <h1 className="text-3xl font-bold tracking-tight">Pesanan &amp; Langganan</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-tintaLembut">
        {daftarPesanan.length} pesanan · {daftarLangganan.filter((item) => item.status === "Aktif").length} langganan aktif ·{" "}
        Total lunas: {formatRupiah(totalLunas)} (angka kasar dari pesanan berstatus Lunas, sebelum biaya Midtrans dan pajak).
      </p>

      <h2 className="mt-10 text-2xl font-bold tracking-tight">Pesanan</h2>
      <div className="mt-4 grid gap-3">
        {daftarPesanan.map((pesanan) => (
          <article key={pesanan.id} className="rounded-2xl kartu-kaca p-4">
            <p className="font-bold">
              {pesanan.email} · Paket {pesanan.namaPaket} ({pesanan.periode === "bulanan" ? "bulanan" : "tahunan"})
            </p>
            <p className="mt-1 text-sm text-tintaLembut">
              {pesanan.orderId} · <span className="tabular-nums">{formatRupiah(pesanan.nominal)}</span> ·{" "}
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${pesanan.status === "Lunas" ? "bg-daun-100 text-daun-700" : pesanan.status === "Gagal" ? "bg-terakota-100 text-tanah-700" : "bg-emas-300/25 text-tanah-700"}`}>
                {pesanan.status === "Lunas" ? "Lunas" : pesanan.status === "Gagal" ? "Gagal" : "Menunggu"}
              </span>
              {pesanan.metodePembayaran ? ` · ${pesanan.metodePembayaran}` : ""} · {pesanan.dibuatPada}
            </p>
          </article>
        ))}
      </div>
      {daftarPesanan.length === 0 && (
        <p className="mt-4 rounded-2xl kartu-kaca p-6 text-center text-tintaLembut">
          Belum ada pesanan.
        </p>
      )}

      <h2 className="mt-10 text-2xl font-bold tracking-tight">Langganan</h2>
      <div className="mt-4 grid gap-3">
        {daftarLangganan.map((langganan) => (
          <article key={langganan.id} className="rounded-2xl kartu-kaca p-4">
            <p className="font-bold">
              {langganan.email} · Paket {langganan.namaPaket} ·{" "}
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${langganan.status === "Aktif" ? "bg-daun-100 text-daun-700" : langganan.status === "Selesai" ? "bg-krem-300 text-tinta" : "bg-krem-200 text-tintaLembut"}`}>
                {langganan.status}
              </span>
            </p>
            <p className="mt-1 text-sm text-tintaLembut">
              {langganan.maksUndanganAktif} slot · aktif sampai {formatTanggalIndonesia(langganan.berakhirPada)} · mulai {langganan.mulaiPada}
            </p>
          </article>
        ))}
      </div>
      {daftarLangganan.length === 0 && (
        <p className="mt-4 rounded-2xl kartu-kaca p-6 text-center text-tintaLembut">
          Belum ada langganan.
        </p>
      )}
    </div>
  );
}
