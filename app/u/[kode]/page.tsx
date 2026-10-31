import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { existsSync } from "fs";
import path from "path";
import { bacaDaftarRsvp, bacaDaftarTemplat, bacaRingkasanRsvp, cariUndanganOlehKode } from "@/lib/tokoData";
import { periksaKedaluwarsaPengguna } from "@/lib/langganan";
import { formatTanggalIndonesia } from "@/lib/format";
import { urlAbsolut, urlSitus } from "@/lib/situs";
import PratinjauUndangan from "@/komponen/PratinjauUndangan";
import FormulirRsvp from "@/komponen/FormulirRsvp";
import BagikanUndangan from "@/komponen/BagikanUndangan";
import UndanganZamrud from "@/komponen/UndanganZamrud";

export const dynamic = "force-dynamic";

// Halaman tamu: undangan asli dari database, bukan contoh template.
// Hanya undangan berstatus Aktif yang menerima RSVP. Draft tidak
// dipublikasikan (404), sedangkan Selesai masih bisa dilihat tapi
// formulirnya sudah ditutup.
const pesanGalat: Record<string, string> = {
  tutup: "RSVP untuk undangan ini sudah ditutup.",
  nama: "Nama wajib diisi, minimal 2 huruf.",
  cepat: "Kirim terlalu cepat — tunggu sebentar lalu coba lagi.",
  batas: "Terlalu banyak percobaan dari perangkat ini dalam satu jam terakhir. Tunggu sebentar lalu coba lagi.",
  robot: "Gagal mengirim. Coba lagi.",
};

// Pratinjau tautan (Open Graph) untuk halaman tamu (Tahap 5, SEO).
// Mengambil data yang sama dengan halaman itu sendiri, termasuk
// pemeriksaan kedaluwarsa malas, supaya judul/deskripsi pratinjau tidak
// mengajak RSVP untuk undangan yang sudah Selesai. Undangan Draft atau
// yang tidak ada tidak membocorkan nama di metadata (halaman 404 yang
// dirender memakai metadata layout, bukan metadata halaman ini).
// Foto pratinjau memakai foto undangan atau foto sampul templat kalau
// ada; kalau tidak ada, pratinjau tanpa gambar (SENGAJA tidak memakai
// foto picsum cadangan seperti di halaman, supaya pratinjau yang
// dibagikan tidak menampilkan foto stok acak sebagai foto acara).
export async function generateMetadata({ params }: { params: { kode: string } }): Promise<Metadata> {
  const generik: Metadata = { title: "Undangan — UndanganKita" };
  let undangan = await cariUndanganOlehKode(params.kode);
  if (!undangan || undangan.status === "Draft") return generik;
  if (undangan.penggunaId) {
    await periksaKedaluwarsaPengguna(undangan.penggunaId);
    undangan = await cariUndanganOlehKode(params.kode);
    if (!undangan || undangan.status === "Draft") return generik;
  }
  const daftarTemplat = await bacaDaftarTemplat();
  const templat = daftarTemplat.find((item) => item.slug === undangan.slugTemplat);
  const nama = undangan.namaKedua ? `${undangan.namaPertama} & ${undangan.namaKedua}` : undangan.namaPertama;
  const judul = `${nama} — ${undangan.jenisAcara} | UndanganKita`;
  const deskripsi =
    undangan.status === "Aktif"
      ? `Undangan ${undangan.jenisAcara} pada ${formatTanggalIndonesia(undangan.tanggal)} di ${undangan.lokasi}. Konfirmasi kehadiranmu lewat formulir RSVP.`
      : `Undangan ${undangan.jenisAcara} pada ${formatTanggalIndonesia(undangan.tanggal)} di ${undangan.lokasi}. Lihat detail acaranya di sini.`;
  const foto = undangan.fotoUndangan ?? templat?.fotoSampul ?? null;
  const gambar = foto ? [urlAbsolut(foto)] : undefined;
  return {
    title: judul,
    description: deskripsi,
    openGraph: {
      title: judul,
      description: deskripsi,
      url: `${urlSitus()}/u/${undangan.kodeTamu}`,
      siteName: "UndanganKita",
      locale: "id_ID",
      type: "website",
      images: gambar,
    },
    twitter: {
      card: gambar ? "summary_large_image" : "summary",
      title: judul,
      description: deskripsi,
      images: gambar,
    },
  };
}

