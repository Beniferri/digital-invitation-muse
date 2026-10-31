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
      <h1 className="font-serif text-4xl font-bold">Pesanan &amp; Langganan</h1>
      <p className="mt-2 max-w-2xl text-[17px] leading-relaxed text-tintaLembut">
        {daftarPesanan.length} pesanan · {daftarLangganan.filter((item) => item.status === "Aktif").length} langganan aktif ·{" "}
        Total lunas: {formatRupiah(totalLunas)} (angka kasar dari pesanan berstatus Lunas, sebelum biaya Midtrans dan pajak).
      </p>

      <h2 className="mt-10 font-serif text-3xl font-bold">Pesanan</h2>
      <div className="mt-4 grid gap-3">
        {daftarPesanan.map((pesanan) => (
          <article key={pesanan.id} className="kartu-kaca rounded-[1.5rem] p-4">
            <p className="font-bold">
              {pesanan.email} · Paket {pesanan.namaPaket} ({pesanan.periode === "bulanan" ? "bulanan" : "tahunan"})
            </p>
            <p className="mt-1 text-sm text-tintaLembut">
              {pesanan.orderId} · {formatRupiah(pesanan.nominal)} ·{" "}
              {pesanan.status === "Lunas" ? "Lunas" : pesanan.status === "Gagal" ? "Gagal" : "Menunggu"}
              {pesanan.metodePembayaran ? ` · ${pesanan.metodePembayaran}` : ""} · {pesanan.dibuatPada}
            </p>
          </article>
        ))}
      </div>
      {daftarPesanan.length === 0 && (
        <p className="kartu-kaca mt-4 rounded-[2rem] p-6 text-center text-tintaLembut">
          Belum ada pesanan.
        </p>
      )}

      <h2 className="mt-10 font-serif text-3xl font-bold">Langganan</h2>
      <div className="mt-4 grid gap-3">
        {daftarLangganan.map((langganan) => (
          <article key={langganan.id} className="kartu-kaca rounded-[1.5rem] p-4">
            <p className="font-bold">
              {langganan.email} · Paket {langganan.namaPaket} · {langganan.status}
            </p>
            <p className="mt-1 text-sm text-tintaLembut">
              {langganan.maksUndanganAktif} slot · aktif sampai {formatTanggalIndonesia(langganan.berakhirPada)} · mulai {langganan.mulaiPada}
            </p>
          </article>
        ))}
      </div>
      {daftarLangganan.length === 0 && (
        <p className="kartu-kaca mt-4 rounded-[2rem] p-6 text-center text-tintaLembut">
          Belum ada langganan.
        </p>
      )}
    </div>
  );
}
