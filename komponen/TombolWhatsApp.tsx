import { buatPesanBagikanUndangan, buatTautanWhatsApp } from "@/lib/format";
import type { Templat } from "@/data/templat";
import { IkonWhatsApp } from "./IlustrasiOrnamen";

// Satu-satunya mekanisme berbagi di MVP: tombol WhatsApp dengan pesan terisi.
// Tautan diberikan pemanggil sebagai tautan absolut (dari host request),
// bukan ditulis keras — domain contoh lama tidak pernah ada dan pesan lama
// mengirim tamu ke tautan mati.
export default function TombolWhatsApp({ templat, tautan }: { templat: Templat; tautan: string }) {
  const pesan = buatPesanBagikanUndangan(
    templat.contoh.judulAcara,
    templat.contoh.namaPertama,
    templat.contoh.namaKedua,
    templat.contoh.tanggal,
    templat.contoh.lokasi,
    tautan,
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
