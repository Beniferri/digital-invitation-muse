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
      <h1 className="font-serif text-4xl font-bold">Hasil pencarian</h1>
      {!kata ? (
        <p className="mt-2 max-w-2xl text-[17px] leading-relaxed text-tintaLembut">
          Masukkan kata kunci di kolom pencarian atas: email pengguna, nama undangan, kode tamu,
          atau order ID pesanan.
        </p>
      ) : (
        <p className="mt-2 max-w-2xl text-[17px] leading-relaxed text-tintaLembut">
          {total} hasil untuk “{kata}”.
        </p>
      )}

      {hasil && (
        <div className="mt-8 grid gap-10">
          <section>
            <h2 className="font-serif text-2xl font-bold">Akun ({hasil.pengguna.length})</h2>
            {hasil.pengguna.length === 0 ? (
              <p className="mt-2 text-tintaLembut">Tidak ada akun yang cocok.</p>
            ) : (
              <ul className="mt-3 grid gap-3">
                {hasil.pengguna.map((pengguna) => (
                  <li key={pengguna.email} className="kartu-kaca rounded-[1.5rem] p-4">
                    <Link href={`/admin/pengguna?q=${encodeURIComponent(pengguna.email)}`} className="font-bold underline underline-offset-4">
                      {pengguna.email}
                    </Link>
                    <p className="text-sm text-tintaLembut">
                      {pengguna.peran === "admin" ? "Admin" : "Pengguna"} · {pengguna.jumlahUndangan} undangan
                      {pengguna.langgananAktif ? ` · Langganan ${pengguna.langgananAktif}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold">Undangan ({hasil.undangan.length})</h2>
            {hasil.undangan.length === 0 ? (
              <p className="mt-2 text-tintaLembut">Tidak ada undangan yang cocok.</p>
            ) : (
              <ul className="mt-3 grid gap-3">
                {hasil.undangan.map((undangan) => (
                  <li key={undangan.id} className="kartu-kaca rounded-[1.5rem] p-4">
                    <Link href={`/admin/undangan/${undangan.id}`} className="font-bold underline underline-offset-4">
                      {undangan.nama}
                    </Link>
                    <p className="text-sm text-tintaLembut">
                      {undangan.jenisAcara} · {undangan.status}
                      {undangan.email ? ` · ${undangan.email}` : ""}
                      {undangan.kodeTamu ? ` · kode ${undangan.kodeTamu}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold">Pesanan ({hasil.pesanan.length})</h2>
            {hasil.pesanan.length === 0 ? (
              <p className="mt-2 text-tintaLembut">Tidak ada pesanan yang cocok.</p>
            ) : (
              <ul className="mt-3 grid gap-3">
                {hasil.pesanan.map((pesanan) => (
                  <li key={pesanan.orderId} className="kartu-kaca rounded-[1.5rem] p-4">
                    <Link href="/admin/pesanan" className="font-bold underline underline-offset-4">
                      {pesanan.orderId}
                    </Link>
                    <p className="text-sm text-tintaLembut">
                      {pesanan.email} · Paket {pesanan.namaPaket} · {formatRupiah(pesanan.nominal)} · {pesanan.status}
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
