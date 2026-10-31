import Link from "next/link";
import { redirect } from "next/navigation";
import { ambilSesiSaatIni } from "@/lib/sesi";
import { buatPesananDanBayar } from "@/lib/aksiPembayaran";
import {
  bacaDaftarPaketJual,
  jumlahUndanganAktifPengguna,
  langgananAktifPengguna,
} from "@/lib/langganan";
import { formatRupiah } from "@/data/paketHarga";
import { formatTanggalIndonesia } from "@/lib/format";

export const dynamic = "force-dynamic";

// Halaman beli paket: daftar paket dari database (harga yang diubah admin
// langsung tampil), masing-masing dengan tombol beli bulanan dan tahunan.
// Langganan yang sedang aktif ditampilkan di atas supaya pengguna tidak
// membeli paket yang sama dua kali tanpa sadar — membeli paket baru
// menggantikan langganan aktif lama (tidak menumpuk masa aktif).
const pesanGalat: Record<string, string> = {
  paket: "Paket tidak ditemukan atau nominalnya tidak valid. Pilih paket dari daftar di bawah.",
};

export default async function Paket({
  searchParams,
}: {
  searchParams?: { galat?: string };
}) {
  const sesi = await ambilSesiSaatIni();
  if (!sesi) redirect("/masuk?lanjut=/akun/paket");
  const daftarPaket = await bacaDaftarPaketJual();
  const langganan = await langgananAktifPengguna(sesi.id);
  const terpakai = await jumlahUndanganAktifPengguna(sesi.id);
  const galat = searchParams?.galat ? pesanGalat[searchParams.galat] : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <Link href="/akun" className="text-sm font-bold text-tanah-600 underline underline-offset-4">
        Kembali ke dasbor saya
      </Link>
      <h1 className="mt-4 font-serif text-4xl font-bold">Beli Paket</h1>
      <p className="mt-2 max-w-2xl text-[17px] leading-relaxed text-tintaLembut">
        Bayar lewat Midtrans (transfer bank, e-wallet, QRIS, dan gerai retail).
        Setelah pembayaran dikonfirmasi, langgananmu langsung aktif dan kamu
        bisa mengaktifkan undangan sampai batas paket.
      </p>
      {galat && (
        <p role="alert" className="mt-6 rounded-2xl bg-terakota-100 px-4 py-3 text-sm font-bold text-tanah-700">
          {galat}
        </p>
      )}
      {langganan && (
        <p role="status" className="mt-6 rounded-2xl bg-daun-100 px-4 py-3 text-sm font-bold text-daun-700">
          Langgananmu yang aktif saat ini: {langganan.namaPaket} sampai{" "}
          {formatTanggalIndonesia(langganan.berakhirPada)} · {terpakai} dari {langganan.maksUndanganAktif} slot undangan aktif terpakai.
          Membeli paket baru akan menggantikan langganan ini.
        </p>
      )}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {daftarPaket.map((paket) => (
          <article key={paket.nama} className="kartu-kaca rounded-[1.75rem] p-5">
            <h2 className="font-serif text-2xl font-bold">{paket.nama}</h2>
            <p className="mt-1 text-sm leading-relaxed text-tintaLembut">{paket.keterangan}</p>
            <p className="mt-3 text-sm">
              <strong>{paket.maksUndanganAktif} undangan aktif</strong>
            </p>
            <div className="mt-4 space-y-3">
              <form action={buatPesananDanBayar}>
                <input type="hidden" name="namaPaket" value={paket.nama} />
                <input type="hidden" name="periode" value="bulanan" />
                <button type="submit" className="tombol-utama w-full bg-tanah-600 text-sm text-white hover:bg-tanah-700">
                  Beli Bulanan · {formatRupiah(paket.hargaBulanan)} / bulan
                </button>
              </form>
              <form action={buatPesananDanBayar}>
                <input type="hidden" name="namaPaket" value={paket.nama} />
                <input type="hidden" name="periode" value="tahunan" />
                <button type="submit" className="tombol-utama w-full border-2 border-tanah-600 text-sm text-tanah-700 hover:bg-krem-100">
                  Beli Tahunan · {formatRupiah(paket.hargaTahunan)} / tahun
                </button>
              </form>
            </div>
            <p className="mt-3 text-center text-xs text-tintaLembut">
              Bulanan aktif 30 hari, tahunan aktif 1 tahun sejak pembayaran.
            </p>
          </article>
        ))}
      </div>
      {daftarPaket.length === 0 && (
        <p className="kartu-kaca mt-8 rounded-[2rem] p-6 text-center text-tintaLembut">
          Belum ada paket yang bisa dibeli. Hubungi admin.
        </p>
      )}
    </div>
  );
}
