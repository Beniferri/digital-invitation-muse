import { kirimRsvp } from "@/lib/aksiRsvp";

// Formulir RSVP tamu. Komponen server biasa: pengiriman ditangani server
// action kirimRsvp, jadi tidak butuh JavaScript di sisi tamu.
// Jumlah tamu tidak dihitung kalau tamu memilih "Tidak bisa hadir"
// (diatur di server), dan itu dijelaskan di bawah kolom jumlah.
const gayaInput =
  "mt-2 min-h-[48px] w-full rounded-2xl border border-tanah-900/15 bg-white/80 px-4 py-3 text-[15px]";
const gayaLabel = "text-sm font-bold";

export default function FormulirRsvp({ kode }: { kode: string }) {
  return (
    <form action={kirimRsvp} className="mt-5 space-y-4">
      <input type="hidden" name="kode" value={kode} />
      <div>
        <label htmlFor="nama-rsvp" className={gayaLabel}>Nama kamu</label>
        <input id="nama-rsvp" name="nama" required minLength={2} maxLength={100} className={gayaInput} placeholder="Tulis nama lengkapmu" />
      </div>
      <fieldset>
        <legend className={gayaLabel}>Kehadiran</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { nilai: "Hadir", label: "Hadir" },
            { nilai: "Ragu", label: "Masih ragu" },
            { nilai: "Tidak", label: "Tidak bisa hadir" },
          ].map((pilihan) => (
            <label
              key={pilihan.nilai}
              className="flex min-h-[48px] cursor-pointer items-center gap-2 rounded-full border border-tanah-900/15 bg-white/80 px-4 text-sm font-bold"
            >
              <input type="radio" name="kehadiran" value={pilihan.nilai} defaultChecked={pilihan.nilai === "Hadir"} />
              {pilihan.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="jumlahTamu" className={gayaLabel}>Jumlah tamu (termasuk kamu)</label>
        <select id="jumlahTamu" name="jumlahTamu" defaultValue="1" className={gayaInput}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((jumlah) => (
            <option key={jumlah} value={jumlah}>{jumlah} orang</option>
          ))}
        </select>
        <p className="mt-1 text-sm text-tintaLembut">Maksimal 10 orang per balasan. Kalau memilih tidak bisa hadir, jumlah ini tidak dihitung.</p>
      </div>
      <div>
        <label htmlFor="pesan-rsvp" className={gayaLabel}>Pesan atau doa (opsional)</label>
        <textarea id="pesan-rsvp" name="pesan" maxLength={500} rows={3} className={gayaInput} placeholder="Tulis doa atau ucapan selamat di sini" />
      </div>
      <button type="submit" className="tombol-utama w-full bg-tanah-600 text-sm text-white hover:bg-tanah-700">
        Kirim Konfirmasi
      </button>
      <p className="text-center text-sm text-tintaLembut">
        Kalau sudah pernah mengisi, kirim ulang saja dengan nama yang sama untuk memperbarui jawabanmu.
      </p>
    </form>
  );
}
