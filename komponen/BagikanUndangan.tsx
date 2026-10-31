"use client";

import { useState } from "react";
import { buatPesanBagikanUndangan, buatTautanWhatsApp } from "@/lib/format";
import { IkonWhatsApp } from "./IlustrasiOrnamen";

// Bagian bagikan untuk undangan nyata (halaman tamu): tombol WhatsApp
// dengan pesan terisi plus tombol salin tautan. Tautan absolut diberikan
// pemanggil (dari host request di server), jadi pesan WhatsApp selalu
// mengarah ke halaman tamu yang benar, bukan ke domain contoh.
export default function BagikanUndangan({
  judulAcara,
  namaPertama,
  namaKedua,
  tanggal,
  lokasi,
  tautan,
}: {
  judulAcara: string;
  namaPertama: string;
  namaKedua: string;
  tanggal: string;
  lokasi: string;
  tautan: string;
}) {
  const [tersalin, setTersalin] = useState(false);
  const [gagalSalin, setGagalSalin] = useState(false);

  async function salinTautan() {
    try {
      await navigator.clipboard.writeText(tautan);
      setTersalin(true);
      setGagalSalin(false);
      window.setTimeout(() => setTersalin(false), 2000);
    } catch {
      // Peramban lama atau izin clipboard ditolak: tampilkan tautan supaya
      // pengguna tetap bisa menyalinnya manual.
      setGagalSalin(true);
    }
  }

  const pesan = buatPesanBagikanUndangan(
    judulAcara,
    namaPertama,
    namaKedua,
    tanggal,
    lokasi,
    tautan,
  );

  return (
    <section className="kartu-kaca mt-6 rounded-[2rem] p-5 sm:p-6">
      <h2 className="font-serif text-2xl font-bold">Bagikan Undangan Ini</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-tintaLembut">
        Kirim tautan di bawah ke tamu lewat WhatsApp, atau salin dan tempel di
        grup keluarga.
      </p>
      <div className="mt-4 space-y-3">
        <a
          href={buatTautanWhatsApp(pesan)}
          target="_blank"
          rel="noreferrer"
          className="tombol-utama w-full bg-[#1F7A4D] text-white hover:bg-[#17603D]"
        >
          <IkonWhatsApp />
          Bagikan lewat WhatsApp
        </a>
        <button
          type="button"
          onClick={salinTautan}
          className="tombol-utama w-full border-2 border-tanah-600 text-sm text-tanah-700 hover:bg-krem-100"
        >
          {tersalin ? "Tautan tersalin!" : "Salin tautan"}
        </button>
      </div>
      <p className="mt-4 break-all text-sm text-tintaLembut">{tautan}</p>
      {gagalSalin && (
        <p role="status" className="mt-2 text-sm font-bold text-tanah-700">
          Penyalinan otomatis gagal — salin tautan di atas secara manual.
        </p>
      )}
    </section>
  );
}
