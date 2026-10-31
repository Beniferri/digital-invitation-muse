"use client";

// Bilah atas yang menempel saat digulir, dengan latar kaca.
// Desktop: logo + tautan + tombol "Buat Undangan" dalam satu pil.
// Ponsel: hanya logo + tombol hamburger; semua tautan pindah ke drawer
// geser (pola yang sama dengan dasbor admin). Baris tautan kedua yang
// dulu ada di bawah pil DIHAPUS — di layar sempit baris itu membungkus
// jadi dua baris dan terlihat menumpuk (umpan balik pengguna 31 Okt 2026).
// Drawer ditutup lewat backdrop, tombol Escape, atau setelah memilih menu.
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU_PONSEL = [
  { href: "/editor", label: "Buat Undangan", utama: true },
  { href: "/", label: "Beranda", utama: false },
  { href: "/katalog", label: "Katalog Template", utama: false },
  { href: "/editor", label: "Editor", utama: false },
  { href: "/#harga", label: "Harga", utama: false },
  { href: "/admin", label: "Admin", utama: false },
  { href: "/masuk", label: "Masuk", utama: false },
];

export default function Navigasi() {
  const pathname = usePathname();
  const [terbuka, setTerbuka] = useState(false);

  useEffect(() => {
    if (!terbuka) return;
    const tutupDenganEscape = (acara: KeyboardEvent) => {
      if (acara.key === "Escape") setTerbuka(false);
    };
    document.addEventListener("keydown", tutupDenganEscape);
    return () => document.removeEventListener("keydown", tutupDenganEscape);
  }, [terbuka]);

  // Halaman tamu (/u/...) adalah undangan untuk penerima, bukan etalase
  // produk: navigasi platform (Beranda, Katalog, Editor, Admin, Masuk)
  // disembunyikan supaya tamu fokus ke undangan dan tidak bingung dengan
  // tautan yang bukan untuknya. Hook di atas tetap dipanggil dulu agar
  // urutan hook tidak berubah saat berpindah rute. Header yang hilang
  // juga menghilangkan keluhan lama: judul seksi sempat tertutup header
  // lengket saat menggulir undangan.
  if (pathname?.startsWith("/u/")) return null;

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
          <Link href="/editor" className="tombol-utama hidden shrink-0 whitespace-nowrap bg-tanah-600 px-4 py-2 text-sm text-white hover:bg-tanah-700 md:inline-flex">
            Buat Undangan
          </Link>
          <button
            type="button"
            onClick={() => setTerbuka(true)}
            aria-label="Buka menu"
            aria-expanded={terbuka}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-krem-300 bg-white/80 text-lg font-bold md:hidden"
          >
            ☰
          </button>
        </nav>
      </div>

      {terbuka && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setTerbuka(false)}
          className="fixed inset-0 z-40 bg-tinta/50 md:hidden"
        />
      )}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col bg-krem-50 shadow-xl transition-transform duration-200 md:hidden ${
          terbuka ? "translate-x-0 visible" : "translate-x-full invisible"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <p className="font-serif text-xl font-bold text-tanah-700">Menu</p>
          <button
            type="button"
            onClick={() => setTerbuka(false)}
            aria-label="Tutup menu"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-krem-300 text-lg font-bold"
          >
            ✕
          </button>
        </div>
        <nav aria-label="Menu ponsel" className="flex-1 overflow-y-auto px-3 pb-4">
          <ul className="space-y-1">
            {MENU_PONSEL.map((item) => (
              <li key={`${item.href}-${item.label}`}>
                <Link
                  href={item.href}
                  onClick={() => setTerbuka(false)}
                  className={`block min-h-[48px] rounded-2xl px-4 py-3 text-[15px] font-bold ${
                    item.utama
                      ? "bg-tanah-600 text-center text-white"
                      : "text-tinta hover:bg-krem-100"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
