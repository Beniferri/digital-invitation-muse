import Link from "next/link";
import { wajibAdmin } from "@/lib/sesi";
import { formatRupiah } from "@/data/paketHarga";
import {
  bacaAktivitas,
  hitungMetrikDasbor,
  pendapatanPerBulan,
  sebaranPaket,
  type JenisAktivitas,
} from "@/lib/dasborAdmin";
import { bacaRingkasanRsvp, bacaToko } from "@/lib/tokoData";

export const dynamic = "force-dynamic";

// Ringkasan langganan & pendapatan: SEMUA angka dari database.
// MRR = kontribusi bulanan langganan Aktif (tahunan = nominal/12).
// Churn 30 hari = langganan berakhir 30 hari terakhir dibagi
// (Aktif + berakhir 30 hari terakhir); Diganti bukan churn.
// Grafik = pendapatan lunas per bulan (bulan status terakhir diubah).
// Filter aktivitas lewat parameter tautan (GET) supaya tetap jalan
// tanpa JavaScript dan bisa dites lewat curl.
function teksParam(nilai: string | string[] | undefined): string {
  return Array.isArray(nilai) ? (nilai[0] ?? "") : (nilai ?? "");
}

export default async function RingkasanAdmin({
  searchParams,
}: {
  searchParams: { cari?: string | string[]; jenis?: string | string[] };
}) {
  await wajibAdmin();
  const cari = teksParam(searchParams.cari).trim();
  const jenisMentah = teksParam(searchParams.jenis);
  const jenis: JenisAktivitas | null =
    jenisMentah === "pembayaran" || jenisMentah === "langganan" || jenisMentah === "akun"
      ? jenisMentah
      : null;
  const metrik = await hitungMetrikDasbor();
  const perBulan = await pendapatanPerBulan();
  const sebaran = await sebaranPaket();
  const aktivitas = await bacaAktivitas(cari, jenis, 30);

  const toko = await bacaToko();
  const undanganAktif = toko.undangan.filter((item) => item.status === "Aktif").length;
  const jumlahDraft = toko.undangan.filter((item) => item.status === "Draft").length;
  const jumlahSelesai = toko.undangan.filter((item) => item.status === "Selesai").length;
  const ringkasanRsvp = await Promise.all(toko.undangan.map((item) => bacaRingkasanRsvp(item.id)));
  const totalBalasan = ringkasanRsvp.reduce((jumlah, item) => jumlah + item.totalBalasan, 0);

  const kartu = (judul: string, nilai: string, keterangan: string) => (
    <div className="kartu-kaca rounded-[1.75rem] p-5">
      <p className="text-sm font-bold text-tintaLembut">{judul}</p>
      <p className="mt-1 font-serif text-3xl font-bold">{nilai}</p>
      <p className="mt-1 text-sm text-tintaLembut">{keterangan}</p>
    </div>
  );

  const maksBulan = Math.max(1, ...perBulan.map((bulan) => bulan.total));
  const tautanCsv = `/api/admin/aktivitas/csv?${new URLSearchParams({
    ...(cari ? { cari } : {}),
    ...(jenis ? { jenis } : {}),
  }).toString()}`;

  return (
    <div>
      <h1 className="font-serif text-4xl font-bold">Ringkasan</h1>
      <p className="mt-2 max-w-2xl text-[17px] leading-relaxed text-tintaLembut">
        Langganan dan pendapatan UndanganKita, dihitung dari database — bukan angka contoh.
        Pendapatan rutin = langganan Aktif (tahunan dihitung nominal/12).
        Angka berhenti 30 hari tidak menghitung langganan yang diganti paket baru.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kartu("Pendapatan rutin / bulan", formatRupiah(metrik.mrr), `Dari ${metrik.langgananAktif} langganan aktif.`)}
        {kartu(
          "Langganan aktif",
          String(metrik.langgananAktif),
          `${metrik.langgananBulanan} bulanan · ${metrik.langgananTahunan} tahunan.`,
        )}
        {kartu(
          "Pengguna",
          String(metrik.jumlahPengguna),
          `+${metrik.penggunaBaru30Hari} akun baru 30 hari terakhir.`,
        )}
        {kartu(
          "Berhenti langganan (30 hari)",
          metrik.churn30Hari === null ? "—" : `${(metrik.churn30Hari * 100).toFixed(1)}%`,
          metrik.churn30Hari === null
            ? "Belum ada data langganan untuk menghitung angka ini."
            : `${metrik.berakhir30Hari} langganan berakhir 30 hari terakhir.`,
        )}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <section className="kartu-kaca rounded-[2rem] p-5 sm:p-6 lg:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-serif text-2xl font-bold">Pendapatan lunas per bulan</h2>
            <p className="text-sm text-tintaLembut">Total lunas: {formatRupiah(metrik.totalLunas)}</p>
          </div>
          <p className="mt-1 text-sm text-tintaLembut">
            12 bulan terakhir, sebelum biaya Midtrans dan pajak. Bulan = bulan status pesanan
            terakhir diubah (untuk pesanan Lunas, itu bulan pembayaran dikonfirmasi).
          </p>
          <div className="mt-6 flex h-48 items-end gap-2" role="img" aria-label="Grafik batang pendapatan lunas 12 bulan terakhir">
            {perBulan.map((bulan) => (
              <div key={bulan.kunci} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-center text-xs font-bold leading-tight">
                  {bulan.total > 0 ? formatRupiah(bulan.total) : ""}
                </span>
                <div
                  className="w-full rounded-t-lg bg-tanah-500"
                  style={{ height: `${Math.max(2, (bulan.total / maksBulan) * 100)}%` }}
                >
                  <title>
                    {bulan.label}: {formatRupiah(bulan.total)}
                  </title>
                </div>
                <span className="text-center text-xs text-tintaLembut">{bulan.label.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="kartu-kaca rounded-[2rem] p-5 sm:p-6">
          <h2 className="font-serif text-2xl font-bold">Sebaran paket aktif</h2>
          <p className="mt-1 text-sm text-tintaLembut">Langganan Aktif per paket dan kontribusi MRR-nya.</p>
          {sebaran.length === 0 ? (
            <p className="mt-4 text-[15px] text-tintaLembut">Belum ada langganan aktif.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {sebaran.map((paket) => (
                <li key={paket.nama} className="rounded-2xl bg-white/70 px-4 py-3">
                  <p className="flex items-baseline justify-between gap-2 font-bold">
                    <span>{paket.nama}</span>
                    <span>{paket.jumlah} langganan</span>
                  </p>
                  <p className="text-sm text-tintaLembut">
                    {formatRupiah(paket.mrr)} / bulan ·{" "}
                    {metrik.mrr > 0 ? ((paket.mrr / metrik.mrr) * 100).toFixed(0) : 0}% dari MRR
                  </p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 border-t border-krem-200 pt-4 text-sm text-tintaLembut">
            <p>
              Undangan: {undanganAktif} aktif · {jumlahDraft} draft · {jumlahSelesai} selesai.
            </p>
            <p className="mt-1">
              {totalBalasan} balasan RSVP ·{" "}
              <Link href="/admin/rsvp" className="font-bold text-tanah-600 underline underline-offset-4">
                Lihat RSVP
              </Link>
            </p>
          </div>
        </section>
      </div>

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-3xl font-bold">Aktivitas terbaru</h2>
          <a href={tautanCsv} className="min-h-[44px] rounded-full border-2 border-tanah-600 px-4 py-2 text-sm font-bold text-tanah-700">
            Unduh CSV
          </a>
        </div>
        <form method="get" className="mt-4 flex flex-wrap gap-3">
          <label htmlFor="cari-aktivitas" className="sr-only">
            Cari aktivitas
          </label>
          <input
            id="cari-aktivitas"
            type="search"
            name="cari"
            defaultValue={cari}
            placeholder="Cari email, order ID, paket…"
            className="min-h-[44px] min-w-0 flex-1 rounded-full border border-krem-300 bg-white/80 px-4 text-[15px] outline-none"
          />
          <label htmlFor="filter-jenis" className="sr-only">
            Filter jenis aktivitas
          </label>
          <select
            id="filter-jenis"
            name="jenis"
            defaultValue={jenis ?? ""}
            className="min-h-[44px] rounded-full border border-krem-300 bg-white/80 px-4 text-[15px] font-bold"
          >
            <option value="">Semua jenis</option>
            <option value="pembayaran">Pembayaran</option>
            <option value="langganan">Langganan</option>
            <option value="akun">Akun</option>
          </select>
          <button type="submit" className="tombol-utama bg-tanah-600 text-sm text-white">
            Cari
          </button>
        </form>

        {aktivitas.length === 0 ? (
          <p className="kartu-kaca mt-4 rounded-[2rem] p-6 text-center text-tintaLembut">
            {cari || jenis ? "Tidak ada aktivitas yang cocok dengan pencarian." : "Belum ada aktivitas."}
          </p>
        ) : (
          <>
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="kartu-kaca w-full rounded-[1.5rem] text-left text-[15px]">
                <thead>
                  <tr className="border-b border-krem-200 text-tintaLembut">
                    <th className="px-4 py-3">Waktu</th>
                    <th className="px-4 py-3">Aktivitas</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Paket</th>
                    <th className="px-4 py-3">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {aktivitas.map((item, indeks) => (
                    <tr key={`${item.waktu}-${item.email}-${indeks}`} className="border-b border-krem-200/70 last:border-0">
                      <td className="whitespace-nowrap px-4 py-3">{item.waktu}</td>
                      <td className="px-4 py-3 font-bold">{item.judul}</td>
                      <td className="px-4 py-3">{item.email}</td>
                      <td className="px-4 py-3">{item.paket ?? "—"}</td>
                      <td className="px-4 py-3">{item.nominal === null ? "—" : formatRupiah(item.nominal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 grid gap-3 md:hidden">
              {aktivitas.map((item, indeks) => (
                <article key={`${item.waktu}-${item.email}-${indeks}`} className="kartu-kaca rounded-[1.5rem] p-4">
                  <p className="font-bold">{item.judul}</p>
                  <p className="mt-1 text-sm text-tintaLembut">
                    {item.email}
                    {item.paket ? ` · Paket ${item.paket}` : ""}
                  </p>
                  <p className="text-sm text-tintaLembut">
                    {item.waktu}
                    {item.nominal !== null ? ` · ${formatRupiah(item.nominal)}` : ""}
                  </p>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
