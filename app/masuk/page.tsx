import Link from "next/link";
import { masukPengguna } from "@/lib/aksiOtentikasi";

// Halaman masuk untuk pengguna biasa. Akun admin yang masuk lewat sini
// tetap diarahkan ke /akun; dasbor admin hanya bisa dibuka lewat /admin/login
// dengan akun berperang admin.
export default function Masuk({
  searchParams,
}: {
  searchParams?: { gagal?: string };
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="kartu-kaca rounded-[2rem] p-6 sm:p-8">
        <h1 className="font-serif text-3xl font-bold">Masuk</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-tintaLembut">
          Masuk untuk mengelola akunmu. Undangan yang bisa disimpan akan
          hadir di tahap berikutnya.
        </p>
        {searchParams?.gagal && (
          <p role="alert" className="mt-4 rounded-2xl bg-terakota-100 px-4 py-3 text-sm font-bold text-tanah-700">
            Email atau kata sandi salah.
          </p>
        )}
        <form action={masukPengguna} className="mt-6">
          <label htmlFor="email" className="text-sm font-bold">Email</label>
          <input id="email" name="email" type="email" required autoComplete="username" className="mt-2 min-h-[48px] w-full rounded-2xl border border-tanah-900/15 bg-white/80 px-4 py-3" />
          <label htmlFor="kataSandi" className="mt-4 block text-sm font-bold">Kata sandi</label>
          <input id="kataSandi" name="kataSandi" type="password" required autoComplete="current-password" className="mt-2 min-h-[48px] w-full rounded-2xl border border-tanah-900/15 bg-white/80 px-4 py-3" />
          <button type="submit" className="tombol-utama mt-5 w-full bg-tanah-600 text-sm text-white hover:bg-tanah-700">
            Masuk
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Belum punya akun?{" "}
          <Link href="/daftar" className="font-bold text-tanah-600 underline underline-offset-4">Daftar gratis</Link>.
        </p>
      </div>
    </div>
  );
}
