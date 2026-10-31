import { buatPesanWhatsApp, buatTautanWhatsApp } from "@/lib/format";
import type { Templat } from "@/data/templat";
import { IkonWhatsApp } from "./IlustrasiOrnamen";

// Satu-satunya mekanisme berbagi di MVP: tombol WhatsApp dengan pesan terisi.
// Tidak ada tombol berbagi lain supaya alurnya tidak membingungkan.
export default function TombolWhatsApp({ templat }: { templat: Templat }) {
  const pesan = buatPesanWhatsApp(
    templat.contoh.judulAcara,
    templat.contoh.namaPertama,
    templat.contoh.namaKedua,
    templat.contoh.tanggal,
    templat.contoh.lokasi,
    templat.slug,
  );
  return (
    <a
      href={buatTautanWhatsApp(pesan)}
      target="_blank"
      rel="noreferrer"
      className="tombol-utama w-full bg-[#1F7A4D] text-white hover:bg-[#17603D]"
    >
      <IkonWhatsApp />
      Bagikan lewat WhatsApp
    </a>
  );
}
