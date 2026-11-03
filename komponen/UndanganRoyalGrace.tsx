"use client";

// Perender halaman penuh untuk templat Royal Grace, diselaraskan ke studi
// visual detail demo referensi (bukan salinan): sampul belah tengah
// ketuk-buka, badan beige linen, nama + heading seksi script hijau tua,
// emas antik hanya sebagai aksen, tombol pill hijau tua, tanpa animasi
// reveal saat gulir.
//
// Semua ornamen digambar ulang sebagai SVG/kode sendiri — tanpa foto,
// musik, watermark, nama, maupun tanggal demo referensi. Data contoh di
// pratinjau memakai nama, tanggal, dan lokasi fiktif Indonesia.
//
// Animasi opening (fakta teramati): sampul diam total sebelum diketuk;
// setelah ketuk, jeda ~0,4 detik tanpa perubahan, lalu garis belah vertikal
// tipis muncul di tengah plakat (~0,4 detik), lalu kedua belahan membuka
// ke kiri/kanan dengan easing halus (~0,8 detik) dan sampul hilang.
// Konten di bawahnya sudah tertata penuh sejak awal — tidak ada
// slide/fade/zoom masuk. Trayek belahan setelah garis tidak tertangkap
// kamera studi (terlalu cepat), jadi geser horizontal adalah interpretasi
// terdekat dari bukti garis tengah, bukan fakta teramati.
//
// Struktur (kolom tunggal mobile-first, teks rata tengah): sampul belah
// tengah -> hero tipografis (hati, lead-in, nama script, orang tua,
// tanggal, SCROLL) -> kartu tanggal + Save the Date -> sambutan (teks +
// foto) -> kisah (kalau diisi) -> galeri (kalau ada foto tambahan) ->
// hitung mundur live -> jadwal acara -> venue + Maps -> dress code
// (kalau diisi) -> pra-acara (kalau diisi) -> transportasi (kalau diisi)
// -> akomodasi (kalau diisi) -> hadiah -> RSVP -> ucapan (kalau ada) ->
// penutup + bagikan. Seksi yang datanya kosong tersembunyi, jadi
// undangan lama tetap tampil rapi.
// Musik hanya tampil kalau musikSrc diisi (halaman tamu memeriksa
// public/musik/royal-grace.mp3); tanpa berkas, tombol musik tidak
// dirender. Musik default mati, sesuai referensi (bukan autoplay).
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Great_Vibes } from "next/font/google";
import { kirimRsvp } from "@/lib/aksiRsvp";
import { buatPesanBagikanUndangan, buatTautanWhatsApp, formatTanggalIndonesia } from "@/lib/format";
import { jadwalEfektif, type ItemJadwal, type ItemPraAcara } from "@/lib/royalGrace";
import type { RingkasanRsvp, Rsvp } from "@/lib/tokoData";

const hurufScript = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--huruf-script",
});

// Palet Royal Grace (sampel piksel render referensi, bukan hex resmi).
const SAGE_GELAP = "#626448";
const SAGE_TERANG = "#797B5F";
const SAGE_PUCAT = "#9AA08A";
const BEIGE = "#D4C4AD";
const HIJAU_TUA = "#2F4A2E";
const EMAS_GELAP = "#8F764D";
const EMAS_TERANG = "#BFA67F";
const PLAKAT = "#D1C5AC";
const PERUNGGU = "#4A4433";
const TINTA = "#2F3527";
const UBIN = "#B7B7A2";
const UBIN_GARIS = "#8D8972";
const GARIS_BELAH = "#3C3D2C";

// Grain halus untuk latar sampul (feTurbulence, kode sendiri).
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.14'/%3E%3C/svg%3E\")";

// Tekstur tenun halus untuk badan undangan (bukan bidang datar).
const TENUN =
  "repeating-linear-gradient(0deg, rgba(0,0,0,0.025) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 4px)";

