import { simpanTemplat } from "@/lib/aksiAdmin";
import type { Templat } from "@/data/templat";

// Formulir tambah/ubah template. Satu formulir untuk dua keperluan:
// kalau ada slugLama, berarti mengubah; kalau kosong, berarti menambah.
// Gaya visual (bentuk kartu, pola) diturunkan otomatis dari warna dan nuansa
// di server action, jadi admin tidak perlu memilih kelas Tailwind.

const gayaInput =
  "mt-2 min-h-[48px] w-full rounded-2xl border border-tanah-900/15 bg-white/80 px-4 py-3 text-[15px]";

const gayaLabel = "text-sm font-bold";

export default function FormulirTemplat({
  templat,
  galat,
}: {
  templat?: Templat;
  galat?: boolean;
}) {
  const sedangMengubah = Boolean(templat);
  return (
    <form action={simpanTemplat} className="kartu-kaca rounded-[2rem] p-5 sm:p-7">
      {galat && (
        <p role="alert" className="mb-5 rounded-2xl bg-terakota-100 px-4 py-3 text-sm font-bold text-tanah-700">
          Gagal menyimpan. Periksa nama dan slug: slug hanya boleh huruf kecil,
          angka, dan tanda hubung, dan belum dipakai template lain.
        </p>
      )}
      <input type="hidden" name="slugLama" value={templat?.slug ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nama" className={gayaLabel}>Nama template</label>
          <input id="nama" name="nama" required defaultValue={templat?.nama ?? ""} placeholder="Contoh: Seruni" className={gayaInput} />
        </div>
        <div>
          <label htmlFor="slug" className={gayaLabel}>Slug (dipakai di tautan)</label>
          <input id="slug" name="slug" required defaultValue={templat?.slug ?? ""} placeholder="Contoh: seruni-akad-nikah" className={gayaInput} />
          <p className="mt-1 text-xs text-tintaLembut">Tautan jadinya: /undangan/[slug]</p>
        </div>
        <div>
          <label htmlFor="jenisAcara" className={gayaLabel}>Jenis acara</label>
          <select id="jenisAcara" name="jenisAcara" defaultValue={templat?.jenisAcara ?? "Pernikahan"} className={gayaInput}>
            {["Pernikahan", "Khitanan", "Aqiqah", "Ulang Tahun", "Wisuda", "Syukuran", "Perusahaan"].map((jenis) => (
              <option key={jenis} value={jenis}>{jenis}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="warna" className={gayaLabel}>Warna</label>
            <select id="warna" name="warna" defaultValue={templat?.warna ?? "Emas"} className={gayaInput}>
              <option value="Emas">Emas</option>
              <option value="Hijau">Hijau</option>
              <option value="Terakota">Terakota</option>
            </select>
          </div>
          <div>
            <label htmlFor="nuansa" className={gayaLabel}>Nuansa</label>
            <select id="nuansa" name="nuansa" defaultValue={templat?.nuansa ?? "Tradisional"} className={gayaInput}>
              <option value="Tradisional">Tradisional</option>
              <option value="Islami">Islami</option>
              <option value="Modern">Modern</option>
              <option value="Minimalis">Minimalis</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="fotoSampul" className={gayaLabel}>Foto sampul (opsional)</label>
        <input
          id="fotoSampul"
          name="fotoSampul"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="mt-2 block w-full cursor-pointer rounded-2xl border border-dashed border-tanah-900/25 bg-white/70 px-4 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-tanah-600 file:px-4 file:py-2 file:font-bold file:text-white"
        />
        <p className="mt-1 text-xs text-tintaLembut">
          Maksimal 5 MB, format JPG/PNG/WebP. Kalau tidak diunggah, pratinjau memakai foto placeholder.
          {templat?.fotoSampul ? ` Foto saat ini: ${templat.fotoSampul}` : ""}
        </p>
      </div>

      <div className="mt-4">
        <label htmlFor="deskripsi" className={gayaLabel}>Deskripsi singkat</label>
        <textarea id="deskripsi" name="deskripsi" rows={3} defaultValue={templat?.deskripsi ?? ""} className={gayaInput} />
      </div>

      <label className="mt-5 flex min-h-[48px] cursor-pointer items-center gap-3 rounded-2xl bg-white/70 px-4">
        <input type="checkbox" name="aktif" defaultChecked={templat?.aktif ?? true} className="h-5 w-5 accent-[#8A3620]" />
        <span className="text-sm font-bold">Aktif (tampil di situs publik)</span>
      </label>

      <h3 className="mt-8 font-serif text-xl font-bold">Data contoh undangan</h3>
      <p className="mt-1 text-sm text-tintaLembut">
        Data ini yang tampil di halaman contoh dan jadi isian awal editor.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="judulAcara" className={gayaLabel}>Judul acara</label>
          <input id="judulAcara" name="judulAcara" defaultValue={templat?.contoh.judulAcara ?? ""} className={gayaInput} />
        </div>
        <div>
          <label htmlFor="tanggal" className={gayaLabel}>Tanggal</label>
          <input id="tanggal" name="tanggal" type="date" defaultValue={templat?.contoh.tanggal ?? ""} className={gayaInput} />
        </div>
        <div>
          <label htmlFor="namaPertama" className={gayaLabel}>Nama pertama</label>
          <input id="namaPertama" name="namaPertama" defaultValue={templat?.contoh.namaPertama ?? ""} className={gayaInput} />
        </div>
        <div>
          <label htmlFor="namaKedua" className={gayaLabel}>Nama kedua (opsional)</label>
          <input id="namaKedua" name="namaKedua" defaultValue={templat?.contoh.namaKedua ?? ""} className={gayaInput} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="lokasi" className={gayaLabel}>Lokasi</label>
          <input id="lokasi" name="lokasi" defaultValue={templat?.contoh.lokasi ?? ""} className={gayaInput} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="salamPembuka" className={gayaLabel}>Salam pembuka</label>
          <textarea id="salamPembuka" name="salamPembuka" rows={3} defaultValue={templat?.contoh.salamPembuka ?? ""} className={gayaInput} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="kutipan" className={gayaLabel}>Kutipan</label>
          <textarea id="kutipan" name="kutipan" rows={2} defaultValue={templat?.contoh.kutipan ?? ""} className={gayaInput} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="catatan" className={gayaLabel}>Catatan</label>
          <textarea id="catatan" name="catatan" rows={2} defaultValue={templat?.contoh.catatan ?? ""} className={gayaInput} />
        </div>
      </div>

      <button type="submit" className="tombol-utama mt-7 w-full bg-tanah-600 text-sm text-white hover:bg-tanah-700">
        {sedangMengubah ? "Simpan Perubahan Template" : "Tambah Template"}
      </button>
    </form>
  );
}
