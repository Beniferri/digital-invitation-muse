"use client";

// Kerangka dasbor admin: sidebar di desktop, drawer geser di ponsel
// (pola yang sama dengan perbaikan mobile desain dasbor: hamburger,
// backdrop, Escape, dan tutup otomatis setelah memilih menu).
// Komponen ini hanya tampilan; semua angka datang dari halaman server
// di dalamnya, dan otorisasi tetap diwajibkan tiap halaman.

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { keluarAdmin } from "@/lib/aksiOtentikasi";

const MENU = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/langganan", label: "Langganan" },
  { href: "/admin/pesanan", label: "Pendapatan & Tagihan" },
  { href: "/admin/pengguna", label: "Pengguna & Akun" },
  { href: "/admin/undangan", label: "Undangan" },
  { href: "/admin/rsvp", label: "RSVP" },
  { href: "/admin/templat", label: "Templat" },
  { href: "/admin/harga", label: "Harga" },
];

export default function ShellAdmin({
  email,
  perhatian,
  children,
}: {
  email: string;
  perhatian: number;
  children: React.ReactNode;
}) {
  const [terbuka, setTerbuka] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!terbuka) return;
    const tutupDenganEscape = (acara: KeyboardEvent) => {
      if (acara.key === "Escape") setTerbuka(false);
    };
    document.addEventListener("keydown", tutupDenganEscape);
    return () => document.removeEventListener("keydown", tutupDenganEscape);
  }, [terbuka]);

  const aktif = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-stone-100">
      {terbuka && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setTerbuka(false)}
          className="fixed inset-0 z-40 bg-stone-900/50 lg:hidden"
        />
      )}

      <aside
        aria-label="Navigasi admin"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-stone-200 bg-white shadow-xl transition-transform duration-200 lg:translate-x-0 ${
          terbuka ? "translate-x-0 visible" : "-translate-x-full invisible lg:visible"
        }`}
      >
        <div className="border-b border-stone-200 px-5 py-5">
          <div className="inline-flex rounded-xl border border-stone-200 bg-white px-3 py-1.5">
            <Image src="/logo/betastoria-web.png" alt="BETA Storia" width={1500} height={500} className="h-8 w-auto" />
          </div>
          <p className="mt-2 text-sm font-semibold text-stone-500">Dasbor Admin</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {MENU.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setTerbuka(false)}
                  aria-current={aktif(item.href) ? "page" : undefined}
                  className={`block min-h-[44px] rounded-xl px-4 py-3 text-[15px] font-bold ${
                    aktif(item.href)
                      ? "bg-[#2F4A2E] text-white"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-stone-200 px-5 py-4">
          <Link href="/" onClick={() => setTerbuka(false)} className="text-sm font-bold text-[#2F4A2E] underline underline-offset-4">
            Lihat Situs
          </Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setTerbuka(true)}
              aria-label="Buka menu"
              aria-expanded={terbuka}
              className="min-h-[44px] min-w-[44px] rounded-full border border-stone-300 px-3 text-lg font-bold text-stone-700 lg:hidden"
            >
              ☰
            </button>
            <form action="/admin/cari" method="get" role="search" className="min-w-0 flex-1">
              <label htmlFor="cari-admin" className="sr-only">
                Cari di dasbor admin
              </label>
              <input
                id="cari-admin"
                type="search"
                name="q"
                placeholder="Cari email, kode undangan, order ID…"
                className="min-h-[44px] w-full rounded-full border border-stone-300 bg-stone-50 px-4 text-[15px] outline-none placeholder:text-stone-400 focus:border-[#2F4A2E] focus:bg-white"
              />
            </form>
            <Link
              href="/admin/pesanan"
              aria-label={perhatian > 0 ? `${perhatian} pesanan perlu perhatian` : "Tidak ada pesanan perlu perhatian"}
              className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-stone-300 bg-white text-lg"
            >
              🔔
              {perhatian > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#2F4A2E] px-1 text-[11px] font-bold text-white">
                  {perhatian > 99 ? "99+" : perhatian}
                </span>
              )}
            </Link>
            <div className="hidden min-w-0 max-w-[220px] sm:block">
              <p className="truncate text-sm font-bold text-stone-900">{email}</p>
              <p className="text-xs text-stone-500">Admin</p>
            </div>
            <form action={keluarAdmin}>
              <button
                type="submit"
                className="min-h-[44px] rounded-full border border-stone-300 bg-white px-4 text-sm font-bold text-stone-700 hover:bg-stone-50"
              >
                Keluar
              </button>
            </form>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