export interface DataRoyalGrace {
  namaPertama: string;
  namaKedua: string;
  jenisAcara: string;
  tanggal: string;
  lokasi: string;
  fotoUndangan: string | null;
  fotoSampul: string | null;
  orangTuaPertama: string;
  orangTuaKedua: string;
  statusAktif: boolean;
  rsvpTerkirim: boolean;
  pesanGalat?: string;
  kodeTamu: string;
  waktuMuat: number;
  tautan: string;
  musikSrc: string | null;
  ringkasan: RingkasanRsvp;
  ucapan: Rsvp[];
  // Kata-kata editor (opsional; kosong = teks template).
  teksPembuka: string;
  kataPengantar: string;
  // Kisah + galeri (opsional; kosong = seksi tersembunyi).
  kisah: { judul: string; cerita: string }[];
  galeriTambahan: string[];
  // Hadiah (opsional; kosong = hanya pesan elegan).
  rekeningBank: string;
  rekeningNomor: string;
  rekeningNama: string;
  alamatKirim: string;
  // Jadwal + acara lama (jadwal kosong = susun dari acara lama).
  jadwal: ItemJadwal[];
  acaraWaktu: string;
  acaraKeduaJudul: string;
  acaraKeduaWaktu: string;
  acaraKeduaLokasi: string;
  // Royal Grace — kolom baru (opsional; kosong = seksi tersembunyi).
  praAcara: ItemPraAcara[];
  dressCode: string;
  dressCodeWarna: string[];
  transportasi: string;
  akomodasi: string;
  // True saat dirender sebagai pratinjau tema (bukan undangan sungguhan):
  // formulir RSVP diganti catatan, supaya pratinjau tidak mengirim RSVP.
  pratinjau?: boolean;
}

function namaTampil(data: DataRoyalGrace): string {
  return data.namaKedua ? `${data.namaPertama} & ${data.namaKedua}` : data.namaPertama;
}

