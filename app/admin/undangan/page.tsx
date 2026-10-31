import Link from "next/link";
import { hapusUndangan, ubahStatusUndangan } from "@/lib/aksiAdmin";
import { bacaDaftarUndangan } from "@/lib/tokoData";
import { formatTanggalIndonesia } from "@/lib/format";
import { wajibAdmin } from "@/lib/sesi";

export const dynamic = "force-dynamic";

const daftarStatus = ["Draft", "Aktif", "Selesai"] as const;

// Daftar undangan yang dikelola admin. Status bisa diubah langsung dari daftar,
// tanpa membuka halaman ubah terpisah.
export default async function DaftarUndanganAdmin() {
  await wajibAdmin();
  const daftar = await bacaDaftarUndangan();
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-bold">Undangan</h1>
          <p className="mt-2 max-w-xl text-[17px] leading-relaxed text-tintaLembut">
            Daftar undangan yang sedang dikelola. Ini bukan data editor pengunjung
            (yang memang tidak disimpan), melainkan catatan admin.
          </p>
        </div>
        <Link href="/admin/undangan/baru" className="tombol-utama bg-tanah-600 text-sm text-white hover:bg-tanah-700">
          Tambah Undangan
        </Link>
      </div>

      <div className="mt-8 grid gap-4">
        {daftar.map((undangan) => (
          <article key={undangan.id} className="kartu-kaca rounded-[1.75rem] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl font-bold">
                  {undangan.namaPertama}
                  {undangan.namaKedua ? ` dan ${undangan.namaKedua}` : ""}
                </h2>
                <p className="mt-1 text-sm text-tintaLembut">
                  {undangan.jenisAcara} · {formatTanggalIndonesia(undangan.tanggal)} · {undangan.lokasi}
                </p>
                <p className="mt-1 text-sm text-tintaLembut">
                  Template: {undangan.slugTemplat} · Dibuat: {undangan.dibuatPada}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-daun-100 px-3 py-1 text-xs font-bold text-daun-700">
                {undangan.status}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <form action={ubahStatusUndangan} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={undangan.id} />
                <label htmlFor={`status-${undangan.id}`} className="text-sm font-bold">Ubah status:</label>
                <select
                  id={`status-${undangan.id}`}
                  name="status"
                  defaultValue={undangan.status}
                  className="min-h-[44px] rounded-full border border-tanah-900/15 bg-white/80 px-3 text-sm font-bold"
                >
                  {daftarStatus.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <button type="submit" className="min-h-[44px] rounded-full border-2 border-tanah-600 px-4 text-sm font-bold text-tanah-700">
                  Simpan status
                </button>
              </form>
              <form action={hapusUndangan}>
                <input type="hidden" name="id" value={undangan.id} />
                <button type="submit" className="min-h-[44px] rounded-full bg-terakota-100 px-4 text-sm font-bold text-tanah-700">
                  Hapus
                </button>
              </form>
              <Link href={`/undangan/${undangan.slugTemplat}`} className="min-h-[44px] text-sm font-bold text-tanah-600 underline underline-offset-4">
                Lihat template-nya
              </Link>
            </div>
          </article>
        ))}
      </div>
      {daftar.length === 0 && (
        <p className="kartu-kaca mt-8 rounded-[2rem] p-6 text-center text-tintaLembut">
          Belum ada undangan. Tambah dari tombol di atas.
        </p>
      )}
    </div>
  );
}
