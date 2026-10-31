import Link from "next/link";
import { keluarAdmin } from "@/lib/aksiOtentikasi";

// Tata letak khusus dasbor admin: navigasi kedua di bawah navigasi utama.
// Halaman-halaman di sini dilindungi oleh wajibAdmin() di tiap halaman,
// layout ini hanya tampilan dan tombol keluar.
export default function TataLetakAdmin({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="kartu-kaca flex flex-wrap items-center justify-between gap-3 rounded-full px-5 py-3">
        <p className="font-serif text-xl font-bold text-tanah-700">Dasbor Admin</p>
        <nav aria-label="Navigasi admin" className="flex flex-wrap gap-4 text-sm font-bold">
          <Link href="/admin" className="hover:text-tanah-600">Ringkasan</Link>
          <Link href="/admin/templat" className="hover:text-tanah-600">Template</Link>
          <Link href="/admin/undangan" className="hover:text-tanah-600">Undangan</Link>
          <Link href="/admin/harga" className="hover:text-tanah-600">Harga</Link>
          <Link href="/admin/pesanan" className="hover:text-tanah-600">Pesanan</Link>
          <Link href="/" className="hover:text-tanah-600">Lihat Situs</Link>
        </nav>
        <form action={keluarAdmin}>
          <button type="submit" className="min-h-[44px] rounded-full border-2 border-tanah-600 px-4 text-sm font-bold text-tanah-700">
            Keluar
          </button>
        </form>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
