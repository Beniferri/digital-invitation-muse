import Link from "next/link";
import { hapusUndangan, ubahStatusUndangan } from "@/lib/aksiAdmin";
import { bacaDaftarUndangan, bacaRingkasanRsvp } from "@/lib/tokoData";
import { formatTanggalIndonesia } from "@/lib/format";
import { wajibAdmin } from "@/lib/sesi";

export const dynamic = "force-dynamic";

const daftarStatus = ["Draft", "Aktif", "Selesai"] as const;

// Daftar undangan yang dikelola admin. Status bisa diubah langsung dari daftar,
// tanpa membuka halaman ubah terpisah.
export default async function DaftarUndanganAdmin() {
  await wajibAdmin();
  const daftarDasar = await bacaDaftarUndangan();
  const daftar = await Promise.all(
    daftarDasar.map(async (undangan) => ({
      ...undangan,
      ringkasan: await bacaRingkasanRsvp(undangan.id),
    })),
  );
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">Undangan</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-stone-500">
            Daftar undangan yang sedang dikelola. Ini bukan data editor pengunjung
            (yang memang tidak disimpan), melainkan catatan admin.
          </p>
        </div>
        <Link href="/admin/undangan/baru" className="min-h-[44px] rounded-full bg-[#2F4A2E] px-5 py-3 text-sm font-bold text-white hover:bg-[#243A24]">
          Tambah Undangan
        </Link>
      </div>

      <div className="mt-8 grid gap-4">
        {daftar.map((undangan) => (
          <article key={undangan.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-stone-900">
                  {undangan.namaPertama}
                  {undangan.namaKedua ? ` dan ${undangan.namaKedua}` : ""}
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  {undangan.jenisAcara} · {formatTanggalIndonesia(undangan.tanggal)} · {undangan.lokasi}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  Template: {undangan.slugTemplat} · Dibuat: {undangan.dibuatPada}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  RSVP: {undangan.ringkasan.totalBalasan} balasan · {undangan.ringkasan.hadir} hadir ({undangan.ringkasan.totalTamuHadir} tamu) · Tautan tamu: /u/{undangan.kodeTamu}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${undangan.status === "Aktif" ? "bg-[#E9F0E9] text-[#2F4A2E]" : undangan.status === "Draft" ? "bg-stone-100 text-stone-600" : "bg-stone-200 text-stone-700"}`}>
                {undangan.status}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <form action={ubahStatusUndangan} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={undangan.id} />
                <label htmlFor={`status-${undangan.id}`} className="text-sm font-bold text-stone-900">Ubah status:</label>
                <select
                  id={`status-${undangan.id}`}
                  name="status"
                  defaultValue={undangan.status}
                  className="min-h-[44px] rounded-full border border-stone-300 bg-white px-3 text-sm font-bold text-stone-900"
                >
                  {daftarStatus.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <button type="submit" className="min-h-[44px] rounded-full border border-stone-300 bg-white px-4 text-sm font-bold text-stone-700 hover:bg-stone-50">
                  Simpan status
                </button>
              </form>
              <form action={hapusUndangan}>
                <input type="hidden" name="id" value={undangan.id} />
                <button type="submit" className="min-h-[44px] rounded-full bg-red-50 px-4 text-sm font-bold text-red-700 hover:bg-red-100">
                  Hapus
                </button>
              </form>
              <Link href={`/admin/undangan/${undangan.id}`} className="min-h-[44px] text-sm font-bold text-[#2F4A2E] underline underline-offset-4">
                Lihat RSVP
              </Link>
              <Link href={`/u/${undangan.kodeTamu}`} className="min-h-[44px] text-sm font-bold text-[#2F4A2E] underline underline-offset-4">
                Halaman tamu
              </Link>
              <Link href={`/undangan/${undangan.slugTemplat}`} className="min-h-[44px] text-sm font-bold text-[#2F4A2E] underline underline-offset-4">
                Lihat template-nya
              </Link>
            </div>
          </article>
        ))}
      </div>
      {daftar.length === 0 && (
        <p className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 text-center text-stone-500 shadow-sm">
          Belum ada undangan. Tambah dari tombol di atas.
        </p>
      )}
    </div>
  );
}
