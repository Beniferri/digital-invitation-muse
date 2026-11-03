"use client";

// Perender halaman penuh untuk templat Royal Grace (undangan pernikahan
// bernuansa taman-istana: sage, ivory, dan emas antik).
//
// Karya tiruan visual dari referensi demo (bukan salinan): palet, susunan
// seksi, dan interaksi cover meniru referensi, tapi semua ornamen digambar
// ulang sebagai SVG/kode sendiri — tanpa foto, musik, watermark, maupun
// nama/tanggal demo referensi. Data contoh di pratinjau memakai nama,
// tanggal, dan lokasi fiktif Indonesia.
//
// Struktur (kolom tunggal mobile-first, teks rata tengah, tombol pill
// emas): sampul ketuk-buka -> hero (label, nama script, foto bingkai
// emas ganda, kartu tanggal + Save the Date) -> sambutan -> kisah
// (kalau diisi) -> galeri (kalau ada foto tambahan) -> hitung mundur
// live -> jadwal acara -> venue + Maps -> dress code (kalau diisi) ->
// pra-acara (kalau diisi) -> transportasi (kalau diisi) -> akomodasi
// (kalau diisi) -> hadiah -> RSVP -> ucapan (kalau ada) -> penutup +
// bagikan. Seksi yang datanya kosong tersembunyi, jadi undangan lama
// tetap tampil rapi.
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

// Palet Royal Grace (estimasi visual dari referensi, bukan hex resmi).
const SAGE = "#7C8B6F";
const OLIVE = "#46543A";
const IVORY = "#F7F0E3";
const EMAS = "#C9A86A";
const TINTA = "#2F3527";

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

function inisial(nama: string): string {
  const kata = nama.trim().split(/\s+/)[0] ?? "";
  return kata.charAt(0).toUpperCase() || "U";
}

function namaTampil(data: DataRoyalGrace): string {
  return data.namaKedua ? `${data.namaPertama} & ${data.namaKedua}` : data.namaPertama;
}

