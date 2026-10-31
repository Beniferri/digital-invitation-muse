"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Templat } from "@/data/templat";
import KartuTemplat from "./KartuTemplat";

// Filter katalog: jenis acara, warna, dan nuansa. Ketiganya boleh dikombinasikan.
// Kalau tidak ada templat yang cocok, tampilkan penjelasan jujur, bukan halaman kosong.
export default function FilterKatalog({ daftar }: { daftar: Templat[] }) {
  const [jenisTerpilih, setJenisTerpilih] = useState("Semua");
  const [warnaTerpilih, setWarnaTerpilih] = useState("Semua");
  const [nuansaTerpilih, setNuansaTerpilih] = useState("Semua");

  const daftarJenis = useMemo(
    () => ["Semua", ...Array.from(new Set(daftar.map((templat) => templat.jenisAcara)))],
    [daftar],
  );
  const daftarWarna = useMemo(
    () => ["Semua", ...Array.from(new Set(daftar.map((templat) => templat.warna)))],
    [daftar],
  );
  const daftarNuansa = useMemo(
    () => ["Semua", ...Array.from(new Set(daftar.map((templat) => templat.nuansa)))],
    [daftar],
  );

  const hasil = daftar.filter((templat) => {
    const cocokJenis = jenisTerpilih === "Semua" || templat.jenisAcara === jenisTerpilih;
    const cocokWarna = warnaTerpilih === "Semua" || templat.warna === warnaTerpilih;
    const cocokNuansa = nuansaTerpilih === "Semua" || templat.nuansa === nuansaTerpilih;
    return cocokJenis && cocokWarna && cocokNuansa;
  });

  const gayaTombolFilter = (aktif: boolean) =>
    `min-h-[44px] rounded-full px-4 text-sm font-bold ${aktif ? "bg-tanah-600 text-white" : "bg-white/70 text-tintaLembut hover:bg-white"}`;

  return (
    <div>
      <div className="kartu-kaca space-y-4 rounded-[2rem] p-5 sm:p-6">
        <div>
          <p className="mb-2 text-sm font-bold">Jenis acara</p>
          <div className="flex flex-wrap gap-2">
            {daftarJenis.map((jenis) => (
              <button key={jenis} type="button" onClick={() => setJenisTerpilih(jenis)} aria-pressed={jenisTerpilih === jenis} className={gayaTombolFilter(jenisTerpilih === jenis)}>
                {jenis}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-bold">Warna</p>
          <div className="flex flex-wrap gap-2">
            {daftarWarna.map((warna) => (
              <button key={warna} type="button" onClick={() => setWarnaTerpilih(warna)} aria-pressed={warnaTerpilih === warna} className={gayaTombolFilter(warnaTerpilih === warna)}>
                {warna}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-bold">Nuansa</p>
          <div className="flex flex-wrap gap-2">
            {daftarNuansa.map((nuansa) => (
              <button key={nuansa} type="button" onClick={() => setNuansaTerpilih(nuansa)} aria-pressed={nuansaTerpilih === nuansa} className={gayaTombolFilter(nuansaTerpilih === nuansa)}>
                {nuansa}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setJenisTerpilih("Semua");
            setWarnaTerpilih("Semua");
            setNuansaTerpilih("Semua");
          }}
          className="min-h-[44px] text-sm font-bold text-tanah-600 underline underline-offset-4"
        >
          Atur ulang semua filter
        </button>
      </div>

      <p aria-live="polite" className="mt-6 text-sm font-semibold text-tintaLembut">
        Menampilkan {hasil.length} dari {daftar.length} templat contoh.
      </p>

      {hasil.length === 0 ? (
        <div className="kartu-kaca mt-4 rounded-[2rem] p-8 text-center">
          <p className="font-serif text-2xl font-bold">Belum ada templat contoh untuk kombinasi ini</p>
          <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-tintaLembut">
            Di demo ini baru tersedia tiga templat contoh. Coba longgarkan satu filter,
            atau pakai salah satu templat yang ada di editor, karena isinya bisa diganti
            sesuai acaramu.
          </p>
          <button
            type="button"
            onClick={() => {
              setJenisTerpilih("Semua");
              setWarnaTerpilih("Semua");
              setNuansaTerpilih("Semua");
            }}
            className="tombol-utama mt-6 bg-tanah-600 text-sm text-white hover:bg-tanah-700"
          >
            Tampilkan semua templat
          </button>
        </div>
      ) : (
        <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hasil.map((templat) => (
            <KartuTemplat key={templat.slug} templat={templat} />
          ))}
        </div>
      )}
      <p className="mt-8 text-center text-sm text-tintaLembut">
        Butuh acara lain seperti khitanan atau syukuran kantor?{" "}
        <Link href="/editor" className="font-bold text-tanah-600 underline underline-offset-4">
          Isi datanya di editor
        </Link>{" "}
        dengan templat mana pun, karena kolomnya sama untuk semua jenis acara.
      </p>
    </div>
  );
}