function useHitungMundur(tanggalIso: string) {
  const target = useMemo(() => {
    const waktu = new Date(`${tanggalIso}T00:00:00`).getTime();
    return Number.isFinite(waktu) ? waktu : null;
  }, [tanggalIso]);
  const [sisa, setSisa] = useState<number>(() => (target === null ? 0 : Math.max(0, target - Date.now())));
  useEffect(() => {
    if (target === null) return;
    const id = setInterval(() => setSisa(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (target === null) return null;
  const totalDetik = Math.floor(sisa / 1000);
  return {
    hari: Math.floor(totalDetik / 86400),
    jam: Math.floor((totalDetik % 86400) / 3600),
    menit: Math.floor((totalDetik % 3600) / 60),
    detik: totalDetik % 60,
    tiba: sisa <= 0,
  };
}

// Tanggal kalender (format YYYYMMDD) + keesokan harinya, untuk tautan
// Google Calendar "Save the Date" (acara seharian).
function tanggalKalender(tanggalIso: string): { mulai: string; selesai: string } | null {
  const cocok = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tanggalIso.trim());
  if (!cocok) return null;
  const awal = new Date(Number(cocok[1]), Number(cocok[2]) - 1, Number(cocok[3]));
  const akhir = new Date(awal.getTime() + 24 * 60 * 60 * 1000);
  const bentuk = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return { mulai: bentuk(awal), selesai: bentuk(akhir) };
}

// Pembungkus seksi polos: studi membuktikan seksi referensi tampil penuh
// begitu masuk viewport, tanpa fade/reveal saat gulir.
function Seksi({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <section id={id} className="px-6 py-10 text-center">
      {children}
    </section>
  );
}

// Semak daun timbul pucat untuk tepi sampul (digambar ulang, bukan aset
// referensi): tangkai melengkung + daun elips berurat, bayangan lembut
// memberi kesan pressed/plaster.
function SemakDaun({ className }: { className?: string }) {
  const daun = (cx: number, cy: number, putar: number) => (
    <g transform={`rotate(${putar} ${cx} ${cy})`}>
      <ellipse cx={cx} cy={cy} rx="17" ry="7" fill={SAGE_PUCAT} opacity="0.9" />
      <line x1={cx - 14} y1={cy} x2={cx + 14} y2={cy} stroke={SAGE_GELAP} strokeWidth="0.8" opacity="0.5" />
    </g>
  );
  return (
    <svg
      viewBox="0 0 100 260"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ filter: "drop-shadow(2px 3px 2px rgba(0,0,0,0.20))" }}
    >
      <path d="M52 252 C 30 190, 72 130, 46 18" stroke={SAGE_PUCAT} strokeWidth="2" strokeLinecap="round" />
      {daun(44, 210, -24)}
      {daun(58, 168, 18)}
      {daun(42, 126, -28)}
      {daun(56, 86, 22)}
      {daun(46, 46, -20)}
    </svg>
  );
}

// Tangkai daun emas kecil untuk plakat (tegak; pakai rotate-180 untuk
// versi terbalik di bawah teks).
function TangkaiEmas({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" fill="none" aria-hidden="true" className={className}>
      <path d="M30 38 C 30 26, 30 14, 30 4" stroke={EMAS_GELAP} strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="20" cy="26" rx="9" ry="4" transform="rotate(-28 20 26)" stroke={EMAS_GELAP} strokeWidth="1.2" />
      <ellipse cx="40" cy="18" rx="9" ry="4" transform="rotate(28 40 18)" stroke={EMAS_GELAP} strokeWidth="1.2" />
      <circle cx="30" cy="4" r="2" fill={EMAS_GELAP} />
    </svg>
  );
}

// Jalur plakat scallop/baroque: runcing atas-bawah, menggelembung di sisi,
// simetris terhadap sumbu x = 150.
const JALUR_PLAKAT = [
  "M150 6",
  "C176 28, 210 38, 218 72",
  "C226 108, 240 118, 244 156",
  "C248 194, 260 208, 256 246",
  "C252 284, 264 306, 256 344",
  "C248 382, 258 404, 248 442",
  "C238 480, 250 502, 238 540",
  "C226 578, 196 596, 150 634",
  "C104 596, 74 578, 62 540",
  "C50 502, 62 480, 52 442",
  "C42 404, 52 382, 44 344",
  "C36 306, 48 284, 44 246",
  "C40 208, 52 194, 56 156",
  "C60 118, 74 108, 82 72",
  "C90 38, 124 28, 150 6 Z",
].join(" ");

// Plakat krem + border scrollwork emas antik + klaster 3 mutiara di titik
// bawah. Isi teks (TAP TO OPEN) dirender HTML di atas SVG ini.
function Plakat() {
  return (
    <svg viewBox="0 0 300 640" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <path d={JALUR_PLAKAT} fill={PLAKAT} style={{ filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.30))" }} />
      <path d={JALUR_PLAKAT} fill="none" stroke={EMAS_GELAP} strokeWidth="2.5" />
      <g transform="translate(150 320) scale(0.94) translate(-150 -320)">
        <path d={JALUR_PLAKAT} fill="none" stroke={EMAS_TERANG} strokeWidth="1" />
      </g>
      {/* Klaster 3 mutiara putih di titik bawah plakat. */}
      <g>
        <circle cx="138" cy="600" r="7" fill="#FFFFFF" stroke="#D8D2C4" strokeWidth="1" />
        <circle cx="150" cy="610" r="7.5" fill="#FFFFFF" stroke="#D8D2C4" strokeWidth="1" />
        <circle cx="162" cy="600" r="7" fill="#FFFFFF" stroke="#D8D2C4" strokeWidth="1" />
        <circle cx="136" cy="597" r="1.8" fill="#FFFFFF" opacity="0.9" />
        <circle cx="148" cy="607" r="1.8" fill="#FFFFFF" opacity="0.9" />
        <circle cx="160" cy="597" r="1.8" fill="#FFFFFF" opacity="0.9" />
      </g>
    </svg>
  );
}

// Satu sisi sampul utuh (dipakai dua kali, dipotong clip-path per panel):
// latar sage bermotif + semak daun tepi + plakat tengah + teks.
function IsiSampul() {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: `linear-gradient(to top right, ${SAGE_GELAP}, ${SAGE_TERANG})` }}
    >
      <div className="absolute inset-0" style={{ backgroundImage: GRAIN }} />
      <SemakDaun className="absolute -left-1 top-[10%] h-[46%] w-[24%] opacity-90" />
      <SemakDaun className="absolute -right-1 top-[10%] h-[46%] w-[24%] -scale-x-100 opacity-90" />
      <SemakDaun className="absolute -bottom-2 left-[6%] h-[26%] w-[16%] rotate-[130deg] opacity-70" />
      <SemakDaun className="absolute -bottom-2 right-[6%] h-[26%] w-[16%] -rotate-[130deg] -scale-x-100 opacity-70" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative"
          style={{ height: "min(94dvh, 680px)", aspectRatio: "300 / 640", maxWidth: "82vw" }}
        >
          <Plakat />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
            <TangkaiEmas className="h-8 w-12" />
            <div className="mt-4 flex items-center gap-2">
              <span className="h-px w-8" style={{ backgroundColor: EMAS_GELAP }} />
              <span className="inline-block h-1.5 w-1.5 rotate-45" style={{ backgroundColor: EMAS_GELAP }} />
              <span className="h-px w-8" style={{ backgroundColor: EMAS_GELAP }} />
            </div>
            <p
              className="mt-5 font-serif text-base font-bold uppercase"
              style={{ color: PERUNGGU, letterSpacing: "0.25em" }}
            >
              Tap to Open
            </p>
            <div className="mt-5 flex items-center gap-2">
              <span className="h-px w-8" style={{ backgroundColor: EMAS_GELAP }} />
              <span className="inline-block h-1.5 w-1.5 rotate-45" style={{ backgroundColor: EMAS_GELAP }} />
              <span className="h-px w-8" style={{ backgroundColor: EMAS_GELAP }} />
            </div>
            <TangkaiEmas className="mt-4 h-8 w-12 rotate-180" />
          </div>
        </div>
      </div>
    </div>
  );
}

