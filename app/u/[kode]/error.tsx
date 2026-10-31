"use client";

import Link from "next/link";

// Halaman galat khusus rute tamu: kalau data undangan gagal dimuat
// (mis. database tidak terjangkau), tamu melihat pesan yang bisa
// dimengerti dan tombol coba lagi — bukan halaman 500 generik. Pesan
// galat teknis sengaja tidak ditampilkan ke tamu; reset() dari Next.js
// mencoba merender ulang rute yang sama.
export default function GalatHalamanTamu(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="font-serif text-3xl font-bold text-tinta">
        Undangan gagal dimuat
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-tintaLembut">
        Terjadi gangguan saat memuat undangan ini. Periksa koneksimu lalu
        coba lagi — tidak ada data yang berubah.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={props.reset}
          className="inline-flex min-h-[48px] items-center rounded-full bg-tanah-600 px-6 text-sm font-bold text-white hover:bg-tanah-700"
        >
          Coba lagi
        </button>
        <Link
          href="/"
          className="inline-flex min-h-[48px] items-center rounded-full border-2 border-tanah-600/30 px-6 text-sm font-bold text-tanah-700 hover:bg-krem-100"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
