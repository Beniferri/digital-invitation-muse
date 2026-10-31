import type { ReactNode } from "react";

// Markah ringan untuk kata-kata undangan (sapaan pembuka, kata
// pengantar): **tebal**, *miring*, dan [teks](https://tautan).
// SENGAJA tidak memakai dangerouslySetInnerHTML: React meng-escape
// string otomatis, jadi tag HTML yang diketik pengguna tampil sebagai
// teks biasa, bukan dieksekusi. Tautan hanya http(s) — skema lain
// (mis. javascript:) dirender sebagai teks polos, bukan tautan.

type Segmen = {
  teks: string;
  tebal?: boolean;
  miring?: boolean;
  tautan?: string;
};

export function segmenTeks(teks: string): Segmen[] {
  // Pola dibuat di dalam fungsi: regex /g menyimpan lastIndex antar
  // panggilan, jadi pola tingkat modul bisa salah posisi di panggilan
  // kedua. Target TS lama juga melarang iterasi matchAll.
  const pola = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const hasil: Segmen[] = [];
  let posisi = 0;
  let cocok: RegExpExecArray | null;
  while ((cocok = pola.exec(teks)) !== null) {
    const awal = cocok.index;
    if (awal > posisi) hasil.push({ teks: teks.slice(posisi, awal) });
    if (cocok[1] !== undefined) {
      hasil.push({ teks: cocok[1], tebal: true });
    } else if (cocok[2] !== undefined) {
      hasil.push({ teks: cocok[2], miring: true });
    } else if (cocok[3] !== undefined && cocok[4] !== undefined) {
      hasil.push({ teks: cocok[3], tautan: cocok[4] });
    }
    posisi = awal + cocok[0].length;
  }
  if (posisi < teks.length) hasil.push({ teks: teks.slice(posisi) });
  return hasil;
}

export default function TeksBerformat({ teks, className }: { teks: string; className?: string }) {
  const segmen = segmenTeks(teks);
  const isi: ReactNode[] = segmen.map((bagian, indeks) => {
    if (bagian.tautan) {
      return (
        <a
          key={indeks}
          href={bagian.tautan}
          target="_blank"
          rel="noreferrer"
          className="font-bold underline underline-offset-4"
        >
          {bagian.teks}
        </a>
      );
    }
    if (bagian.tebal) return <strong key={indeks}>{bagian.teks}</strong>;
    if (bagian.miring) return <em key={indeks}>{bagian.teks}</em>;
    return <span key={indeks}>{bagian.teks}</span>;
  });
  return <span className={className}>{isi}</span>;
}