type TahapSampul = "sampul" | "garis" | "membuka" | "terbuka";

// Sampul belah tengah: dua panel (masing-masing setengah sampul via
// clip-path) + garis belah terpisah di tengah. Timeline: ketuk -> diam
// 400ms -> garis muncul 400ms -> panel bergeser keluar 800ms ease-in-out.
function SampulBelah({ tahap, onBuka }: { tahap: TahapSampul; onBuka: () => void }) {
  const membuka = tahap === "membuka";
  const panel = (sisi: "kiri" | "kanan") => ({
    clipPath: sisi === "kiri" ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)",
    transform: membuka ? (sisi === "kiri" ? "translateX(-100%)" : "translateX(100%)") : "translateX(0)",
    transition: "transform 800ms ease-in-out",
  });
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Ketuk untuk membuka undangan"
      onClick={onBuka}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onBuka();
        }
      }}
      className="fixed inset-0 z-50 cursor-pointer overflow-hidden"
    >
      <div className="absolute inset-0" style={panel("kiri")}>
        <IsiSampul />
      </div>
      <div className="absolute inset-0" style={panel("kanan")}>
        <IsiSampul />
      </div>
      {/* Garis belah vertikal tengah: muncul saat fase "garis", memudar
          saat panel mulai bergeser. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 top-0 w-[2px] -translate-x-1/2"
        style={{
          backgroundColor: GARIS_BELAH,
          opacity: tahap === "garis" ? 1 : 0,
          transition: "opacity 400ms ease",
        }}
      />
    </div>
  );
}

function JudulSeksi({ children }: { children: ReactNode }) {
  return (
    <div>
      <TangkaiEmas className="mx-auto h-5 w-12 opacity-90" />
      <h2 className="mt-2 font-script leading-tight" style={{ color: HIJAU_TUA, fontSize: "38px" }}>
        {children}
      </h2>
      <div className="mx-auto mt-3 h-px w-16" style={{ backgroundColor: EMAS_GELAP }} />
    </div>
  );
}

export default function UndanganRoyalGrace({ data }: { data: DataRoyalGrace }) {
  const [tahap, setTahap] = useState<TahapSampul>("sampul");
  const [musikMain, setMusikMain] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hitungMundur = useHitungMundur(data.tanggal);
  const jadwal = jadwalEfektif(
    data.jadwal,
    data.acaraWaktu,
    data.acaraKeduaJudul,
    data.acaraKeduaWaktu,
    data.acaraKeduaLokasi,
  );
  const fotoSambutan =
    data.fotoUndangan ?? data.fotoSampul ?? "https://picsum.photos/seed/royal-grace/800/1000";
  const kalender = tanggalKalender(data.tanggal);
  const tautanMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.lokasi)}`;
  const tautanKalender = kalender
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        `${namaTampil(data)} — ${data.jenisAcara}`,
      )}&dates=${kalender.mulai}/${kalender.selesai}&details=${encodeURIComponent(
        `Undangan ${data.jenisAcara} ${namaTampil(data)} di ${data.lokasi}.`,
      )}&location=${encodeURIComponent(data.lokasi)}`
    : null;

  // Kunci gulir selama sampul tampil.
  useEffect(() => {
    document.body.style.overflow = tahap === "terbuka" ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [tahap]);

  // Timeline opening: ketuk -> diam 400ms -> garis 400ms -> belah 800ms.
  function bukaUndangan() {
    if (tahap !== "sampul") return;
    setTahap("garis");
    window.setTimeout(() => setTahap("membuka"), 400);
    window.setTimeout(() => setTahap("terbuka"), 1200);
  }

  function alihMusik() {
    const audio = audioRef.current;
    if (!audio) return;
    if (musikMain) {
      audio.pause();
      setMusikMain(false);
    } else {
      audio
        .play()
        .then(() => setMusikMain(true))
        .catch(() => setMusikMain(false));
    }
  }

  const nama = namaTampil(data);
  const pesanBagikan = buatPesanBagikanUndangan(
    data.jenisAcara,
    data.namaPertama,
    data.namaKedua,
    data.tanggal,
    data.lokasi,
    data.tautan,
  );

  return (
    <div
      className={`${hurufScript.variable} mx-auto min-h-dvh max-w-md`}
      style={{ backgroundColor: BEIGE, backgroundImage: TENUN, color: TINTA }}
    >
      {data.musikSrc && <audio ref={audioRef} src={data.musikSrc} loop preload="auto" />}

      {/* Sampul belah tengah (ketuk di mana saja untuk membuka). */}
      {tahap !== "terbuka" && <SampulBelah tahap={tahap} onBuka={bukaUndangan} />}

      {/* Tombol musik: kotak hijau tua pojok kanan atas, hanya kalau ada berkas. */}
      {data.musikSrc && (
        <button
          type="button"
          onClick={alihMusik}
          aria-label={musikMain ? "Matikan musik" : "Putar musik"}
          className="fixed right-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-lg text-lg text-white shadow-lg"
          style={{ backgroundColor: HIJAU_TUA }}
        >
          {musikMain ? (
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
              <path
                d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
              <path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      )}

      {/* Hero tipografis: tanpa foto berbingkai. */}
      <section id="beranda" className="px-6 pb-8 pt-14 text-center">
        <svg viewBox="0 0 24 24" className="mx-auto h-5 w-5" aria-hidden="true">
          <path
            d="M12 21C12 21 4 16.5 4 10.5C4 7.5 6.5 5 9 5C10.5 5 11.5 5.8 12 6.8C12.5 5.8 13.5 5 15 5C17.5 5 20 7.5 20 10.5C20 16.5 12 21 12 21Z"
            fill={HIJAU_TUA}
          />
        </svg>
        <p className="mt-3 font-serif text-xl italic" style={{ color: HIJAU_TUA }}>
          We&apos;re getting married
        </p>
        <h1
          className="mt-4 font-script leading-[1.08]"
          style={{ color: HIJAU_TUA, fontSize: "64px" }}
        >
          {data.namaPertama}
          {data.namaKedua && (
            <>
              <br />
              <span style={{ fontSize: "40px" }}>&amp;</span>
              <br />
              {data.namaKedua}
            </>
          )}
        </h1>
        {(data.orangTuaPertama || data.orangTuaKedua) && (
          <div className="mx-auto mt-5 max-w-sm space-y-2 font-serif text-[15px] italic leading-relaxed">
            {data.orangTuaPertama && <p>{data.orangTuaPertama}</p>}
            {data.orangTuaKedua && <p>{data.orangTuaKedua}</p>}
          </div>
        )}
        <p
          className="mt-6 font-serif text-sm uppercase"
          style={{ color: HIJAU_TUA, letterSpacing: "0.2em" }}
        >
          {formatTanggalIndonesia(data.tanggal)}
        </p>
        <p className="mt-2 font-serif text-[15px] italic">{data.lokasi}</p>
        <div className="mt-10">
          <p
            className="font-serif text-xs uppercase"
            style={{ color: HIJAU_TUA, letterSpacing: "0.3em" }}
          >
            Scroll
          </p>
          <svg viewBox="0 0 24 24" fill="none" className="mx-auto mt-1 h-5 w-5" aria-hidden="true">
            <path
              d="M6 9l6 6 6-6"
              stroke={HIJAU_TUA}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </section>

      {/* Kartu tanggal + Save the Date (tombol pill hijau tua). */}
      <section className="px-6 pb-10 text-center">
        <div
          className="mx-auto max-w-sm rounded-[1.5rem] bg-white/30 px-6 py-5"
          style={{ border: `1px solid ${EMAS_TERANG}` }}
        >
          <p className="font-serif text-lg italic" style={{ color: HIJAU_TUA }}>
            You&apos;re Invited!
          </p>
          <p className="mt-2 font-serif text-xl font-bold">{formatTanggalIndonesia(data.tanggal)}</p>
          <p className="mt-1 text-sm opacity-90">{data.lokasi}</p>
          <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed">
            {data.teksPembuka ||
              "Dengan penuh syukur dan kebahagiaan, kami mengundang Bapak, Ibu, dan Saudara/i tercinta untuk hadir dan merayakan hari istimewa kami."}
          </p>
          {tautanKalender && (
            <a
              href={tautanKalender}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex min-h-[44px] items-center rounded-full px-6 text-sm font-bold text-white"
              style={{ backgroundColor: HIJAU_TUA }}
            >
              Save the Date
            </a>
          )}
        </div>
      </section>

      {/* Sambutan: teks + foto pasangan di bawahnya (tanpa bingkai emas). */}
      <Seksi id="sambutan">
        <JudulSeksi>Sambutan</JudulSeksi>
        <p className="mx-auto mt-5 max-w-sm font-serif text-[15px] italic leading-relaxed">
          {data.kataPengantar ||
            "Kehadiran dan doa restu Anda adalah hadiah terindah bagi kami. Terima kasih sudah menjadi bagian dari perjalanan ini."}
        </p>
        <div className="mx-auto mt-6 max-w-[280px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fotoSambutan} alt={`Foto ${nama}`} className="h-[380px] w-full rounded-xl object-cover" />
        </div>
      </Seksi>

      {/* Kisah */}
      {data.kisah.length > 0 && (
        <Seksi id="kisah">
          <JudulSeksi>Kisah Kami</JudulSeksi>
          <div className="mx-auto mt-5 max-w-sm space-y-5">
            {data.kisah.map((babak, i) => (
              <div key={i}>
                <h3 className="font-serif text-lg font-bold" style={{ color: HIJAU_TUA }}>
                  {babak.judul}
                </h3>
                <p className="mt-1 font-serif text-[15px] italic leading-relaxed">{babak.cerita}</p>
              </div>
            ))}
          </div>
        </Seksi>
      )}

      {/* Galeri: foto landscape sudut membulat, tanpa border emas. */}
      {data.galeriTambahan.length > 0 && (
        <Seksi id="galeri">
          <JudulSeksi>Galeri</JudulSeksi>
          <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-3">
            {data.galeriTambahan.map((jalur, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={jalur} alt={`Galeri ${i + 1}`} className="h-44 w-full rounded-xl object-cover" />
            ))}
          </div>
        </Seksi>
      )}

      {/* Hitung Mundur: ubin sage-grey pucat, angka serif hijau tua. */}
      <Seksi id="hitung-mundur">
        <JudulSeksi>Hitung Mundur</JudulSeksi>
        {hitungMundur === null ? (
          <p className="mt-5 text-[15px]">Tanggal acara belum ditentukan.</p>
        ) : hitungMundur.tiba ? (
          <p className="mt-5 font-serif text-xl font-bold" style={{ color: HIJAU_TUA }}>
            Hari ini adalah harinya!
          </p>
        ) : (
          <div className="mx-auto mt-5 grid max-w-sm grid-cols-4 gap-2">
            {[
              { nilai: hitungMundur.hari, label: "Hari" },
              { nilai: hitungMundur.jam, label: "Jam" },
              { nilai: hitungMundur.menit, label: "Menit" },
              { nilai: hitungMundur.detik, label: "Detik" },
            ].map((kotak) => (
              <div
                key={kotak.label}
                className="rounded-lg px-2 py-4"
                style={{ backgroundColor: UBIN, border: `1px solid ${UBIN_GARIS}` }}
              >
                <p className="font-serif text-3xl font-bold" style={{ color: HIJAU_TUA }}>
                  {String(kotak.nilai).padStart(2, "0")}
                </p>
                <p
                  className="mt-1 text-[11px] uppercase"
                  style={{ color: HIJAU_TUA, letterSpacing: "0.2em" }}
                >
                  {kotak.label}
                </p>
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-sm" style={{ color: HIJAU_TUA }}>
          {formatTanggalIndonesia(data.tanggal)}
        </p>
      </Seksi>

      {/* Jadwal Acara */}
      {jadwal.length > 0 && (
        <Seksi id="jadwal">
          <JudulSeksi>Jadwal Acara</JudulSeksi>
          <p
            className="mt-4 font-serif text-sm font-bold uppercase"
            style={{ color: HIJAU_TUA, letterSpacing: "0.2em" }}
          >
            {formatTanggalIndonesia(data.tanggal)}
          </p>
          <ol className="mx-auto mt-5 max-w-sm space-y-5">
            {jadwal.map((item, i) => (
              <li key={i} className="relative pb-1">
                {i < jadwal.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-12 h-full w-px -translate-x-1/2"
                    style={{ backgroundColor: `${EMAS_TERANG}88` }}
                  />
                )}
                <p className="font-serif text-lg font-bold" style={{ color: HIJAU_TUA }}>
                  {item.waktu || "—"}
                </p>
                <p className="mt-1 font-serif text-lg font-bold">{item.judul}</p>
                {item.keterangan && (
                  <p className="mt-1 font-serif text-sm italic leading-relaxed opacity-90">{item.keterangan}</p>
                )}
              </li>
            ))}
          </ol>
        </Seksi>
      )}

      {/* Venue */}
      <Seksi id="venue">
        <JudulSeksi>Venue</JudulSeksi>
        <p className="mx-auto mt-5 max-w-sm font-serif text-xl font-bold">{data.lokasi}</p>
        <a
          href={tautanMaps}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex min-h-[48px] items-center rounded-full px-7 text-sm font-bold text-white"
          style={{ backgroundColor: HIJAU_TUA }}
        >
          View on Google Maps
        </a>
      </Seksi>

      {/* Dress Code */}
      {(data.dressCode || data.dressCodeWarna.length > 0) && (
        <Seksi id="dress-code">
          <JudulSeksi>Dress Code</JudulSeksi>
          {data.dressCodeWarna.length > 0 && (
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {data.dressCodeWarna.map((warna, i) => (
                <span
                  key={i}
                  title={warna}
                  className="inline-block h-9 w-9 rounded-full"
                  style={{ backgroundColor: warna, border: `2px solid ${EMAS_TERANG}` }}
                />
              ))}
            </div>
          )}
          {data.dressCode && (
            <p className="mx-auto mt-4 max-w-sm font-serif text-[15px] italic leading-relaxed">{data.dressCode}</p>
          )}
        </Seksi>
      )}

      {/* Pra-Acara */}
      {data.praAcara.length > 0 && (
        <Seksi id="pra-acara">
          <JudulSeksi>Pra-Acara</JudulSeksi>
          <ol className="mx-auto mt-5 max-w-sm space-y-4">
            {data.praAcara.map((item, i) => (
              <li
                key={i}
                className="rounded-[1.25rem] bg-white/30 px-5 py-4"
                style={{ border: `1px solid ${EMAS_TERANG}` }}
              >
                <p
                  className="font-serif text-xs font-bold uppercase"
                  style={{ color: HIJAU_TUA, letterSpacing: "0.2em" }}
                >
                  {item.tanggal}
                  {item.waktu ? ` · ${item.waktu}` : ""}
                </p>
                <p className="mt-1 font-serif text-lg font-bold">{item.judul}</p>
                {item.lokasi && <p className="mt-1 text-sm opacity-90">{item.lokasi}</p>}
              </li>
            ))}
          </ol>
        </Seksi>
      )}

      {/* Transportasi */}
      {data.transportasi && (
        <Seksi id="transportasi">
          <JudulSeksi>Transportasi</JudulSeksi>
          <p className="mx-auto mt-5 max-w-sm font-serif text-[15px] italic leading-relaxed">{data.transportasi}</p>
        </Seksi>
      )}

      {/* Akomodasi */}
      {data.akomodasi && (
        <Seksi id="akomodasi">
          <JudulSeksi>Akomodasi</JudulSeksi>
          <p className="mx-auto mt-5 max-w-sm font-serif text-[15px] italic leading-relaxed">{data.akomodasi}</p>
        </Seksi>
      )}

      {/* Hadiah */}
      <Seksi id="hadiah">
        <JudulSeksi>Hadiah</JudulSeksi>
        <p className="mx-auto mt-5 max-w-sm font-serif text-[15px] italic leading-relaxed">
          Kehadiran, cinta, dan doa restu Anda adalah hadiah terbesar bagi kami.
        </p>
        {(data.rekeningBank || data.rekeningNomor || data.alamatKirim) && (
          <div
            className="mx-auto mt-5 max-w-sm rounded-[1.25rem] bg-white/30 px-5 py-4 text-sm"
            style={{ border: `1px solid ${EMAS_TERANG}` }}
          >
            {data.rekeningBank && (
              <p>
                <span className="font-bold" style={{ color: HIJAU_TUA }}>
                  {data.rekeningBank}
                </span>
                <br />
                {data.rekeningNomor}
                {data.rekeningNama ? ` — ${data.rekeningNama}` : ""}
              </p>
            )}
            {data.alamatKirim && <p className="mt-3 leading-relaxed">{data.alamatKirim}</p>}
          </div>
        )}
      </Seksi>

      {/* RSVP */}
      <Seksi id="rsvp">
        <JudulSeksi>RSVP</JudulSeksi>
        <p className="mt-4 font-serif text-[15px] italic">Kami tidak sabar merayakannya bersama Anda!</p>
        {data.pesanGalat && (
          <p role="alert" className="mx-auto mt-4 max-w-sm rounded-2xl bg-red-100 px-4 py-3 text-sm font-bold text-red-800">
            {data.pesanGalat}
          </p>
        )}
        {data.pratinjau ? (
          <p
            className="mx-auto mt-5 max-w-sm rounded-2xl bg-white/30 px-4 py-3 text-sm"
            style={{ border: `1px solid ${EMAS_TERANG}` }}
          >
            Ini pratinjau tema — formulir RSVP aktif di undangan sungguhan, bukan di sini.
          </p>
        ) : data.rsvpTerkirim ? (
          <p
            role="status"
            className="mx-auto mt-5 max-w-sm rounded-2xl px-4 py-3 text-sm font-bold"
            style={{ backgroundColor: `${SAGE_PUCAT}55` }}
          >
            Terima kasih! Konfirmasimu sudah tersimpan.
          </p>
        ) : data.statusAktif ? (
          <form action={kirimRsvp} className="mx-auto mt-5 max-w-sm space-y-4 text-left">
            <input type="hidden" name="kode" value={data.kodeTamu} />
            <input type="hidden" name="waktu_muat" value={String(data.waktuMuat)} />
            <input
              type="text"
              name="situs_web"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />
            <div>
              <label htmlFor="rsvp-nama-royal" className="text-sm font-bold" style={{ color: HIJAU_TUA }}>
                Nama Anda
              </label>
              <input
                id="rsvp-nama-royal"
                name="nama"
                required
                minLength={2}
                placeholder="Nama lengkap"
                className="mt-1 min-h-[48px] w-full rounded-2xl border bg-white px-4 text-[15px] placeholder:text-stone-400"
                style={{ borderColor: `${EMAS_TERANG}` }}
              />
            </div>
            <div>
              <label htmlFor="rsvp-hadir-royal" className="text-sm font-bold" style={{ color: HIJAU_TUA }}>
                Apakah Anda akan hadir?
              </label>
              <select
                id="rsvp-hadir-royal"
                name="kehadiran"
                className="mt-1 min-h-[48px] w-full rounded-2xl border bg-white px-4 text-[15px]"
                style={{ borderColor: `${EMAS_TERANG}` }}
              >
                <option value="Hadir">Hadir</option>
                <option value="Ragu">Masih ragu</option>
                <option value="Tidak">Tidak bisa hadir</option>
              </select>
            </div>
            <div>
              <label htmlFor="rsvp-pesan-royal" className="text-sm font-bold" style={{ color: HIJAU_TUA }}>
                Pesan Anda
              </label>
              <textarea
                id="rsvp-pesan-royal"
                name="pesan"
                rows={3}
                placeholder="Tulis doa atau pesan untuk kedua mempelai"
                className="mt-1 w-full rounded-2xl border bg-white px-4 py-3 text-[15px] placeholder:text-stone-400"
                style={{ borderColor: `${EMAS_TERANG}` }}
              />
            </div>
            <div className="text-center">
              <button
                type="submit"
                className="min-h-[48px] rounded-full px-8 text-sm font-bold text-white"
                style={{ backgroundColor: HIJAU_TUA }}
              >
                Send Message
              </button>
            </div>
          </form>
        ) : (
          <p
            className="mx-auto mt-5 max-w-sm rounded-2xl bg-white/30 px-4 py-3 text-sm font-bold"
            style={{ border: `1px solid ${EMAS_TERANG}` }}
          >
            Konfirmasi kehadiran untuk undangan ini sudah ditutup. Terima kasih atas doa dan perhatiannya.
          </p>
        )}
        {data.ringkasan.totalBalasan > 0 && (
          <p className="mt-4 text-sm opacity-90">
            {data.ringkasan.hadir} balasan hadir, {data.ringkasan.ragu} masih ragu, {data.ringkasan.tidak} tidak bisa
            hadir.
          </p>
        )}
      </Seksi>

      {/* Ucapan */}
      {data.ucapan.length > 0 && (
        <Seksi id="ucapan">
          <JudulSeksi>Ucapan &amp; Doa</JudulSeksi>
          <ul className="mx-auto mt-5 max-w-sm space-y-3 text-left">
            {data.ucapan.map((rsvp) => (
              <li
                key={rsvp.id}
                className="rounded-[1.25rem] bg-white/70 p-4"
                style={{ border: `1px solid ${EMAS_TERANG}88` }}
              >
                <p className="flex flex-wrap items-center justify-between gap-2 font-bold">
                  {rsvp.nama}
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: HIJAU_TUA }}
                  >
                    {rsvp.kehadiran === "Hadir" ? "Hadir" : rsvp.kehadiran === "Ragu" ? "Masih ragu" : "Tidak bisa hadir"}
                  </span>
                </p>
                {rsvp.pesan && <p className="mt-2 text-[15px] leading-relaxed">{rsvp.pesan}</p>}
              </li>
            ))}
          </ul>
        </Seksi>
      )}

      {/* Penutup */}
      <Seksi id="penutup">
        <TangkaiEmas className="mx-auto h-5 w-12 opacity-90" />
        <p className="mt-4 font-serif text-[15px] italic leading-relaxed">
          Kami tidak sabar merayakannya bersama Anda!
        </p>
        <p className="mt-4 font-script" style={{ color: HIJAU_TUA, fontSize: "40px" }}>
          {nama}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href={buatTautanWhatsApp(pesanBagikan)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[48px] items-center rounded-full px-6 text-sm font-bold text-white"
            style={{ backgroundColor: HIJAU_TUA }}
          >
            Bagikan via WhatsApp
          </a>
          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center text-sm font-bold underline underline-offset-4"
            style={{ color: HIJAU_TUA }}
          >
            Dibuat dengan BETA Storia
          </Link>
        </div>
        <p className="mt-8 pb-4 text-xs opacity-70">Royal Grace · BETA Storia</p>
      </Seksi>
    </div>
  );
}