export default async function HalamanTamu({
  params,
  searchParams,
}: {
  params: { kode: string };
  searchParams: { rsvp?: string; galat?: string };
}) {
  let undangan = await cariUndanganOlehKode(params.kode);
  if (!undangan || undangan.status === "Draft") notFound();
  // Kedaluwarsa diperiksa malas: kalau langganan pemilik sudah habis,
  // undangan Aktif ini diubah jadi Selesai dulu, lalu dibaca ulang supaya
  // halaman ini menampilkan status yang benar (tamu tetap bisa melihat,
  // tapi RSVP sudah ditutup — aturan yang sama dengan undangan Selesai).
  if (undangan.penggunaId) {
    await periksaKedaluwarsaPengguna(undangan.penggunaId);
    undangan = await cariUndanganOlehKode(params.kode);
    if (!undangan || undangan.status === "Draft") notFound();
  }

  const daftarTemplat = await bacaDaftarTemplat();
  const templat = daftarTemplat.find((item) => item.slug === undangan.slugTemplat);
  if (!templat) notFound();

  const ringkasan = await bacaRingkasanRsvp(undangan.id);
  const daftarRsvp = await bacaDaftarRsvp(undangan.id);
  const ucapan = daftarRsvp.filter((rsvp) => rsvp.pesan.trim().length > 0);
  const galat = searchParams.galat ? pesanGalat[searchParams.galat] : undefined;
  // Tautan absolut untuk pesan WhatsApp: dibangun dari host request ini,
  // jadi benar di produksi (domain Coolify) maupun di pengembangan lokal.
  // x-forwarded-proto dipakai karena di balik proxy (Coolify) request yang
  // sampai ke Next sudah http walaupun pengunjung memakai https.
  const daftarHeader = headers();
  const host = daftarHeader.get("x-forwarded-host") ?? daftarHeader.get("host") ?? "localhost:3000";
  const protokol = daftarHeader.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const tautanTamu = `${protokol}://${host}/u/${undangan.kodeTamu}`;

  // Templat halaman penuh (Zamrud) memakai perendernya sendiri, bukan
  // kartu pratinjau + formulir standar di bawah. Musik hanya ditawarkan
  // kalau berkasnya benar-benar ada di public/musik.
  if (templat.halamanPenuh) {
    const musikAda = existsSync(path.join(process.cwd(), "public", "musik", "zamrud.mp3"));
    return (
      <UndanganZamrud
        data={{
          namaPertama: undangan.namaPertama,
          namaKedua: undangan.namaKedua,
          jenisAcara: undangan.jenisAcara,
          tanggal: undangan.tanggal,
          lokasi: undangan.lokasi,
          fotoUndangan: undangan.fotoUndangan,
          fotoSampul: templat.fotoSampul ?? null,
          orangTuaPertama: undangan.orangTuaPertama,
          orangTuaKedua: undangan.orangTuaKedua,
          statusAktif: undangan.status === "Aktif",
          rsvpTerkirim: searchParams.rsvp === "terkirim",
          pesanGalat: galat,
          kodeTamu: undangan.kodeTamu,
          waktuMuat: Date.now(),
          tautan: tautanTamu,
          musikSrc: musikAda ? "/musik/zamrud.mp3" : null,
          ringkasan,
          ucapan,
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:py-10">
      <p className="text-center text-sm font-bold uppercase tracking-widest text-tintaLembut">
        Undangan · {undangan.jenisAcara}
      </p>
      <div className="mt-4 overflow-hidden rounded-[2rem] shadow-kaca">
        <PratinjauUndangan
          templat={templat}
          data={{
            namaPertama: undangan.namaPertama,
            namaKedua: undangan.namaKedua,
            tanggal: undangan.tanggal,
            lokasi: undangan.lokasi,
            fotoUrl:
              undangan.fotoUndangan ??
              templat.fotoSampul ??
              `https://picsum.photos/seed/${templat.slug}/800/1000`,
          }}
        />
      </div>

      <BagikanUndangan
        judulAcara={templat.contoh.judulAcara}
        namaPertama={undangan.namaPertama}
        namaKedua={undangan.namaKedua}
        tanggal={undangan.tanggal}
        lokasi={undangan.lokasi}
        tautan={tautanTamu}
      />

      <section className="kartu-kaca mt-6 rounded-[2rem] p-5 sm:p-6">
        <h2 className="font-serif text-2xl font-bold">Konfirmasi Kehadiran</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-tintaLembut">
          {ringkasan.totalBalasan === 0
            ? "Belum ada yang mengonfirmasi. Jadilah yang pertama."
            : `${ringkasan.hadir} balasan hadir (${ringkasan.totalTamuHadir} tamu), ${ringkasan.ragu} masih ragu, ${ringkasan.tidak} tidak bisa hadir.`}
        </p>
        {searchParams.rsvp === "terkirim" && (
          <p role="status" className="mt-4 rounded-2xl bg-daun-100 px-4 py-3 text-sm font-bold text-daun-700">
            Terima kasih! Konfirmasimu sudah tersimpan.
          </p>
        )}
        {galat && (
          <p role="alert" className="mt-4 rounded-2xl bg-terakota-100 px-4 py-3 text-sm font-bold text-tanah-700">
            {galat}
          </p>
        )}
        {undangan.status === "Aktif" ? (
          <FormulirRsvp kode={undangan.kodeTamu} waktuMuat={Date.now()} />
        ) : (
          <p className="mt-4 rounded-2xl bg-krem-200 px-4 py-3 text-sm font-bold text-tinta">
            RSVP untuk undangan ini sudah ditutup karena acaranya sudah selesai.
          </p>
        )}
      </section>

      {ucapan.length > 0 && (
        <section className="mt-6">
          <h2 className="font-serif text-2xl font-bold">Ucapan &amp; Doa</h2>
          <ul className="mt-4 space-y-3">
            {ucapan.map((rsvp) => (
              <li key={rsvp.id} className="kartu-kaca rounded-[1.75rem] p-4">
                <p className="flex flex-wrap items-center justify-between gap-2 font-bold">
                  {rsvp.nama}
                  <span className="rounded-full bg-daun-100 px-3 py-1 text-xs font-bold text-daun-700">
                    {rsvp.kehadiran === "Hadir" ? "Hadir" : rsvp.kehadiran === "Ragu" ? "Masih ragu" : "Tidak bisa hadir"}
                  </span>
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-tinta">{rsvp.pesan}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 text-center text-xs text-tintaLembut">
        Dibuat dengan <Link href="/" className="font-bold text-tanah-600 underline underline-offset-4">UndanganKita</Link>
      </p>
    </div>
  );
}
