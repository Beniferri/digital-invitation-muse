import Link from "next/link";
import { wajibAdmin } from "@/lib/sesi";
import { cariAdmin } from "@/lib/dasborAdmin";
import { formatRupiah } from "@/data/paketHarga";

export const dynamic = "force-dynamic";

// Hasil pencarian global admin: akun, undangan, dan pesanan.
// Setiap hasil menaut ke halaman yang sudah ada (pengguna terfilter,
// detail undangan, daftar pesanan) supaya tidak ada tautan buntu.
export default async function CariAdmin({ searchParams }: { searchParams: { q?: string | string[] } }) {
  await wajibAdmin();
  const kata = (Array.isArray(searchParams.q) ? (searchParams.q[0] ?? "") : (searchParams.q ?? "")).trim();
  const hasil = kata ? await cariAdmin(kata) : null;
  const total = hasil ? hasil.pengguna.length + hasil.undangan.length + hasil.pesanan.length : 0;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-stone-900">Hasil pencarian</h1>
      {!kata ? (
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-stone-500">
          Masukkan kata kunci di kolom pencarian atas: email pengguna, nama undangan, kode tamu,
          atau order ID pesanan.
        </p>
      ) : (
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-stone-500">
          {total} hasil untuk “{kata}”.
        </p>
      )}

      {hasil && (
        <div className="mt-8 grid gap-10">
          <section>
            <h2 className="text-xl font-bold text-stone-900">Akun ({hasil.pengguna.length})</h2>
            {hasil.pengguna.length === 0 ? (
              <p className="mt-2 text-stone-500">Tidak ada akun yang cocok.</p>
            ) : (
              <ul className="mt-3 grid gap-3">
                {hasil.pengguna.map((pengguna) => (
                  <li key={pengguna.email} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                    <Link href={`/admin/pengguna?q=${encodeURIComponent(pengguna.email)}`} className="font-bold text-[#2F4A2E] underline underline-offset-4">
                      {pengguna.email}
                    </Link>
                    <p className="mt-1 text-sm text-stone-500">
                      <span className={`mr-1 rounded-full px-2 py-0.5 text-xs font-bold ${pengguna.peran === "admin" ? "bg-[#E9F0E9] text-[#2F4A2E]" : "bg-stone-100 text-stone-600"}`}>
                        {pengguna.peran === "admin" ? "Admin" : "Pengguna"}
                      </span>
                      · {pengguna.jumlahUndangan} undangan
                      {pengguna.langgananAktif ? ` · Langganan ${pengguna.langgananAktif}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900">Undangan ({hasil.undangan.length})</h2>
            {hasil.undangan.length === 0 ? (
              <p className="mt-2 text-stone-500">Tidak ada undangan yang cocok.</p>
            ) : (
              <ul className="mt-3 grid gap-3">
                {hasil.undangan.map((undangan) => (
                  <li key={undangan.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                    <Link href={`/admin/undangan/${undangan.id}`} className="font-bold text-[#2F4A2E] underline underline-offset-4">
                      {undangan.nama}
                    </Link>
                    <p className="mt-1 text-sm text-stone-500">
                      {undangan.jenisAcara} ·{" "}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${undangan.status === "Aktif" ? "bg-[#E9F0E9] text-[#2F4A2E]" : undangan.status === "Draft" ? "bg-stone-100 text-stone-600" : "bg-stone-200 text-stone-700"}`}>
                        {undangan.status}
                      </span>
                      {undangan.email ? ` · ${undangan.email}` : ""}
                      {undangan.kodeTamu ? ` · kode ${undangan.kodeTamu}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900">Pesanan ({hasil.pesanan.length})</h2>
            {hasil.pesanan.length === 0 ? (
              <p className="mt-2 text-stone-500">Tidak ada pesanan yang cocok.</p>
            ) : (
              <ul className="mt-3 grid gap-3">
                {hasil.pesanan.map((pesanan) => (
                  <li key={pesanan.orderId} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                    <Link href="/admin/pesanan" className="font-bold text-[#2F4A2E] underline underline-offset-4">
                      {pesanan.orderId}
                    </Link>
                    <p className="mt-1 text-sm text-stone-500">
                      {pesanan.email} · Paket {pesanan.namaPaket} · {formatRupiah(pesanan.nominal)} ·{" "}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${pesanan.status === "Lunas" ? "bg-[#E9F0E9] text-[#2F4A2E]" : pesanan.status === "Gagal" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
                        {pesanan.status}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
