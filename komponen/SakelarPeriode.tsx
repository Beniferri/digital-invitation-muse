"use client";

import type { PeriodeHarga } from "@/data/paketHarga";

// Sakelar bulanan/tahunan. Dibuat sebagai dua tombol agar bisa dipakai
// keyboard dan pembaca layar, bukan sakelar visual semata.
export default function SakelarPeriode({
  periode,
  ubahPeriode,
}: {
  periode: PeriodeHarga;
  ubahPeriode: (periodeBaru: PeriodeHarga) => void;
}) {
  return (
    <div role="group" aria-label="Pilih periode pembayaran" className="kartu-kaca inline-flex rounded-full p-1">
      <button
        type="button"
        onClick={() => ubahPeriode("bulanan")}
        aria-pressed={periode === "bulanan"}
        className={`min-h-[44px] rounded-full px-5 text-sm font-bold ${periode === "bulanan" ? "bg-tanah-600 text-white" : "text-tintaLembut"}`}
      >
        Bulanan
      </button>
      <button
        type="button"
        onClick={() => ubahPeriode("tahunan")}
        aria-pressed={periode === "tahunan"}
        className={`min-h-[44px] rounded-full px-5 text-sm font-bold ${periode === "tahunan" ? "bg-tanah-600 text-white" : "text-tintaLembut"}`}
      >
        Tahunan · hemat 2 bulan
      </button>
    </div>
  );
}
