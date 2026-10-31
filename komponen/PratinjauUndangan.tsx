import Image from "next/image";
import type { Templat } from "@/data/templat";
import { formatTanggalIndonesia } from "@/lib/format";
import { IkonKalender, IkonLokasi, OrnamenGarisSenja, OrnamenMelati, OrnamenParang } from "./IlustrasiOrnamen";

// Data yang ditampilkan pratinjau. Dipakai bersama oleh editor dan halaman contoh,
// supaya tampilannya tidak berbeda-beda di dua tempat.
export interface DataPratinjau {
  namaPertama: string;
  namaKedua: string;
  tanggal: string;
  lokasi: string;
  fotoUrl: string;
}

interface PropertiPratinjau {
  templat: Templat;
  data: DataPratinjau;
  tampilkanCatatan?: boolean;
}

// Satu kartu undangan dengan variasi visual per templat:
// Seruni = lengkung atas + cahaya emas, Melati = kotak bulat + hijau teduh,
// Kala Senja = tata letak asimetris + cahaya terakota di bawah.
export default function PratinjauUndangan({ templat, data, tampilkanCatatan = true }: PropertiPratinjau) {
  const { contoh, gaya } = templat;
  const namaKedua = data.namaKedua.trim();
  const tanggalTampil = formatTanggalIndonesia(data.tanggal);

  return (
    <article className={`relative overflow-hidden p-3 sm:p-4 ${gaya.latar}`}>
      {/* Cahaya ambient hangat, warnanya mengikuti templat. */}
      <div
        aria-hidden="true"
        className={`cahaya-hangat -top-10 -right-10 h-44 w-44 ${
          templat.slug === "melati-aqiqah" ? "bg-daun-500/25" : templat.slug === "kala-wisuda" ? "bg-terakota-500/30" : "bg-emas-300/50"
        }`}
      />
      <div className={`kartu-kaca relative ${gaya.kartu} overflow-hidden`}>
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-krem-200">
          {/* Foto: di editor berasal dari berkas lokal lewat createObjectURL,
              di halaman contoh berasal dari layanan placeholder tanpa kunci API. */}
          <Image
            src={data.fotoUrl}
            alt={`Foto untuk ${contoh.judulAcara}`}
            fill
            sizes="(max-width: 640px) 90vw, 420px"
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-tanah-900/70 via-tanah-900/10 to-transparent p-5 pt-16 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-krem-200">{contoh.judulAcara}</p>
            <p className="mt-1 font-serif text-3xl font-bold leading-tight">
              {data.namaPertama || "Nama masih kosong"}
            </p>
            {namaKedua && <p className="font-serif text-xl leading-snug text-krem-100">{namaKedua}</p>}
          </div>
        </div>

        <div className={`px-6 py-6 ${gaya.bentuk === "asimetris" ? "sm:pl-10" : ""}`}>
          {gaya.pola === "parang" && <OrnamenParang idUnik={`parang-${templat.slug}`} />}
          {gaya.pola === "melati" && <OrnamenMelati />}
          {gaya.pola === "garis" && <OrnamenGarisSenja />}

          <p className="mt-4 text-center text-[15px] leading-relaxed text-tintaLembut">{contoh.salamPembuka}</p>
          <p className={`mt-4 text-center font-serif text-lg font-semibold italic leading-snug ${gaya.aksen}`}>
            &ldquo;{contoh.kutipan}&rdquo;
          </p>

          <div className={`mt-6 space-y-3 rounded-2xl p-4 text-[15px] ${gaya.aksenLembut}`}>
            <p className="flex items-start gap-3 font-semibold text-tinta">
              <span className={gaya.aksen}><IkonKalender /></span>
              {tanggalTampil}
            </p>
            <p className="flex items-start gap-3 font-semibold text-tinta">
              <span className={gaya.aksen}><IkonLokasi /></span>
              {data.lokasi || "Lokasi menyusul"}
            </p>
          </div>

          {tampilkanCatatan && (
            <p className="mt-5 text-center text-sm leading-relaxed text-tintaLembut">{contoh.catatan}</p>
          )}
          <p className="mt-6 text-center text-xs font-semibold uppercase tracking-widest text-tintaLembut">
            {templat.nama} · {templat.nuansa}
          </p>
        </div>
      </div>
    </article>
  );
}
