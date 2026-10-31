import Link from "next/link";

// Bilah atas yang menempel saat digulir, dengan latar kaca.
// Tautannya hanya tiga: beranda, katalog, dan editor. Tidak ada menu berlebih.
export default function Navigasi() {
  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <nav
          aria-label="Navigasi utama"
          className="kartu-kaca flex items-center justify-between gap-3 rounded-full px-4 py-2 sm:px-6"
        >
          <Link href="/" className="flex min-w-0 items-center gap-2 font-serif text-lg font-bold text-tanah-700 sm:text-xl">
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tanah-600 text-lg text-krem-50">
              ❦
            </span>
            <span className="truncate">UndanganKita</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm font-semibold text-tintaLembut md:flex">
            <Link href="/" className="hover:text-tanah-600">Beranda</Link>
            <Link href="/katalog" className="hover:text-tanah-600">Katalog Template</Link>
            <Link href="/editor" className="hover:text-tanah-600">Editor</Link>
            <Link href="/admin" className="hover:text-tanah-600">Admin</Link>
            <Link href="/masuk" className="hover:text-tanah-600">Masuk</Link>
          </div>
          <Link href="/editor" className="tombol-utama shrink-0 whitespace-nowrap bg-tanah-600 px-3 py-2 text-xs text-white hover:bg-tanah-700 sm:px-4 sm:text-sm">
            Buat Undangan
          </Link>
        </nav>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 px-2 pt-3 text-sm font-semibold text-tintaLembut md:hidden">
          <Link href="/katalog">Katalog</Link>
          <Link href="/editor">Editor</Link>
          <Link href="/admin">Admin</Link>
          <Link href="/masuk">Masuk</Link>
          <Link href="/#harga">Harga</Link>
        </div>
      </div>
    </header>
  );
}
