// Pembungkus halaman teks (Syarat, Privasi, Bantuan) supaya ketiganya
// punya struktur yang sama: judul, tanggal pembaruan, dan isi yang
// mudah dibaca di ponsel. Bukan komponen klien — murni presentasi.

import type { ReactNode } from "react";

export default function HalamanTeks({
  judul,
  pembaruan,
  children,
}: {
  judul: string;
  pembaruan: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-bold text-tanah-900">{judul}</h1>
      <p className="mt-2 text-sm text-tintaLembut">Terakhir diperbarui: {pembaruan}</p>
      <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-tinta">
        {children}
      </div>
    </div>
  );
}