function monogram(data: DataRoyalGrace): string {
  return data.namaKedua ? `${inisial(data.namaPertama)} & ${inisial(data.namaKedua)}` : inisial(data.namaPertama);
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

// Pembungkus seksi dengan reveal halus saat digulir ke layar.
function Ungkap({ id, children }: { id?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement | null>(null);
  const [terlihat, setTerlihat] = useState(false);
  useEffect(() => {
    const elemen = ref.current;
    if (!elemen) return;
    const pengamat = new IntersectionObserver(
      (entri) => {
        if (entri[0].isIntersecting) {
          setTerlihat(true);
          pengamat.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    pengamat.observe(elemen);
    return () => pengamat.disconnect();
  }, []);
  return (
    <section
      id={id}
      ref={ref}
      className="px-6 py-10 text-center transition-all duration-700"
      style={{ opacity: terlihat ? 1 : 0, transform: terlihat ? "translateY(0)" : "translateY(18px)" }}
    >
      {children}
    </section>
  );
}

// Ornamen daun asli (digambar ulang, bukan aset referensi): tangkai
// melengkung + tiga daun elips, dipakai sebagai hiasan sampul dan seksi.
function OrnamenDaun({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 48" fill="none" aria-hidden="true" className={className}>
      <path d="M6 42 C 40 40, 80 34, 114 10" stroke={EMAS} strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="38" cy="36" rx="14" ry="6" transform="rotate(-18 38 36)" stroke={EMAS} strokeWidth="1.5" />
      <ellipse cx="68" cy="28" rx="13" ry="6" transform="rotate(-24 68 28)" stroke={EMAS} strokeWidth="1.5" />
      <ellipse cx="94" cy="16" rx="11" ry="5" transform="rotate(-30 94 16)" stroke={EMAS} strokeWidth="1.5" />
      <circle cx="114" cy="10" r="2.5" fill={EMAS} />
    </svg>
  );
}

function JudulSeksi({ children }: { children: ReactNode }) {
  return (
    <div>
      <OrnamenDaun className="mx-auto h-6 w-24 opacity-80" />
      <h2
        className="mt-2 font-serif text-xl font-bold uppercase tracking-[0.2em]"
        style={{ color: OLIVE }}
      >
        {children}
      </h2>
      <div className="mx-auto mt-3 h-px w-16" style={{ backgroundColor: EMAS }} />
    </div>
  );
}

export default function UndanganRoyalGrace({ data }: { data: DataRoyalGrace }) {
  const [tahap, setTahap] = useState<"sampul" | "membuka" | "terbuka">("sampul");
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
  const fotoHero =
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

  // Kunci gulir selama sampul tampil; buka sampul dengan fade singkat.
  useEffect(() => {
    document.body.style.overflow = tahap === "terbuka" ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [tahap]);

  function bukaUndangan() {
    if (tahap !== "sampul") return;
    setTahap("membuka");
    window.setTimeout(() => setTahap("terbuka"), 600);
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
      style={{ backgroundColor: IVORY, color: TINTA }}
    >
      {data.musikSrc && <audio ref={audioRef} src={data.musikSrc} loop preload="auto" />}

      {/* Sampul: panel sage full-screen + plakat krem gantung tali emas. */}
      {tahap !== "terbuka" && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 transition-opacity duration-500"
          style={{
            backgroundColor: SAGE,
            opacity: tahap === "membuka" ? 0 : 1,
            backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        >
          <OrnamenDaun className="h-8 w-32 opacity-90" />
          <div className="mt-2 flex flex-col items-center">
            <div className="h-16 w-px" style={{ backgroundColor: EMAS }} />
            <div
              className="rounded-[2rem] px-8 py-8 text-center shadow-xl"
              style={{
                backgroundColor: IVORY,
                border: `2px solid ${EMAS}`,
                boxShadow: `0 0 0 6px ${IVORY}, 0 0 0 8px ${EMAS}55`,
              }}
            >
              <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: OLIVE }}>
                Undangan
              </p>
              <p className="mt-2 font-script text-4xl leading-tight" style={{ color: EMAS }}>
                {monogram(data)}
              </p>
              <p className="mt-2 text-sm" style={{ color: TINTA }}>
                {data.jenisAcara}
              </p>
              <button
                type="button"
                onClick={bukaUndangan}
                className="mt-5 min-h-[48px] rounded-full px-8 text-sm font-bold uppercase tracking-widest text-white transition hover:opacity-90"
                style={{ backgroundColor: OLIVE }}
              >
                Tap to Open
              </button>
            </div>
          </div>
          <OrnamenDaun className="mt-6 h-8 w-32 -scale-x-100 opacity-90" />
        </div>
      )}

      {/* Tombol musik: kotak olive pojok kanan atas, hanya kalau ada berkas. */}
      {data.musikSrc && (
        <button
          type="button"
          onClick={alihMusik}
          aria-label={musikMain ? "Matikan musik" : "Putar musik"}
          className="fixed right-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-lg text-lg text-white shadow-lg"
          style={{ backgroundColor: OLIVE }}
        >
          {musikMain ? (
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path
                d="M4 9v6h4l5 4V5L8 9H4z"
                fill="currentColor"
              />
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

      {/* Hero */}
      <section id="beranda" className="px-6 pb-10 pt-14 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: OLIVE }}>
          We&apos;re Getting Married
        </p>
        <h1 className="mt-4 font-script text-5xl leading-tight sm:text-6xl" style={{ color: EMAS }}>
          {nama}
        </h1>
        <OrnamenDaun className="mx-auto mt-4 h-6 w-24 opacity-80" />
        <div className="mx-auto mt-6 max-w-[280px]">
          <div className="p-1.5" style={{ border: `2px solid ${EMAS}` }}>
            <div className="relative p-1.5" style={{ border: `1px solid ${EMAS}88` }}>
              {/* Ornamen sudut bingkai emas ganda. */}
              <span className="absolute -left-1 -top-1 h-4 w-4 border-l-2 border-t-2" style={{ borderColor: EMAS }} />
              <span className="absolute -right-1 -top-1 h-4 w-4 border-r-2 border-t-2" style={{ borderColor: EMAS }} />
              <span className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2" style={{ borderColor: EMAS }} />
              <span className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2" style={{ borderColor: EMAS }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fotoHero} alt={`Foto ${nama}`} className="h-[380px] w-full object-cover" />
            </div>
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-sm text-[15px] leading-relaxed">
          {data.teksPembuka ||
            "Dengan penuh syukur dan kebahagiaan, kami mengundang Bapak, Ibu, dan Saudara/i tercinta untuk hadir dan merayakan hari istimewa kami."}
        </p>
        <div
          className="mx-auto mt-6 max-w-sm rounded-[1.5rem] px-6 py-5"
          style={{ backgroundColor: OLIVE, color: IVORY }}
        >
          <p className="text-sm uppercase tracking-widest" style={{ color: EMAS }}>
            You&apos;re Invited!
          </p>
          <p className="mt-2 font-serif text-xl font-bold">{formatTanggalIndonesia(data.tanggal)}</p>
          <p className="mt-1 text-sm opacity-90">{data.lokasi}</p>
          {tautanKalender && (
            <a
              href={tautanKalender}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex min-h-[44px] items-center rounded-full px-6 text-sm font-bold text-white"
              style={{ backgroundColor: EMAS, color: TINTA }}
            >
              Save the Date
            </a>
          )}
        </div>
      </section>

      {/* Sambutan */}
      <Ungkap id="sambutan">
        <JudulSeksi>Sambutan</JudulSeksi>
        <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed">
          {data.kataPengantar ||
            "Kehadiran dan doa restu Anda adalah hadiah terindah bagi kami. Terima kasih sudah menjadi bagian dari perjalanan ini."}
        </p>
        {(data.orangTuaPertama || data.orangTuaKedua) && (
          <div className="mx-auto mt-6 max-w-sm space-y-3 text-sm">
            {data.orangTuaPertama && (
              <p>
                <span className="font-bold" style={{ color: OLIVE }}>
                  Keluarga {data.namaPertama}
                </span>
                <br />
                {data.orangTuaPertama}
              </p>
            )}
            {data.orangTuaKedua && (
              <p>
                <span className="font-bold" style={{ color: OLIVE }}>
                  Keluarga {data.namaKedua}
                </span>
                <br />
                {data.orangTuaKedua}
              </p>
            )}
          </div>
        )}
      </Ungkap>

      {/* Kisah */}
      {data.kisah.length > 0 && (
        <Ungkap id="kisah">
          <JudulSeksi>Kisah Kami</JudulSeksi>
          <div className="mx-auto mt-5 max-w-sm space-y-5">
            {data.kisah.map((babak, i) => (
              <div key={i}>
                <h3 className="font-serif text-lg font-bold" style={{ color: OLIVE }}>
                  {babak.judul}
                </h3>
                <p className="mt-1 text-[15px] leading-relaxed">{babak.cerita}</p>
              </div>
            ))}
          </div>
        </Ungkap>
      )}

      {/* Galeri */}
      {data.galeriTambahan.length > 0 && (
        <Ungkap id="galeri">
          <JudulSeksi>Galeri</JudulSeksi>
          <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-3">
            {data.galeriTambahan.map((jalur, i) => (
              <div key={i} className="p-1" style={{ border: `1px solid ${EMAS}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={jalur} alt={`Galeri ${i + 1}`} className="h-44 w-full rounded-lg object-cover" />
              </div>
            ))}
          </div>
        </Ungkap>
      )}

      {/* Hitung Mundur */}
      <Ungkap id="hitung-mundur">
        <JudulSeksi>Hitung Mundur</JudulSeksi>
        {hitungMundur === null ? (
          <p className="mt-5 text-[15px]">Tanggal acara belum ditentukan.</p>
        ) : hitungMundur.tiba ? (
          <p className="mt-5 font-serif text-xl font-bold" style={{ color: OLIVE }}>
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
              <div key={kotak.label} className="rounded-xl px-2 py-4 text-white" style={{ backgroundColor: OLIVE }}>
                <p className="font-serif text-3xl font-bold" style={{ color: EMAS }}>
                  {String(kotak.nilai).padStart(2, "0")}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-widest opacity-90">{kotak.label}</p>
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-sm" style={{ color: OLIVE }}>
          {formatTanggalIndonesia(data.tanggal)}
        </p>
      </Ungkap>

      {/* Jadwal Acara */}
      {jadwal.length > 0 && (
        <Ungkap id="jadwal">
          <JudulSeksi>Jadwal Acara</JudulSeksi>
          <p className="mt-4 text-sm font-bold uppercase tracking-widest" style={{ color: OLIVE }}>
            {formatTanggalIndonesia(data.tanggal)}
          </p>
          <ol className="mx-auto mt-5 max-w-sm space-y-5">
            {jadwal.map((item, i) => (
              <li key={i} className="relative pb-1">
                {i < jadwal.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-12 h-full w-px -translate-x-1/2"
                    style={{ backgroundColor: `${EMAS}66` }}
                  />
                )}
                <p className="font-serif text-lg font-bold" style={{ color: EMAS }}>
                  {item.waktu || "—"}
                </p>
                <p className="mt-1 font-serif text-lg font-bold">{item.judul}</p>
                {item.keterangan && <p className="mt-1 text-sm leading-relaxed opacity-90">{item.keterangan}</p>}
              </li>
            ))}
          </ol>
        </Ungkap>
      )}

      {/* Venue */}
      <Ungkap id="venue">
        <JudulSeksi>Venue</JudulSeksi>
        <p className="mx-auto mt-5 max-w-sm font-serif text-xl font-bold">{data.lokasi}</p>
        <a
          href={tautanMaps}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex min-h-[48px] items-center rounded-full px-7 text-sm font-bold"
          style={{ backgroundColor: EMAS, color: TINTA }}
        >
          View on Google Maps
        </a>
      </Ungkap>

      {/* Dress Code */}
      {(data.dressCode || data.dressCodeWarna.length > 0) && (
        <Ungkap id="dress-code">
          <JudulSeksi>Dress Code</JudulSeksi>
          {data.dressCodeWarna.length > 0 && (
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {data.dressCodeWarna.map((warna, i) => (
                <span
                  key={i}
                  title={warna}
                  className="inline-block h-9 w-9 rounded-full"
                  style={{ backgroundColor: warna, border: `2px solid ${EMAS}` }}
                />
              ))}
            </div>
          )}
          {data.dressCode && <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed">{data.dressCode}</p>}
        </Ungkap>
      )}

      {/* Pra-Acara */}
      {data.praAcara.length > 0 && (
        <Ungkap id="pra-acara">
          <JudulSeksi>Pra-Acara</JudulSeksi>
          <ol className="mx-auto mt-5 max-w-sm space-y-4">
            {data.praAcara.map((item, i) => (
              <li key={i} className="rounded-[1.25rem] px-5 py-4" style={{ border: `1px solid ${EMAS}88` }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: OLIVE }}>
                  {item.tanggal}
                  {item.waktu ? ` · ${item.waktu}` : ""}
                </p>
                <p className="mt-1 font-serif text-lg font-bold">{item.judul}</p>
                {item.lokasi && <p className="mt-1 text-sm opacity-90">{item.lokasi}</p>}
              </li>
            ))}
          </ol>
        </Ungkap>
      )}

      {/* Transportasi */}
      {data.transportasi && (
        <Ungkap id="transportasi">
          <JudulSeksi>Transportasi</JudulSeksi>
          <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed">{data.transportasi}</p>
        </Ungkap>
      )}

      {/* Akomodasi */}
      {data.akomodasi && (
        <Ungkap id="akomodasi">
          <JudulSeksi>Akomodasi</JudulSeksi>
          <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed">{data.akomodasi}</p>
        </Ungkap>
      )}

      {/* Hadiah */}
      <Ungkap id="hadiah">
        <JudulSeksi>Hadiah</JudulSeksi>
        <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed">
          Kehadiran, cinta, dan doa restu Anda adalah hadiah terbesar bagi kami.
        </p>
        {(data.rekeningBank || data.rekeningNomor || data.alamatKirim) && (
          <div className="mx-auto mt-5 max-w-sm rounded-[1.25rem] px-5 py-4 text-sm" style={{ border: `1px solid ${EMAS}88` }}>
            {data.rekeningBank && (
              <p>
                <span className="font-bold" style={{ color: OLIVE }}>
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
      </Ungkap>

      {/* RSVP */}
      <Ungkap id="rsvp">
        <JudulSeksi>RSVP</JudulSeksi>
        <p className="mt-4 text-[15px]">Kami tidak sabar merayakannya bersama Anda!</p>
        {data.pesanGalat && (
          <p role="alert" className="mx-auto mt-4 max-w-sm rounded-2xl bg-red-100 px-4 py-3 text-sm font-bold text-red-800">
            {data.pesanGalat}
          </p>
        )}
        {data.pratinjau ? (
          <p className="mx-auto mt-5 max-w-sm rounded-2xl px-4 py-3 text-sm" style={{ border: `1px solid ${EMAS}88` }}>
            Ini pratinjau tema — formulir RSVP aktif di undangan sungguhan, bukan di sini.
          </p>
        ) : data.rsvpTerkirim ? (
          <p role="status" className="mx-auto mt-5 max-w-sm rounded-2xl px-4 py-3 text-sm font-bold" style={{ backgroundColor: `${SAGE}33` }}>
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
              <label htmlFor="rsvp-nama-royal" className="text-sm font-bold" style={{ color: OLIVE }}>
                Nama Anda
              </label>
              <input
                id="rsvp-nama-royal"
                name="nama"
                required
                minLength={2}
                placeholder="Nama lengkap"
                className="mt-1 min-h-[48px] w-full rounded-2xl border bg-white px-4 text-[15px] placeholder:text-stone-400"
                style={{ borderColor: `${EMAS}88` }}
              />
            </div>
            <div>
              <label htmlFor="rsvp-hadir-royal" className="text-sm font-bold" style={{ color: OLIVE }}>
                Apakah Anda akan hadir?
              </label>
              <select
                id="rsvp-hadir-royal"
                name="kehadiran"
                className="mt-1 min-h-[48px] w-full rounded-2xl border bg-white px-4 text-[15px]"
                style={{ borderColor: `${EMAS}88` }}
              >
                <option value="Hadir">Hadir</option>
                <option value="Ragu">Masih ragu</option>
                <option value="Tidak">Tidak bisa hadir</option>
              </select>
            </div>
            <div>
              <label htmlFor="rsvp-pesan-royal" className="text-sm font-bold" style={{ color: OLIVE }}>
                Pesan Anda
              </label>
              <textarea
                id="rsvp-pesan-royal"
                name="pesan"
                rows={3}
                placeholder="Tulis doa atau pesan untuk kedua mempelai"
                className="mt-1 w-full rounded-2xl border bg-white px-4 py-3 text-[15px] placeholder:text-stone-400"
                style={{ borderColor: `${EMAS}88` }}
              />
            </div>
            <div className="text-center">
              <button
                type="submit"
                className="min-h-[48px] rounded-full px-8 text-sm font-bold"
                style={{ backgroundColor: EMAS, color: TINTA }}
              >
                Send Message
              </button>
            </div>
          </form>
        ) : (
          <p className="mx-auto mt-5 max-w-sm rounded-2xl px-4 py-3 text-sm font-bold" style={{ border: `1px solid ${EMAS}88` }}>
            Konfirmasi kehadiran untuk undangan ini sudah ditutup. Terima kasih atas doa dan perhatiannya.
          </p>
        )}
        {data.ringkasan.totalBalasan > 0 && (
          <p className="mt-4 text-sm opacity-90">
            {data.ringkasan.hadir} balasan hadir, {data.ringkasan.ragu} masih ragu, {data.ringkasan.tidak} tidak bisa
            hadir.
          </p>
        )}
      </Ungkap>

      {/* Ucapan */}
      {data.ucapan.length > 0 && (
        <Ungkap id="ucapan">
          <JudulSeksi>Ucapan &amp; Doa</JudulSeksi>
          <ul className="mx-auto mt-5 max-w-sm space-y-3 text-left">
            {data.ucapan.map((rsvp) => (
              <li key={rsvp.id} className="rounded-[1.25rem] bg-white/70 p-4" style={{ border: `1px solid ${EMAS}55` }}>
                <p className="flex flex-wrap items-center justify-between gap-2 font-bold">
                  {rsvp.nama}
                  <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: OLIVE }}>
                    {rsvp.kehadiran === "Hadir" ? "Hadir" : rsvp.kehadiran === "Ragu" ? "Masih ragu" : "Tidak bisa hadir"}
                  </span>
                </p>
                {rsvp.pesan && <p className="mt-2 text-[15px] leading-relaxed">{rsvp.pesan}</p>}
              </li>
            ))}
          </ul>
        </Ungkap>
      )}

      {/* Penutup */}
      <Ungkap id="penutup">
        <OrnamenDaun className="mx-auto h-6 w-24 opacity-80" />
        <p className="mt-4 text-[15px] leading-relaxed">Kami tidak sabar merayakannya bersama Anda!</p>
        <p className="mt-4 font-script text-4xl" style={{ color: EMAS }}>
          {nama}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href={buatTautanWhatsApp(pesanBagikan)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[48px] items-center rounded-full px-6 text-sm font-bold text-white"
            style={{ backgroundColor: OLIVE }}
          >
            Bagikan via WhatsApp
          </a>
          <Link href="/" className="inline-flex min-h-[48px] items-center text-sm font-bold underline underline-offset-4" style={{ color: OLIVE }}>
            Dibuat dengan BETA Storia
          </Link>
        </div>
        <p className="mt-8 pb-4 text-xs opacity-70">Royal Grace · BETA Storia</p>
      </Ungkap>
    </div>
  );
}
