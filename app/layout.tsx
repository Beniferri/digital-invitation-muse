import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navigasi from "@/komponen/Navigasi";
import KakiHalaman from "@/komponen/KakiHalaman";

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

export const metadata: Metadata = {
  title: "UndanganKita — Undangan Digital untuk Setiap Acara Keluarga",
  description:
    "Pilih templat, isi nama, tanggal, dan lokasi, lalu bagikan undanganmu lewat WhatsApp dalam beberapa menit.",
};

export default function TataLetakUtama({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${hurufSans.variable} ${hurufSerif.variable} font-sans`}>
        <Navigasi />
        <main>{children}</main>
        <KakiHalaman />
      </body>
    </html>
  );
}
