import Link from "next/link";
import { daftarPengguna } from "@/lib/aksiOtentikasi";
import { lanjutAman } from "@/lib/lanjut";

// Halaman daftar pengguna biasa. Kata sandi minimal 8 karakter dan
// langsung di-hash sebelum disimpan; akun baru berperang "pengguna".
export default function Daftar({
  searchParams,
}: {
  searchParams?: { galat?: string; lanjut?: string };
}) {
  // lanjut hanya yang ada di daftar putih lib/lanjut.ts yang diteruskan.
  const lanjut = lanjutAman(searchParams?.lanjut);
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="kartu-kaca rounded-[2rem] p-6 sm:p-8">
        <h1 className="font-serif text-3xl font-bold">Daftar Akun</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-tintaLembut">
          {lanjut
            ? "Buat akun untuk melanjutkan. Setelah daftar, kamu kembali ke halaman yang tadi kamu buka."
            : "Buat akun untuk mulai mengelola undanganmu."}
        </p>
        {searchParams?.galat && (
          <p role="alert" className="mt-4 rounded-2xl bg-terakota-100 px-4 py-3 text-sm font-bold text-tanah-700">
            {searchParams.galat === "sudah-ada"
              ? "Email ini sudah terdaftar. Silakan masuk."
              : "Periksa kembali: email harus valid dan kata sandi minimal 8 karakter."}
          </p>
        )}
        <form action={daftarPengguna} className="mt-6">
          {lanjut && <input type="hidden" name="lanjut" value={lanjut} />}
          <label htmlFor="nama" className="text-sm font-bold">Nama</label>
          <input id="nama" name="nama" autoComplete="name" className="mt-2 min-h-[48px] w-full rounded-2xl border border-tanah-900/15 bg-white/80 px-4 py-3" />
          <label htmlFor="email" className="mt-4 block text-sm font-bold">Email</label>
          <input id="email" name="email" type="email" required autoComplete="username" className="mt-2 min-h-[48px] w-full rounded-2xl border border-tanah-900/15 bg-white/80 px-4 py-3" />
          <label htmlFor="kataSandi" className="mt-4 block text-sm font-bold">Kata sandi (minimal 8 karakter)</label>
          <input id="kataSandi" name="kataSandi" type="password" required minLength={8} autoComplete="new-password" className="mt-2 min-h-[48px] w-full rounded-2xl border border-tanah-900/15 bg-white/80 px-4 py-3" />
          <button type="submit" className="tombol-utama mt-5 w-full bg-tanah-600 text-sm text-white hover:bg-tanah-700">
            Daftar
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Sudah punya akun?{" "}
          <Link href={lanjut ? `/masuk?lanjut=${lanjut}` : "/masuk"} className="font-bold text-tanah-600 underline underline-offset-4">Masuk</Link>.
        </p>
      </div>
    </div>
  );
}
