"use client";

import { useState } from "react";
import type { PaketHarga, PeriodeHarga } from "@/data/paketHarga";
import KartuHarga from "./KartuHarga";
import SakelarPeriode from "./SakelarPeriode";

// Bagian harga di landing: sakelar di atas, tiga kartu di bawah.
// Daftar paket diterima dari halaman (yang membacanya dari toko admin),
// supaya harga yang diubah admin langsung tampil di sini.
// Keadaan periode hanya hidup di komponen ini.
export default function BagianHarga({ daftar }: { daftar: PaketHarga[] }) {
  const [periode, setPeriode] = useState<PeriodeHarga>("bulanan");
  return (
    <div>
      <div className="flex justify-center">
        <SakelarPeriode periode={periode} ubahPeriode={setPeriode} />
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {daftar.map((paket) => (
          <KartuHarga key={paket.nama} paket={paket} periode={periode} />
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-tintaLembut">
        Semua paket memakai templat yang sama. Pilih paket berdasarkan jumlah
        undangan dan lama aktifnya, bukan berdasarkan desain.
      </p>
    </div>
  );
}
