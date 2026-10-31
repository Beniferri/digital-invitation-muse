import Link from "next/link";
import type { PaketHarga, PeriodeHarga } from "@/data/paketHarga";
import { formatRupiah } from "@/data/paketHarga";
import { IkonCentang } from "./IlustrasiOrnamen";

// Satu kartu harga. Harga berubah sesuai sakelar, daftar fitur dicentang satu per satu.
export default function KartuHarga({ paket, periode }: { paket: PaketHarga; periode: PeriodeHarga }) {
  const harga = periode === "bulanan" ? paket.hargaBulanan : paket.hargaTahunan;
  return (
    <article
      className={`kartu-kaca relative rounded-[2rem] p-6 sm:p-7 ${
        paket.palingPopuler ? "border-2 border-emas-500" : ""
      }`}
    >
      {paket.palingPopuler && (
        <span className="absolute -top-3 left-6 rounded-full bg-emas-500 px-3 py-1 text-xs font-bold text-white">
          Paling banyak dipilih
        </span>
      )}
      <h3 className="font-serif text-2xl font-bold">{paket.nama}</h3>
      <p className="mt-2 min-h-[3.5rem] text-[15px] leading-relaxed text-tintaLembut">{paket.keterangan}</p>
      <p className="mt-4">
        <span className="font-serif text-4xl font-bold text-tanah-700">{formatRupiah(harga)}</span>
        <span className="text-sm font-semibold text-tintaLembut"> / {periode === "bulanan" ? "bulan" : "tahun"}</span>
      </p>
      <p className="mt-1 text-sm text-tintaLembut">
        {periode === "tahunan"
          ? "Dibayar setahun sekali. Setara dua bulan gratis dibanding bayar bulanan."
          : "Dibayar tiap bulan, bisa berhenti kapan saja."}
      </p>
      <ul className="mt-6 space-y-3">
        {paket.fitur.map((fitur) => (
          <li key={fitur} className="flex items-start gap-3 text-[15px] leading-relaxed">
            <IkonCentang />
            <span>{fitur}</span>
          </li>
        ))}
      </ul>
      <Link href="/editor" className="tombol-utama mt-7 w-full bg-tanah-600 text-sm text-white hover:bg-tanah-700">
        Coba Editor Gratis
      </Link>
      <p className="mt-3 text-center text-xs text-tintaLembut">
        Semua templat bisa dipilih bebas di paket ini.
      </p>
    </article>
  );
}
