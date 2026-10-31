import { tambahUndangan } from "@/lib/aksiAdmin";
import type { Templat } from "@/data/templat";

// Formulir tambah undangan. Dipakai admin dan pengguna dengan aksi yang
// berbeda: admin memakai tambahUndangan (tanpa pemilik), pengguna memakai
// tambahUndanganPengguna (undangan tercatat atas id mereka sendiri).
const gayaInput =
  "mt-2 min-h-[48px] w-full rounded-2xl border border-tanah-900/15 bg-white/80 px-4 py-3 text-[15px]";
const gayaLabel = "text-sm font-bold";

export default function FormulirUndangan({
  daftarTemplat,
  galat,
  aksi = tambahUndangan,
}: {
  daftarTemplat: Templat[];
  galat?: boolean;
  aksi?: (formulir: FormData) => Promise<void>;
}) {
  return (
    <form action={aksi} className="kartu-kaca rounded-[2rem] p-5 sm:p-7">
      {galat && (
        <p role="alert" className="mb-5 rounded-2xl bg-terakota-100 px-4 py-3 text-sm font-bold text-tanah-700">
          Gagal menambah undangan. Nama pertama wajib diisi.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="namaPertama" className={gayaLabel}>Nama pertama</label>
          <input id="namaPertama" name="namaPertama" required className={gayaInput} />
        </div>
        <div>
          <label htmlFor="namaKedua" className={gayaLabel}>Nama kedua (opsional)</label>
          <input id="namaKedua" name="namaKedua" className={gayaInput} />
        </div>
        <div>
          <label htmlFor="jenisAcara" className={gayaLabel}>Jenis acara</label>
          <select id="jenisAcara" name="jenisAcara" className={gayaInput}>
            {["Pernikahan", "Khitanan", "Aqiqah", "Ulang Tahun", "Wisuda", "Syukuran", "Perusahaan"].map((jenis) => (
              <option key={jenis} value={jenis}>{jenis}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tanggal" className={gayaLabel}>Tanggal</label>
          <input id="tanggal" name="tanggal" type="date" className={gayaInput} />
        </div>
        <div>
          <label htmlFor="lokasi" className={gayaLabel}>Lokasi</label>
          <input id="lokasi" name="lokasi" className={gayaInput} />
        </div>
        <div>
          <label htmlFor="slugTemplat" className={gayaLabel}>Template yang dipakai</label>
          <select id="slugTemplat" name="slugTemplat" className={gayaInput}>
            {daftarTemplat.map((templat) => (
              <option key={templat.slug} value={templat.slug}>
                {templat.nama} ({templat.slug})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className={gayaLabel}>Status</label>
          <select id="status" name="status" className={gayaInput}>
            <option value="Draft">Draft</option>
            <option value="Aktif">Aktif</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>
      <button type="submit" className="tombol-utama mt-7 w-full bg-tanah-600 text-sm text-white hover:bg-tanah-700">
        Tambah Undangan
      </button>
    </form>
  );
}
