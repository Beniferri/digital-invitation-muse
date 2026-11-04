import Link from "next/link";
import { masukAdmin } from "@/lib/aksiOtentikasi";

// Halaman masuk admin, VERSI FONDASI: email + kata sandi akun admin
// yang tersimpan di database (hash scrypt), bukan lagi kata sandi demo.
// Akun admin dibuat lewat skrip: npm run buat-admin -- email kata-sandi
export default function LoginAdmin({
  searchParams,
}: {
  searchParams?: { gagal?: string };
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl kartu-kaca p-6 sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight">Masuk Dasbor Admin</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-tintaLembut">
          Masuk dengan akun admin yang sudah dibuat di database.
        </p>
        {searchParams?.gagal && (
          <p role="alert" className="mt-4 rounded-2xl bg-terakota-100 px-4 py-3 text-sm font-bold text-tanah-700">
            Email atau kata sandi salah, atau akun ini bukan admin.
          </p>
        )}
        <form action={masukAdmin} className="mt-6">
          <label htmlFor="email" className="text-sm font-bold">Email admin</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            placeholder="admin@contoh.id"
            className="mt-2 min-h-[48px] w-full rounded-xl border border-tanah-900/15 bg-white/80 px-4 py-3 outline-none placeholder:text-tintaLembut/70"
          />
          <label htmlFor="kataSandi" className="mt-4 block text-sm font-bold">Kata sandi</label>
          <input
            id="kataSandi"
            name="kataSandi"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Masukkan kata sandi"
            className="mt-2 min-h-[48px] w-full rounded-xl border border-tanah-900/15 bg-white/80 px-4 py-3 outline-none placeholder:text-tintaLembut/70"
          />
          <button type="submit" className="mt-5 min-h-[44px] w-full rounded-full bg-tanah-600 px-5 text-sm font-bold text-white hover:bg-tanah-700">
            Masuk
          </button>
        </form>
        <p className="mt-4 rounded-2xl bg-krem-200 px-4 py-3 text-xs leading-relaxed text-tintaLembut">
          Belum punya akun admin? Buat dari terminal proyek:
          <code className="mt-1 block">npm run buat-admin -- admin@contoh.id kata-sandi-rahasia</code>
          Kata sandi tidak pernah disimpan mentah dan tidak ada lagi kata sandi bawaan.
        </p>
        <p className="mt-4 text-center text-sm text-tintaLembut">
          Pengguna biasa masuk lewat{" "}
          <Link href="/masuk" className="font-bold text-tanah-600 underline underline-offset-4">halaman masuk</Link>.
        </p>
      </div>
    </div>
  );
}
