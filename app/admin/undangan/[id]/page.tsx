import Link from "next/link";
import { notFound } from "next/navigation";
import { hapusRsvp } from "@/lib/aksiAdmin";
import {
  bacaDaftarRsvpTersaring,
  bacaRingkasanRsvp,
  cariUndanganOlehId,
  kehadiranBersih,
} from "@/lib/tokoData";
import { labelKehadiran } from "@/lib/csvRsvp";
import { formatTanggalIndonesia } from "@/lib/format";
import { wajibAdmin } from "@/lib/sesi";

export const dynamic = "force-dynamic";

// Detail RSVP satu undangan untuk admin: ringkasan, tautan tamu yang
// dibagikan, dan daftar balasan lengkap dengan tombol hapus untuk
// membersihkan balasan spam atau salah isi. Tahap 3 menambah filter
// kehadiran (parameter ?kehadiran=Hadir/Ragu/Tidak), tombol unduh CSV,
// dan sorotan total tamu yang akan datang. Ringkasan SELALU dari daftar
// penuh — filter hanya mengubah daftar yang tampil, bukan angka ringkasan.
export default async function DetailRsvpAdmin({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { kehadiran?: string };
}) {
  await wajibAdmin();
  const undangan = await cariUndanganOlehId(params.id);
  if (!undangan) notFound();

  const filter = kehadiranBersih(searchParams?.kehadiran);
  const ringkasan = await bacaRingkasanRsvp(undangan.id);
  const daftar = await bacaDaftarRsvpTersaring(undangan.id, filter);
  const dasarFilter = `/admin/undangan/${undangan.id}`;

  return (
    <div>
      <Link href="/admin/undangan" className="text-sm font-bold text-tanah-600 underline underline-offset-4">
        Kembali ke daftar undangan
      </Link>
      <h1 className="mt-4 font-serif text-4xl font-bold">
        RSVP · {undangan.namaPertama}
        {undangan.namaKedua ? ` dan ${undangan.namaKedua}` : ""}
      </h1>
      <p className="mt-2 max-w-2xl text-[17px] leading-relaxed text-tintaLembut">
        {undangan.jenisAcara} · {formatTanggalIndonesia(undangan.tanggal)} · {undangan.lokasi} · Status: {undangan.status}
      </p>
      <p className="mt-2 text-[15px] text-tintaLembut">
        Tautan tamu: <Link href={`/u/${undangan.kodeTamu}`} className="font-bold text-tanah-600 underline underline-offset-4">/u/{undangan.kodeTamu}</Link>
        {" "}— bagikan tautan ini ke tamu lewat WhatsApp.
      </p>

      <p role="status" className="mt-8 rounded-2xl bg-daun-100 px-4 py-3 text-[15px] font-bold text-daun-700">
        Tamu yang akan datang: {ringkasan.totalTamuHadir} tamu
        <span className="font-normal">
          {" "}— dihitung dari {ringkasan.hadir} balasan Hadir saja. Balasan Masih ragu
          ({ringkasan.totalTamuRagu} tamu potensial) belum dihitung, dan Tidak bisa hadir tidak dihitung.
        </span>
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { judul: "Total balasan", nilai: String(ringkasan.totalBalasan) },
          { judul: "Hadir", nilai: `${ringkasan.hadir} balasan · ${ringkasan.totalTamuHadir} tamu` },
          { judul: "Masih ragu", nilai: `${ringkasan.ragu} balasan · ${ringkasan.totalTamuRagu} tamu` },
          { judul: "Tidak bisa hadir", nilai: String(ringkasan.tidak) },
        ].map((kartu) => (
          <div key={kartu.judul} className="kartu-kaca rounded-[1.75rem] p-5">
            <p className="text-sm font-bold text-tintaLembut">{kartu.judul}</p>
            <p className="mt-1 font-serif text-2xl font-bold">{kartu.nilai}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Filter RSVP berdasarkan kehadiran" className="flex flex-wrap gap-2 text-sm font-bold">
          <Link href={dasarFilter} className={`min-h-[44px] rounded-full px-4 py-2 ${!filter ? "bg-tanah-600 text-white" : "border-2 border-tanah-600 text-tanah-700"}`}>
            Semua ({ringkasan.totalBalasan})
          </Link>
          {([
            { nilai: "Hadir", jumlah: ringkasan.hadir },
            { nilai: "Ragu", jumlah: ringkasan.ragu },
            { nilai: "Tidak", jumlah: ringkasan.tidak },
          ] as const).map((pilihan) => (
            <Link
              key={pilihan.nilai}
              href={`${dasarFilter}?kehadiran=${pilihan.nilai}`}
              className={`min-h-[44px] rounded-full px-4 py-2 ${filter === pilihan.nilai ? "bg-tanah-600 text-white" : "border-2 border-tanah-600 text-tanah-700"}`}
            >
              {labelKehadiran(pilihan.nilai)} ({pilihan.jumlah})
            </Link>
          ))}
        </nav>
        <a href={`/api/rsvp/${undangan.id}/csv`} className="tombol-utama shrink-0 bg-tanah-600 text-sm text-white hover:bg-tanah-700">
          Unduh CSV
        </a>
      </div>
      <p className="mt-3 text-sm text-tintaLembut">
        CSV berisi semua balasan (bukan yang terfilter), supaya jumlah barisnya sama dengan total balasan di atas.
      </p>

      <div className="mt-6 grid gap-4">
        {daftar.map((rsvp) => (
          <article key={rsvp.id} className="kartu-kaca flex flex-wrap items-start justify-between gap-3 rounded-[1.75rem] p-5">
            <div>
              <p className="font-bold">
                {rsvp.nama}
                <span className="ml-2 rounded-full bg-daun-100 px-3 py-1 text-xs font-bold text-daun-700">
                  {rsvp.kehadiran === "Hadir" ? `Hadir · ${rsvp.jumlahTamu} tamu` : rsvp.kehadiran === "Ragu" ? `Masih ragu · ${rsvp.jumlahTamu} tamu` : "Tidak bisa hadir"}
                </span>
              </p>
              {rsvp.pesan && <p className="mt-2 text-[15px] leading-relaxed text-tinta">{rsvp.pesan}</p>}
              <p className="mt-2 text-sm text-tintaLembut">Dikirim: {rsvp.dibuatPada}</p>
            </div>
            <form action={hapusRsvp}>
              <input type="hidden" name="id" value={rsvp.id} />
              <button type="submit" className="min-h-[44px] rounded-full bg-terakota-100 px-4 text-sm font-bold text-tanah-700">
                Hapus balasan
              </button>
            </form>
          </article>
        ))}
      </div>
      {daftar.length === 0 && (
        <p className="kartu-kaca mt-6 rounded-[2rem] p-6 text-center text-tintaLembut">
          {filter
            ? `Tidak ada balasan dengan status ${labelKehadiran(filter)} untuk undangan ini.`
            : "Belum ada balasan RSVP untuk undangan ini."}
        </p>
      )}
    </div>
  );
}
