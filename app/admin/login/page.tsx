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
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Masuk Dasbor Admin</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-stone-500">
          Masuk dengan akun admin yang sudah dibuat di database.
        </p>
        {searchParams?.gagal && (
          <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            Email atau kata sandi salah, atau akun ini bukan admin.
          </p>
        )}
        <form action={masukAdmin} className="mt-6">
          <label htmlFor="email" className="text-sm font-bold text-stone-900">Email admin</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            placeholder="admin@contoh.id"
            className="mt-2 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none placeholder:text-stone-400 focus:border-[#2F4A2E]"
          />
          <label htmlFor="kataSandi" className="mt-4 block text-sm font-bold text-stone-900">Kata sandi</label>
          <input
            id="kataSandi"
            name="kataSandi"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Masukkan kata sandi"
            className="mt-2 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none placeholder:text-stone-400 focus:border-[#2F4A2E]"
          />
          <button type="submit" className="mt-5 min-h-[44px] w-full rounded-full bg-[#2F4A2E] px-5 text-sm font-bold text-white hover:bg-[#243A24]">
            Masuk
          </button>
        </form>
        <p className="mt-4 rounded-2xl bg-stone-100 px-4 py-3 text-xs leading-relaxed text-stone-500">
          Belum punya akun admin? Buat dari terminal proyek:
          <code className="mt-1 block">npm run buat-admin -- admin@contoh.id kata-sandi-rahasia</code>
          Kata sandi tidak pernah disimpan mentah dan tidak ada lagi kata sandi bawaan.
        </p>
        <p className="mt-4 text-center text-sm text-stone-500">
          Pengguna biasa masuk lewat{" "}
          <Link href="/masuk" className="font-bold text-[#2F4A2E] underline underline-offset-4">halaman masuk</Link>.
        </p>
      </div>
    </div>
  );
}
