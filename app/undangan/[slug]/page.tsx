import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cariTemplatAktif } from "@/lib/tokoData";
import PratinjauUndangan from "@/komponen/PratinjauUndangan";
import TombolWhatsApp from "@/komponen/TombolWhatsApp";
import UndanganRoyalGrace from "@/komponen/UndanganRoyalGrace";

// Route dinamis [slug] yang membaca data dari toko admin.
// Halaman ini mobile-first: undangan ditampilkan seperti layar ponsel di tengah,
// karena mayoritas penerima membukanya dari WhatsApp di ponsel.
// Dinamis (bukan SSG): template bisa ditambah/diubah lewat admin setelah
// build, jadi halaman contoh harus dibaca segar dari database runtime.
export const dynamic = "force-dynamic";

export default async function ContohUndangan({ params }: { params: { slug: string } }) {
  const templat = await cariTemplatAktif(params.slug);
  if (!templat) notFound();

  const daftarHeader = headers();
  const host = daftarHeader.get("x-forwarded-host") ?? daftarHeader.get("host") ?? "localhost:3000";
  const protokol = daftarHeader.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const tautanContoh = `${protokol}://${host}/undangan/${templat.slug}`;

  // Pratinjau halaman penuh Royal Grace: render komponen temanya langsung
  // dengan data contoh (bukan kartu), supaya calon pengguna melihat
  // cover, hitung mundur, jadwal, dan RSVP seperti undangan sungguhan.
  // Data seksi baru di sini adalah contoh fiktif — undangan sungguhan
  // memakai isian editor. Formulir RSVP diganti catatan (pratinjau).
  if (templat.slug === "royal-grace-pernikahan") {
    return (
      <div>
        <UndanganRoyalGrace
          data={{
            namaPertama: templat.contoh.namaPertama,
            namaKedua: templat.contoh.namaKedua,
            jenisAcara: templat.contoh.judulAcara,
            tanggal: templat.contoh.tanggal,
            lokasi: templat.contoh.lokasi,
            fotoUndangan: null,
            fotoSampul: templat.fotoSampul ?? null,
            orangTuaPertama: "",
            orangTuaKedua: "",
            statusAktif: true,
            rsvpTerkirim: false,
            kodeTamu: "",
            waktuMuat: Date.now(),
            tautan: tautanContoh,
            musikSrc: null,
            ringkasan: { totalBalasan: 0, hadir: 0, tidak: 0, ragu: 0, totalTamuHadir: 0, totalTamuRagu: 0 },
            ucapan: [],
            teksPembuka: templat.contoh.salamPembuka,
            kataPengantar: templat.contoh.kutipan,
            kisah: [
              {
                judul: "Pertemuan Pertama",
                cerita:
                  "Kami bertemu di sebuah pameran buku di Jakarta, berbagi meja baca yang sama, dan sejak itu tidak pernah kehabisan cerita.",
              },
            ],
            galeriTambahan: [],
            rekeningBank: "",
            rekeningNomor: "",
            rekeningNama: "",
            alamatKirim: "",
            jadwal: [
              { waktu: "08:00", judul: "Kedatangan Tamu", keterangan: "Registrasi dan sambutan keluarga" },
              { waktu: "09:00", judul: "Akad Nikah", keterangan: "Prosesi sakral bersama keluarga besar" },
              { waktu: "11:00", judul: "Resepsi", keterangan: "Jamuan makan dan hiburan" },
              { waktu: "13:00", judul: "Sesi Foto & Penutup", keterangan: "Foto bersama dan salam perpisahan" },
            ],
            acaraWaktu: "",
            acaraKeduaJudul: "",
            acaraKeduaWaktu: "",
            acaraKeduaLokasi: "",
            praAcara: [
              { tanggal: "17 Juni 2027", waktu: "19:00", judul: "Pengajian & Siraman", lokasi: "Kediaman mempelai wanita" },
              { tanggal: "18 Juni 2027", waktu: "10:00", judul: "Gladi Bersih", lokasi: "The Royal Garden Hall, Jakarta" },
            ],
            dressCode: "Busana formal bernuansa pastel atau earth tone. Hindari warna putih dan hitam pekat.",
            dressCodeWarna: ["#7C8B6F", "#C9A86A", "#F7F0E3", "#E8CFCF", "#8A9B7A"],
            transportasi: "Shuttle tersedia dari Stasiun Gambir menuju venue, keberangkatan pukul 07:00 dan 08:00.",
            akomodasi: "Harga khusus di Hotel Taman Royal (5 menit dari venue) dengan kode ROYAL2027 saat pemesanan.",
            pratinjau: true,
          }}
        />
        <div className="mx-auto max-w-md space-y-3 px-4 py-8">
          <Link
            href={`/editor?templat=${templat.slug}`}
            className="tombol-utama w-full bg-tanah-600 text-sm text-white hover:bg-tanah-700"
          >
            Buat Versi Saya dengan Template Ini
          </Link>
          <TombolWhatsApp templat={templat} tautan={tautanContoh} />
          <Link
            href="/katalog"
            className="flex min-h-[48px] items-center justify-center text-sm font-bold text-tanah-600 underline underline-offset-4"
          >
            Kembali ke katalog
          </Link>
          <p className="pt-2 text-center text-xs leading-relaxed text-tintaLembut">
            Ini halaman contoh untuk demo. Foto di atas adalah foto placeholder dari layanan tanpa kunci API. Di editor, kamu
            bisa menggantinya dengan fotomu sendiri.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:py-10">
      <p className="text-center text-sm font-bold uppercase tracking-widest text-tintaLembut">
        Undangan contoh · {templat.nama}
      </p>
      <div className="mt-4 overflow-hidden rounded-[2rem] shadow-kaca">
        <PratinjauUndangan
          templat={templat}
          data={{
            namaPertama: templat.contoh.namaPertama,
            namaKedua: templat.contoh.namaKedua,
            tanggal: templat.contoh.tanggal,
            lokasi: templat.contoh.lokasi,
            fotoUrl: templat.fotoSampul ?? `https://picsum.photos/seed/${templat.slug}/800/1000`,
          }}
        />
      </div>

      <div className="mt-6 space-y-3">
        <Link
          href={`/editor?templat=${templat.slug}`}
          className="tombol-utama w-full bg-tanah-600 text-sm text-white hover:bg-tanah-700"
        >
          Buat Versi Saya dengan Template Ini
        </Link>
        <TombolWhatsApp templat={templat} tautan={tautanContoh} />
        <Link
          href="/katalog"
          className="flex min-h-[48px] items-center justify-center text-sm font-bold text-tanah-600 underline underline-offset-4"
        >
          Kembali ke katalog
        </Link>
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-tintaLembut">
        Ini halaman contoh untuk demo. Foto di atas adalah foto placeholder dari
        layanan tanpa kunci API. Di editor, kamu bisa menggantinya dengan fotomu sendiri.
      </p>
    </div>
  );
}
