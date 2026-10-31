"use client";

import { useState } from "react";
import type { PertanyaanUmum } from "@/data/pertanyaanUmum";

// FAQ akordeon sederhana: satu jawaban terbuka dalam satu waktu,
// tombolnya setinggi minimal 48px dan memakai aria-expanded.
export default function DaftarPertanyaan({ daftar }: { daftar: PertanyaanUmum[] }) {
  const [indeksTerbuka, setIndeksTerbuka] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {daftar.map((item, indeks) => {
        const terbuka = indeksTerbuka === indeks;
        return (
          <div key={item.pertanyaan} className="kartu-kaca overflow-hidden rounded-3xl">
            <button
              type="button"
              aria-expanded={terbuka}
              onClick={() => setIndeksTerbuka(terbuka ? null : indeks)}
              className="flex min-h-[56px] w-full items-center justify-between gap-4 px-5 py-4 text-left font-bold sm:px-6"
            >
              <span>{item.pertanyaan}</span>
              <span aria-hidden="true" className="shrink-0 text-xl text-emas-600">{terbuka ? "−" : "+"}</span>
            </button>
            {terbuka && (
              <p className="px-5 pb-5 text-[15px] leading-relaxed text-tintaLembut sm:px-6">{item.jawaban}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
