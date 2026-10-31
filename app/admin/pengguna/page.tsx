import { wajibAdmin } from "@/lib/sesi";
import { bacaDaftarPenggunaAdmin } from "@/lib/dasborAdmin";
import { formatTanggalIndonesia } from "@/lib/format";

export const dynamic = "force-dynamic";

// Daftar pengguna & akun untuk admin: email, peran, tanggal daftar,
// jumlah undangan, dan langganan aktifnya. Pencarian lewat parameter
// tautan (GET) supaya tetap jalan tanpa JavaScript.
export default async function PenggunaAdmin({
  searchParams,
}: {
  searchParams: { q?: string | string[] };
}) {
  await wajibAdmin();
  const cari = (Array.isArray(searchParams.q) ? (searchParams.q[0] ?? "") : (searchParams.q ?? "")).trim();
  const daftar = await bacaDaftarPenggunaAdmin(cari);

  return (
    <div>
      <h1 className="font-serif text-4xl font-bold">Pengguna &amp; Akun</h1>
      <p className="mt-2 max-w-2xl text-[17px] leading-relaxed text-tintaLembut">
        {daftar.length} akun{cari ? ` cocok dengan “${cari}”` : ""}. Kata sandi tidak pernah
        ditampilkan di sini — yang tersimpan di database hanya hash-nya.
      </p>

      <form method="get" className="mt-6 flex flex-wrap gap-3">
        <label htmlFor="cari-pengguna" className="sr-only">
          Cari pengguna
        </label>
        <input
          id="cari-pengguna"
          type="search"
          name="q"
          defaultValue={cari}
          placeholder="Cari email atau nama…"
          className="min-h-[44px] min-w-0 flex-1 rounded-full border border-krem-300 bg-white/80 px-4 text-[15px] outline-none"
        />
        <button type="submit" className="tombol-utama bg-tanah-600 text-sm text-white">
          Cari
        </button>
      </form>

      {daftar.length === 0 ? (
        <p className="kartu-kaca mt-4 rounded-[2rem] p-6 text-center text-tintaLembut">
          {cari ? "Tidak ada akun yang cocok dengan pencarian." : "Belum ada akun."}
        </p>
      ) : (
        <div className="mt-4 grid gap-3">
          {daftar.map((pengguna) => (
            <article key={pengguna.email} className="kartu-kaca rounded-[1.5rem] p-4">
              <p className="font-bold">
                {pengguna.email}
                {pengguna.nama ? ` · ${pengguna.nama}` : ""}
                <span className="ml-2 rounded-full bg-daun-100 px-2 py-0.5 text-xs font-bold text-daun-700">
                  {pengguna.peran === "admin" ? "Admin" : "Pengguna"}
                </span>
              </p>
              <p className="mt-1 text-sm text-tintaLembut">
                Daftar {pengguna.dibuatPada} · {pengguna.jumlahUndangan} undangan ·{" "}
                {pengguna.langgananAktif
                  ? `Langganan ${pengguna.langgananAktif} sampai ${pengguna.langgananBerakhir ? formatTanggalIndonesia(pengguna.langgananBerakhir) : ""}`
                  : "Tidak ada langganan aktif"}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
