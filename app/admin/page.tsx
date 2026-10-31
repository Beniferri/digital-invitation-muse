import Link from "next/link";
import { bacaRingkasanRsvp, bacaRsvpTerbaru, bacaToko } from "@/lib/tokoData";
import { formatRupiah } from "@/data/paketHarga";
import { formatTanggalIndonesia } from "@/lib/format";
import { wajibAdmin } from "@/lib/sesi";

export const dynamic = "force-dynamic";

// Dasbor admin: angka utama situs, metrik RSVP gabungan, RSVP terbaru,
// dan ringkasan RSVP per undangan. Halaman ini selalu dibaca segar
// (force-dynamic) supaya perubahan dari formulir admin dan balasan tamu
// langsung terlihat tanpa menunggu build ulang.
export default async function RingkasanAdmin() {
  await wajibAdmin();
  const toko = await bacaToko();
  const templatAktif = toko.templat.filter((templat) => templat.aktif);
  const undanganAktif = toko.undangan.filter((undangan) => undangan.status === "Aktif");
  const undanganTerbaru = [...toko.undangan]
    .sort((a, b) => b.dibuatPada.localeCompare(a.dibuatPada))
    .slice(0, 5);
  const hargaTermurah = Math.min(...toko.paketHarga.map((paket) => paket.hargaBulanan));

  const daftarRingkasan = await Promise.all(
    toko.undangan.map(async (undangan) => ({
      undangan,
      ringkasan: await bacaRingkasanRsvp(undangan.id),
    })),
  );
  const totalBalasan = daftarRingkasan.reduce((jumlah, item) => jumlah + item.ringkasan.totalBalasan, 0);
  const totalTamuHadir = daftarRingkasan.reduce((jumlah, item) => jumlah + item.ringkasan.totalTamuHadir, 0);
  const totalHadir = daftarRingkasan.reduce((jumlah, item) => jumlah + item.ringkasan.hadir, 0);
  const rsvpTerbaru = await bacaRsvpTerbaru(8);
  const jumlahDraft = toko.undangan.filter((undangan) => undangan.status === "Draft").length;
  const jumlahSelesai = toko.undangan.filter((undangan) => undangan.status === "Selesai").length;

  const kartu = (judul: string, nilai: string, keterangan: string) => (
    <div className="kartu-kaca rounded-[1.75rem] p-5">
      <p className="text-sm font-bold text-tintaLembut">{judul}</p>
      <p className="mt-1 font-serif text-3xl font-bold">{nilai}</p>
      <p className="mt-1 text-sm text-tintaLembut">{keterangan}</p>
    </div>
  );

  return (
    <div>
      <h1 className="font-serif text-4xl font-bold">Dasbor Admin</h1>
      <p className="mt-2 max-w-2xl text-[17px] leading-relaxed text-tintaLembut">
        Gambaran cepat isi situs dan respons tamu. Perubahan di sini tersimpan ke database
        dan langsung tampil di situs publik setelah halaman diperbarui.
      </p>
      <p className="mt-2 text-[15px] text-tintaLembut">
        Status undangan: {undanganAktif.length} aktif · {jumlahDraft} draft · {jumlahSelesai} selesai.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kartu("Template aktif", `${templatAktif.length} dari ${toko.templat.length}`, "Template nonaktif disembunyikan dari publik.")}
        {kartu("Undangan aktif", `${undanganAktif.length} dari ${toko.undangan.length}`, "Sisanya berstatus Draft atau Selesai.")}
        {kartu("Harga mulai", formatRupiah(hargaTermurah), "Per bulan, dari paket termurah.")}
        {kartu("Balasan RSVP", String(totalBalasan), "Semua balasan dari semua undangan.")}
        {kartu("Tamu konfirmasi hadir", `${totalTamuHadir} tamu`, `Dari ${totalHadir} balasan hadir.`)}
        {kartu("Total undangan", String(toko.undangan.length), "Dikelola di menu Undangan.")}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="kartu-kaca rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl font-bold">RSVP terbaru</h2>
            <Link href="/admin/undangan" className="min-h-[44px] text-sm font-bold text-tanah-600 underline underline-offset-4">
              Kelola undangan
            </Link>
          </div>
          {rsvpTerbaru.length === 0 ? (
            <p className="mt-4 text-[15px] text-tintaLembut">Belum ada balasan RSVP. Balasan pertama akan muncul di sini begitu tamu mengisi formulir di halaman tamu.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {rsvpTerbaru.map((rsvp) => (
                <li key={rsvp.id} className="rounded-2xl bg-white/70 px-4 py-3">
                  <p className="font-bold">
                    {rsvp.nama}
                    <span className="ml-2 rounded-full bg-daun-100 px-2 py-0.5 text-xs font-bold text-daun-700">
                      {rsvp.kehadiran === "Hadir" ? `Hadir · ${rsvp.jumlahTamu} tamu` : rsvp.kehadiran === "Ragu" ? "Masih ragu" : "Tidak bisa hadir"}
                    </span>
                  </p>
                  <p className="text-sm text-tintaLembut">
                    {rsvp.namaUndangan} · {rsvp.dibuatPada}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="kartu-kaca rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl font-bold">RSVP per undangan</h2>
            <Link href="/admin/undangan" className="min-h-[44px] text-sm font-bold text-tanah-600 underline underline-offset-4">
              Kelola undangan
            </Link>
          </div>
          {daftarRingkasan.length === 0 ? (
            <p className="mt-4 text-[15px] text-tintaLembut">Belum ada undangan. Tambah dari menu Undangan.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {daftarRingkasan.map(({ undangan, ringkasan }) => (
                <li key={undangan.id} className="rounded-2xl bg-white/70 px-4 py-3">
                  <p className="font-bold">
                    {undangan.namaPertama}
                    {undangan.namaKedua ? ` dan ${undangan.namaKedua}` : ""}
                  </p>
                  <p className="text-sm text-tintaLembut">
                    {ringkasan.totalBalasan} balasan · {ringkasan.hadir} hadir ({ringkasan.totalTamuHadir} tamu) · {undangan.status}
                  </p>
                  <Link href={`/admin/undangan/${undangan.id}`} className="text-sm font-bold text-tanah-600 underline underline-offset-4">
                    Lihat detail RSVP
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="kartu-kaca rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl font-bold">Undangan terbaru</h2>
            <Link href="/admin/undangan" className="min-h-[44px] text-sm font-bold text-tanah-600 underline underline-offset-4">
              Kelola undangan
            </Link>
          </div>
          {undanganTerbaru.length === 0 ? (
            <p className="mt-4 text-[15px] text-tintaLembut">Belum ada undangan. Tambah dari menu Undangan.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {undanganTerbaru.map((undangan) => (
                <li key={undangan.id} className="rounded-2xl bg-white/70 px-4 py-3">
                  <p className="font-bold">
                    {undangan.namaPertama}
                    {undangan.namaKedua ? ` dan ${undangan.namaKedua}` : ""}
                  </p>
                  <p className="text-sm text-tintaLembut">
                    {undangan.jenisAcara} · {formatTanggalIndonesia(undangan.tanggal)} · {undangan.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="kartu-kaca rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl font-bold">Template</h2>
            <Link href="/admin/templat" className="min-h-[44px] text-sm font-bold text-tanah-600 underline underline-offset-4">
              Kelola template
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {toko.templat.map((templat) => (
              <li key={templat.slug} className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-4 py-3">
                <span>
                  <span className="font-bold">{templat.nama}</span>
                  <span className="block text-sm text-tintaLembut">{templat.jenisAcara} · {templat.nuansa}</span>
                </span>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${templat.aktif ? "bg-daun-100 text-daun-700" : "bg-krem-200 text-tintaLembut"}`}>
                  {templat.aktif ? "Aktif" : "Nonaktif"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
