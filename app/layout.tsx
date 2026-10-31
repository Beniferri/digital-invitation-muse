import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { urlSitus } from "@/lib/situs";

// Huruf utama yang mudah dibaca di ponsel, dan huruf serif untuk judul
// supaya undangan terasa hangat, bukan seperti dokumen kantor.
const hurufSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--huruf-sans",
  display: "swap",
});

const hurufSerif = Fraunces({
  subsets: ["latin"],
  variable: "--huruf-serif",
  display: "swap",
});

// Metadata default situs (Tahap 5, SEO). Ini juga metadata halaman
// Beranda — halaman lain menimpa title/description-nya lewat metadata
// masing-masing. metadataBase membuat semua URL Open Graph/kanonis
// menjadi absolut; tanpa ini, pratinjau tautan bisa memakai URL relatif
// yang tidak valid.
export const metadata: Metadata = {
  metadataBase: new URL(urlSitus()),
  title: "UndanganKita — Undangan Digital untuk Setiap Acara Keluarga",
  description:
    "Pilih templat, isi nama, tanggal, dan lokasi, lalu bagikan undanganmu lewat WhatsApp dalam beberapa menit.",
  openGraph: {
    title: "UndanganKita — Undangan Digital untuk Setiap Acara Keluarga",
    description:
      "Pilih templat, isi nama, tanggal, dan lokasi, lalu bagikan undanganmu lewat WhatsApp dalam beberapa menit.",
    url: urlSitus(),
    siteName: "UndanganKita",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "UndanganKita — Undangan Digital untuk Setiap Acara Keluarga",
    description:
      "Pilih templat, isi nama, tanggal, dan lokasi, lalu bagikan undanganmu lewat WhatsApp dalam beberapa menit.",
  },
};

// Tata letak akar: SENGAJA polos — hanya kerangka HTML, huruf, dan gaya.
// Aturannya: header + footer situs hanya milik halaman website
// (landing/marketing), dan itu dipasang oleh tata letak grup (situs) di
// app/(situs)/layout.tsx, bukan di sini. Halaman aplikasi — admin,
// dasbor pengguna (/akun), editor, halaman tamu (/u), dan pratinjau
// template (/undangan) — mewarisi tata letak polos ini, jadi tampil
// penuh tanpa chrome situs. Jangan menambah Navigasi/KakiHalaman ke
// sini lagi: itu akan mengembalikannya ke semua halaman.
export default function TataLetakUtama({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${hurufSans.variable} ${hurufSerif.variable} font-sans`}>
        <main>{children}</main>
      </body>
    </html>
  );
}
