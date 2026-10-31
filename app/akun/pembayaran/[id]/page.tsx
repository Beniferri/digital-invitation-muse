import Link from "next/link";
import { redirect } from "next/navigation";
import { ambilSesiSaatIni } from "@/lib/sesi";
import { cariPesananOlehIdDanPengguna } from "@/lib/langganan";
import { cobaLagiToken } from "@/lib/aksiPembayaran";
import { formatRupiah } from "@/data/paketHarga";

export const dynamic = "force-dynamic";

// Halaman satu pesanan: statusnya dibaca dari database, yang hanya diubah
// webhook Midtrans. Kalau pengguna sudah bayar tapi status masih Menunggu,
// itu berarti webhook belum sampai — halaman ini meminta pengguna menunggu
// dan memuat ulang, bukan mengubah status dari peramban.
const pesanGalat: Record<string, string> = {
  midtrans: "Pembayaran belum bisa dibuat (kunci Midtrans belum dipasang atau Midtrans menolak permintaan). Pesananmu tetap tersimpan — tekan tombol di bawah untuk mencoba lagi.",
};

export default async function Pembayaran({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { galat?: string };
}) {
  const sesi = await ambilSesiSaatIni();
  if (!sesi) redirect("/masuk");
  const pesanan = await cariPesananOlehIdDanPengguna(params.id, sesi.id);
  if (!pesanan) redirect("/akun");
  const galat = searchParams?.galat ? pesanGalat[searchParams.galat] : undefined;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <Link href="/akun" className="text-sm font-bold text-tanah-600 underline underline-offset-4">
        Kembali ke dasbor saya
      </Link>
      <h1 className="mt-4 font-serif text-4xl font-bold">Pembayaran</h1>
      {galat && (
        <p role="alert" className="mt-6 rounded-2xl bg-terakota-100 px-4 py-3 text-sm font-bold text-tanah-700">
          {galat}
        </p>
      )}
      <div className="kartu-kaca mt-6 rounded-[2rem] p-5 sm:p-6">
        <p className="text-sm text-tintaLembut">Nomor pesanan: {pesanan.orderId}</p>
        <h2 className="mt-2 font-serif text-2xl font-bold">
          Paket {pesanan.namaPaket} ({pesanan.periode === "bulanan" ? "bulanan" : "tahunan"})
        </h2>
        <p className="mt-2 text-[17px]">
          Nominal: <strong>{formatRupiah(pesanan.nominal)}</strong>
        </p>
        <p className="mt-1 text-sm text-tintaLembut">
          Status:{" "}
          <strong>
            {pesanan.status === "Lunas"
              ? "Lunas"
              : pesanan.status === "Gagal"
                ? "Gagal / kedaluwarsa"
                : "Menunggu pembayaran"}
          </strong>
          {pesanan.metodePembayaran ? ` · lewat ${pesanan.metodePembayaran}` : ""}
        </p>
        <p className="mt-1 text-sm text-tintaLembut">Dibuat: {pesanan.dibuatPada}</p>

        {pesanan.status === "Lunas" && (
          <p role="status" className="mt-5 rounded-2xl bg-daun-100 px-4 py-3 text-sm font-bold text-daun-700">
            Pembayaran lunas, langgananmu sudah aktif. Kamu bisa mengaktifkan
            undangan dari dasbor sampai batas paket.
          </p>
        )}
        {pesanan.status === "Gagal" && (
          <p role="status" className="mt-5 rounded-2xl bg-terakota-100 px-4 py-3 text-sm font-bold text-tanah-700">
            Pembayaran ini gagal atau kedaluwarsa dan tidak mengaktifkan
            langganan. Beli lagi dari halaman paket untuk membuat pesanan baru.
          </p>
        )}
        {pesanan.status === "Menunggu" && (
          <>
            <p className="mt-5 text-[15px] leading-relaxed text-tintaLembut">
              Status diperbarui otomatis setelah Midtrans mengonfirmasi
              pembayaranmu. Kalau kamu sudah bayar tapi status di sini belum
              berubah, tunggu beberapa saat lalu muat ulang halaman ini.
            </p>
            {pesanan.snapRedirectUrl ? (
              <a
                href={pesanan.snapRedirectUrl}
                className="tombol-utama mt-5 w-full bg-tanah-600 text-sm text-white hover:bg-tanah-700"
              >
                Lanjutkan ke Pembayaran
              </a>
            ) : (
              <form action={cobaLagiToken} className="mt-5">
                <input type="hidden" name="id" value={pesanan.id} />
                <button type="submit" className="tombol-utama w-full bg-tanah-600 text-sm text-white hover:bg-tanah-700">
                  Coba Buat Pembayaran Lagi
                </button>
              </form>
            )}
          </>
        )}
      </div>
      <div className="mt-6 flex flex-wrap gap-4">
        <Link href="/akun/paket" className="text-sm font-bold text-tanah-600 underline underline-offset-4">
          Beli paket lain
        </Link>
        <Link href="/akun" className="text-sm font-bold text-tanah-600 underline underline-offset-4">
          Kembali ke dasbor
        </Link>
      </div>
    </div>
  );
}
