import Link from "next/link";
import { notFound } from "next/navigation";
import { hapusRsvp } from "@/lib/aksiAdmin";
import { bacaDaftarRsvp, bacaRingkasanRsvp, cariUndanganOlehId } from "@/lib/tokoData";
import { formatTanggalIndonesia } from "@/lib/format";
import { wajibAdmin } from "@/lib/sesi";

export const dynamic = "force-dynamic";

// Detail RSVP satu undangan untuk admin: ringkasan, tautan tamu yang
// dibagikan, dan daftar balasan lengkap dengan tombol hapus untuk
// membersihkan balasan spam atau salah isi.
export default async function DetailRsvpAdmin({ params }: { params: { id: string } }) {
  await wajibAdmin();
  const undangan = await cariUndanganOlehId(params.id);
  if (!undangan) notFound();

  const ringkasan = await bacaRingkasanRsvp(undangan.id);
  const daftar = await bacaDaftarRsvp(undangan.id);

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

      <div className="mt-10 grid gap-4">
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
        <p className="kartu-kaca mt-10 rounded-[2rem] p-6 text-center text-tintaLembut">
          Belum ada balasan RSVP untuk undangan ini.
        </p>
      )}
    </div>
  );
}
