"use client";

// Tombol salin tautan: dipakai di kartu undangan dasbor supaya pengguna
// tidak perlu mengetik ulang kode tautan. Setelah berhasil, labelnya
// berubah jadi "Tersalin!" supaya jelas aksinya sudah jalan. Coba API
// clipboard dulu; kalau tidak tersedia (konteks tidak aman), pakai
// textarea sementara + execCommand sebagai jalan cadangan.
import { useState } from "react";

export default function TombolSalin({
  teks,
  label = "Salin tautan",
}: {
  teks: string;
  label?: string;
}) {
  const [tersalin, setTersalin] = useState(false);

  const salin = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(teks);
      } else {
        const area = document.createElement("textarea");
        area.value = teks;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        document.body.removeChild(area);
      }
      setTersalin(true);
    } catch {
      setTersalin(false);
    }
  };

  return (
    <button
      type="button"
      onClick={salin}
      className="min-h-[44px] rounded-full border-2 border-tanah-600 px-4 text-sm font-bold text-tanah-700"
    >
      {tersalin ? "Tersalin!" : label}
    </button>
  );
}
