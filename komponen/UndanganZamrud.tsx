"use client";

// Perender halaman penuh untuk templat Zamrud (undangan pernikahan
// bernuansa islami, setara pengalaman referensi wedding.benifin.my.id
// tapi dibangun ulang dengan kode dan aset sendiri).
//
// Struktur (mengikuti referensi, tanpa menyalin foto, musik, teks kisah,
// maupun data pribadi referensi):
// sampul pembuka + musik -> hero (panel kiri tetap di desktop, memuat
// nama, tanggal, LOKASI, dan tombol konfirmasi) -> mempelai -> ayat &
// doa -> kisah perjalanan (v2) -> acara (+ Maps & Google Calendar,
// bisa dua kartu) -> hitung mundur live -> busana -> galeri
// (+ lightbox) -> RSVP -> ucapan & doa -> tanda kasih (v2) ->
// penutup + bagikan. Di atas itu, tiga jalan menuju tindakan utama yang
// sama: bar konfirmasi persisten di bawah layar, tombol emas di hero,
// dan entri emas di drawer menu — semuanya hanya saat RSVP dibuka.
// Kontrol sekunder (musik, menu) ada di kanan atas, bukan bawah, supaya
// tidak menutupi bar konfirmasi.
// Seksi v2 (kisah, tanda kasih, acara kedua, galeri tambahan) hanya
// tampil kalau datanya diisi lewat editor; undangan lama tanpa data itu
// tetap tampil seperti v1. Yang masih belum ada: ganti tema dan like
// pada ucapan (bukan kolom form, dicatat sebagai lanjutan).
// Musik hanya tampil kalau berkasnya ada (halaman tamu memeriksa
// public/musik/zamrud.mp3); tanpa berkas, tombol musik tidak dirender.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Great_Vibes } from "next/font/google";
import { kirimRsvp } from "@/lib/aksiRsvp";
import BarKonfirmasi from "@/komponen/BarKonfirmasi";
import {
  buatPesanBagikanUndangan,
  buatTautanWhatsApp,
  formatTanggalIndonesia,
} from "@/lib/format";
import type { RingkasanRsvp, Rsvp } from "@/lib/tokoData";

const hurufScript = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--huruf-script",
});

const ASET_GALERI = [
  "/templat/zamrud/masjid.jpg",
  "/templat/zamrud/galeri-bunga.jpg",
  "/templat/zamrud/galeri-lentera.jpg",
  "/templat/zamrud/galeri-arsitektur.jpg",
];

const MENU = [
  { href: "#beranda", label: "Beranda" },
  { href: "#mempelai", label: "Mempelai" },
  { href: "#ayat", label: "Ayat & Doa" },
  { href: "#kisah", label: "Kisah Kami" },
  { href: "#acara", label: "Acara" },
  { href: "#hitung-mundur", label: "Hitung Mundur" },
  { href: "#busana", label: "Busana" },
  { href: "#galeri", label: "Galeri" },
  { href: "#rsvp", label: "Konfirmasi Kehadiran" },
  { href: "#ucapan", label: "Ucapan & Doa" },
  { href: "#tanda-kasih", label: "Tanda Kasih" },
  { href: "#penutup", label: "Penutup" },
];

const SWATCH_BUSANA = [
  { nama: "Zamrud", warna: "#065f46" },
  { nama: "Sage", warna: "#8fa98f" },
  { nama: "Champagne", warna: "#e7dcc3" },
  { nama: "Ivory", warna: "#fffff0" },
];

export interface DataZamrud {
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
  // Zamrud v2 — kolom form lengkap (kosong = seksi tersembunyi).
  kisah: { judul: string; cerita: string }[];
  videoKisah: string;
  rekeningBank: string;
  rekeningNomor: string;
  rekeningNama: string;
  alamatKirim: string;
  acaraWaktu: string;
  acaraKeduaJudul: string;
  acaraKeduaWaktu: string;
  acaraKeduaLokasi: string;
  galeriTambahan: string[];
}

function inisial(nama: string): string {
  const kata = nama.trim().split(/\s+/)[0] ?? "";
  return kata.charAt(0).toUpperCase() || "U";
}

function namaTampil(data: DataZamrud): string {
  return data.namaKedua ? `${data.namaPertama} & ${data.namaKedua}` : data.namaPertama;
}

function monogram(data: DataZamrud): string {
  return data.namaKedua
    ? `${inisial(data.namaPertama)} & ${inisial(data.namaKedua)}`
    : inisial(data.namaPertama);
}

// Hitung mundur ke tengah malam tanggal acara (waktu setempat tamu).
// Tanggal tidak valid -> null, ditampilkan sebagai "Tanggal menyusul".
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

// Mengubah tautan YouTube (watch, youtu.be, shorts) menjadi URL embed.
// Tautan lain -> null, jadi tidak ada iframe dari sumber sembarangan.
function embedYoutube(tautan: string): string | null {
  try {
    const url = new URL(tautan.trim());
    let id = "";
    if (url.hostname === "youtu.be") {
      id = url.pathname.replace("/", "");
    } else if (url.hostname.endsWith("youtube.com")) {
      if (url.pathname === "/watch") id = url.searchParams.get("v") ?? "";
      else if (url.pathname.startsWith("/shorts/")) id = url.pathname.replace("/shorts/", "");
      else if (url.pathname.startsWith("/embed/")) id = url.pathname.replace("/embed/", "");
    }
    if (!/^[A-Za-z0-9_-]{6,}$/.test(id)) return null;
    return `https://www.youtube-nocookie.com/embed/${id}`;
  } catch {
    return null;
  }
}

function tautanKalender(data: DataZamrud): string {
  const [tahun, bulan, hari] = data.tanggal.split("-");
  if (!tahun || !bulan || !hari) return "https://calendar.google.com/calendar";
  const mulai = `${tahun}${bulan}${hari}`;
  const selesai = new Date(`${data.tanggal}T00:00:00`);
  selesai.setDate(selesai.getDate() + 1);
  const akhir = selesai.toISOString().slice(0, 10).replace(/-/g, "");
  const parameter = new URLSearchParams({
    action: "TEMPLATE",
    text: `${data.jenisAcara} ${namaTampil(data)}`,
    dates: `${mulai}/${akhir}`,
    details: `Undangan ${data.jenisAcara} ${namaTampil(data)}`,
    location: data.lokasi,
  });
  return `https://calendar.google.com/calendar/render?${parameter.toString()}`;
}

export default function UndanganZamrud({ data }: { data: DataZamrud }) {
  // Urutan pembuka meniru referensi (verifikasi ulang 31 Okt 2026):
  // intro (splash monogram, ~2 detik, hilang sendiri) -> sampul ->
  // membuka (fade+zoom) -> terbuka. Selama intro, sampul sudah dirender
  // di bawahnya dalam keadaan redup, lalu mencerah — efek cross-dissolve.
  const [tahap, setTahap] = useState<"intro" | "sampul" | "membuka" | "terbuka">("intro");
  const [introTampil, setIntroTampil] = useState(false);
  const [musikMain, setMusikMain] = useState(false);
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const [fotoAktif, setFotoAktif] = useState<number | null>(null);
  const [tersalin, setTersalin] = useState(false);
  const [tersalinRekening, setTersalinRekening] = useState(false);
  const [tersalinAlamat, setTersalinAlamat] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const tutupSampulRef = useRef<number | null>(null);

  const hitungMundur = useHitungMundur(data.tanggal);

  const galeri = useMemo(() => {
    const daftar = [
      ...(data.fotoUndangan ? [data.fotoUndangan] : []),
      ...data.galeriTambahan,
      ...ASET_GALERI,
    ];
    return daftar.filter((item, indeks) => daftar.indexOf(item) === indeks);
  }, [data.fotoUndangan, data.galeriTambahan]);

  // Daftar acara: selalu satu kartu utama; kartu kedua hanya kalau
  // judul atau waktunya diisi (lokasi kedua kosong = lokasi utama).
  const daftarAcara = useMemo(() => {
    const utama = { judul: data.jenisAcara, waktu: data.acaraWaktu, lokasi: data.lokasi };
    if (data.acaraKeduaJudul.trim() === "" && data.acaraKeduaWaktu.trim() === "") return [utama];
    return [
      utama,
      {
        judul: data.acaraKeduaJudul.trim() || "Acara Kedua",
        waktu: data.acaraKeduaWaktu,
        lokasi: data.acaraKeduaLokasi.trim() || data.lokasi,
      },
    ];
  }, [data]);

  const videoEmbed = useMemo(() => embedYoutube(data.videoKisah), [data.videoKisah]);
  const adaKisah = data.kisah.length > 0 || videoEmbed !== null;
  const adaTandaKasih = data.rekeningNomor.trim() !== "" || data.alamatKirim.trim() !== "";
  // Menu drawer hanya menautkan seksi yang benar-benar dirender — kalau
  // tidak, tamu mengetuk tautan ke jangkar yang tidak ada (terutama
  // undangan lama tanpa data v2).
  const menuTampil = useMemo(
    () =>
      MENU.filter((item) => {
        if (item.href === "#kisah") return adaKisah;
        if (item.href === "#tanda-kasih") return adaTandaKasih;
        return true;
      }),
    [adaKisah, adaTandaKasih],
  );

  const fotoHero = data.fotoUndangan ?? data.fotoSampul ?? ASET_GALERI[0];

  // Bar konfirmasi tampil selama RSVP dibuka. Bar tidak perlu menunggu
  // tahap "terbuka": selama intro/sampul, sampul (z-70) sudah menutupi
  // bar (z-40) secara visual, jadi bar baru terlihat setelah undangan
  // terbuka — tanpa logika tahap yang membuat bar hilang dari HTML server.
  const barTampil = data.statusAktif;

  // Reveal: elemen [data-tampil] mendapat kelas tampil-aktif saat masuk layar.
  useEffect(() => {
    const elemen = Array.from(document.querySelectorAll("[data-tampil]"));
    const pengamat = new IntersectionObserver(
      (entri) => {
        for (const item of entri) {
          if (item.isIntersecting) {
            item.target.classList.add("tampil-aktif");
            pengamat.unobserve(item.target);
          }
        }
      },
      { threshold: 0.15 },
    );
    elemen.forEach((el) => pengamat.observe(el));
    return () => pengamat.disconnect();
  }, []);

  // Linimasa intro: muncul (fade-in blok utuh, bukan huruf per huruf),
  // ditahan sebentar, lalu memudar dan sampul mengambil alih. Total
  // sekitar 2 detik, meniru referensi; tanpa tombol lewati.
  useEffect(() => {
    const tampil = window.setTimeout(() => setIntroTampil(true), 50);
    const memudar = window.setTimeout(() => setIntroTampil(false), 1400);
    const selesai = window.setTimeout(() => setTahap("sampul"), 2100);
    return () => {
      window.clearTimeout(tampil);
      window.clearTimeout(memudar);
      window.clearTimeout(selesai);
    };
  }, []);

  // Kunci gulir selama intro/sampul tampil.
  useEffect(() => {
    document.body.style.overflow = tahap === "terbuka" ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [tahap]);

  // Bersihkan timer buka sampul HANYA saat komponen dilepas. Jangan
  // membersihkannya di efek tahap: timer itu dipasang bersamaan dengan
  // perubahan tahap ke "membuka", jadi cleanup efek tahap justru
  // membatalkan timer tersebut — tahap mentok di "membuka", sampul
  // transparan tetap menutupi layar, dan semua tombol di bawahnya
  // tidak bisa diklik (bug 31 Okt 2026).
  useEffect(() => {
    return () => {
      if (tutupSampulRef.current !== null) window.clearTimeout(tutupSampulRef.current);
    };
  }, []);

  // Escape menutup lightbox dan menu.
  useEffect(() => {
    if (fotoAktif === null && !menuTerbuka) return;
    const tutup = (acara: KeyboardEvent) => {
      if (acara.key === "Escape") {
        setFotoAktif(null);
        setMenuTerbuka(false);
      }
    };
    document.addEventListener("keydown", tutup);
    return () => document.removeEventListener("keydown", tutup);
  }, [fotoAktif, menuTerbuka]);

  function bukaUndangan() {
    if (tahap !== "sampul") return;
    setTahap("membuka");
    if (audioRef.current) {
      audioRef.current.play().then(
        () => setMusikMain(true),
        () => setMusikMain(false),
      );
    }
    tutupSampulRef.current = window.setTimeout(() => setTahap("terbuka"), 750);
  }

  function alihMusik() {
    const audio = audioRef.current;
    if (!audio) return;
    if (musikMain) {
      audio.pause();
      setMusikMain(false);
    } else {
      audio.play().then(
        () => setMusikMain(true),
        () => setMusikMain(false),
      );
    }
  }

  async function salinTautan() {
    try {
      await navigator.clipboard.writeText(data.tautan);
      setTersalin(true);
      window.setTimeout(() => setTersalin(false), 2000);
    } catch {
      setTersalin(false);
    }
  }

  async function salinTeks(teks: string, tandai: (nilai: boolean) => void) {
    try {
      await navigator.clipboard.writeText(teks);
      tandai(true);
      window.setTimeout(() => tandai(false), 2000);
    } catch {
      tandai(false);
    }
  }

  const pesanBagikan = buatPesanBagikanUndangan(
    data.jenisAcara,
    data.namaPertama,
    data.namaKedua,
    data.tanggal,
    data.lokasi,
    data.tautan,
  );

  const labelKehadiran = (kehadiran: Rsvp["kehadiran"]) =>
    kehadiran === "Hadir" ? "Hadir" : kehadiran === "Ragu" ? "Masih ragu" : "Tidak bisa hadir";

  return (
    <div className={`${hurufScript.variable} bg-krem-50 font-sans text-tinta`}>
      {data.musikSrc && (
        <audio ref={audioRef} src={data.musikSrc} loop preload="auto" />
      )}

      {/* Splash intro: layar hijau zamrud gelap, monogram serif besar +
          nama script di tengah, fade-in sebagai satu blok lalu memudar
          sendiri. Tanpa foto, ornamen, maupun tombol. */}
      {tahap === "intro" && (
        <div
          aria-label="Pembuka"
          className={`fixed inset-0 z-[80] flex flex-col items-center justify-center bg-emerald-950 px-6 text-center transition-opacity duration-700 ${
            introTampil ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="font-serif text-8xl italic leading-none text-emas-300 sm:text-9xl">
            {monogram(data)}
          </p>
          <p className="mt-6 font-script text-4xl leading-tight text-krem-50 sm:text-5xl">
            {namaTampil(data)}
          </p>
        </div>
      )}

      {/* Sampul: panel hijau zamrud di atas foto masjid yang redup, nama
          serif bertumpuk, kartu tamu gelap, tombol pil gelap berikon
          amplop. Selama intro, sampul ini sudah ada di bawah splash
          dalam keadaan redup lalu mencerah (cross-dissolve). Ditekan,
          sampul hilang dengan fade+zoom dan musik mulai. */}
      {tahap !== "terbuka" && (
        <div
          className={`fixed inset-0 z-[70] flex flex-col items-center justify-center bg-emerald-950 px-6 text-center text-krem-50 transition-all duration-700 ${
            tahap === "membuka" ? "scale-105 opacity-0" : "opacity-100"
          } ${tahap === "intro" ? "brightness-50" : "brightness-100"}`}
        >
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-emas-300">
            The Wedding Of
          </p>
          <p className="mt-6 font-serif text-5xl font-bold leading-tight sm:text-6xl">
            {data.namaPertama}
          </p>
          {data.namaKedua && (
            <>
              <p className="my-1 font-serif text-3xl text-emas-300">&</p>
              <p className="font-serif text-5xl font-bold leading-tight sm:text-6xl">
                {data.namaKedua}
              </p>
            </>
          )}
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.25em] text-krem-100">
            {formatTanggalIndonesia(data.tanggal)}
          </p>
          <div className="mt-10 rounded-[1.75rem] border border-emas-300/25 bg-black/30 px-6 py-5">
            <p className="text-sm text-krem-100">Kepada Yth.</p>
            <p className="mt-1 font-script text-2xl text-krem-50">Tamu Undangan</p>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-krem-100/80">
              Mohon maaf jika ada kekeliruan penulisan nama atau gelar.
            </p>
          </div>
          <button
            type="button"
            onClick={bukaUndangan}
            className="mt-10 min-h-[52px] rounded-full border border-emas-300/40 bg-emerald-900 px-8 text-sm font-bold text-krem-50 hover:bg-emerald-800"
          >
            ✉ Buka Undangan
          </button>
        </div>
      )}

      {/* Panel hero tetap (desktop): latar masjid + kartu nama, tidak ikut
          menggulir — efek khas referensi. Di ponsel, hero tampil di atas. */}
      <aside className="fixed inset-y-0 left-0 z-0 hidden w-[42%] lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${fotoHero})` }}
        />
        <div className="absolute inset-0 bg-emerald-950/60" />
        <div className="relative flex h-full flex-col items-center justify-center px-8 text-center text-krem-50">
          <p className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-emas-300/70 font-script text-4xl">
            {monogram(data)}
          </p>
          <p className="mt-6 font-script text-5xl leading-tight">{namaTampil(data)}</p>
          <p className="mt-6 rounded-full bg-krem-50/15 px-5 py-2 text-xs font-bold uppercase tracking-[0.25em]">
            {formatTanggalIndonesia(data.tanggal)}
          </p>
          <p className="mt-4 max-w-xs text-sm font-semibold text-krem-100/85">
            {data.lokasi}
          </p>
        </div>
      </aside>

      <div className={`relative lg:ml-[42%] ${barTampil ? "pb-28" : ""}`}>
        {/* Hero ponsel + pembuka kolom kanan */}
        <section id="beranda" data-tampil className="tampil relative flex min-h-[85vh] scroll-mt-6 flex-col items-center justify-center overflow-hidden px-6 py-16 text-center text-krem-50 lg:min-h-0 lg:py-20">
          <div
            className="absolute inset-0 bg-cover bg-center lg:hidden"
            style={{ backgroundImage: `url(${fotoHero})` }}
          />
          <div className="absolute inset-0 bg-emerald-950/70 lg:hidden" />
          <div className="absolute inset-0 hidden bg-krem-50 lg:block" />
          <div className="relative lg:text-tinta">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-emas-500 lg:text-emerald-800">
              Undangan {data.jenisAcara}
            </p>
            <p className="mx-auto mt-6 flex h-28 w-28 items-center justify-center rounded-full border-2 border-emas-300 font-script text-4xl text-krem-50 lg:text-emerald-900">
              {monogram(data)}
            </p>
            <h1 className="mt-6 font-script text-6xl leading-tight sm:text-7xl">
              {namaTampil(data)}
            </h1>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.25em]">
              {formatTanggalIndonesia(data.tanggal)}
            </p>
            {/* Lokasi masuk hero: sebelumnya tamu baru tahu tempat acara
                setelah menggulir ke seksi Acara, padahal nama, tanggal,
                dan lokasi adalah informasi terpenting undangan. */}
            <p className="mt-3 text-[15px] font-semibold">{data.lokasi}</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {data.statusAktif && (
                <a
                  href="#rsvp"
                  className="inline-flex min-h-[48px] items-center rounded-full bg-emas-500 px-7 text-sm font-bold text-emerald-950 hover:bg-emas-300"
                >
                  Konfirmasi Kehadiran
                </a>
              )}
              <a
                href="#mempelai"
                className="inline-flex min-h-[48px] items-center rounded-full border-2 border-krem-50/50 px-7 text-sm font-bold text-krem-50 hover:bg-white/10 lg:border-emerald-800/40 lg:text-emerald-900 lg:hover:bg-emerald-800/5"
              >
                Lihat Undangan
              </a>
            </div>
          </div>
        </section>

        {/* Mempelai */}
        <section id="mempelai" data-tampil className="tampil scroll-mt-6 bg-emerald-950 px-6 py-16 text-krem-50">
          <p className="text-center text-xs font-bold uppercase tracking-[0.35em] text-emas-300">
            Mempelai
          </p>
          <div className="mx-auto mt-10 grid max-w-2xl gap-6 sm:grid-cols-2">
            {[
              { nama: data.namaPertama, orangTua: data.orangTuaPertama },
              { nama: data.namaKedua, orangTua: data.orangTuaKedua },
            ]
              .filter((item) => item.nama.trim() !== "")
              .map((item, indeks) => (
                <article key={item.nama} className="rounded-t-full rounded-b-[2rem] border border-emas-300/30 bg-emerald-900/60 px-6 pb-8 pt-10 text-center">
                  <p className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emas-300/20 font-script text-4xl text-emas-300">
                    {inisial(item.nama)}
                  </p>
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-emas-300">
                    {data.namaKedua ? (indeks === 0 ? "Mempelai Pertama" : "Mempelai Kedua") : "Mempelai"}
                  </p>
                  <h2 className="mt-2 font-script text-4xl leading-snug">{item.nama}</h2>
                  {item.orangTua.trim() !== "" && (
                    <p className="mt-4 text-sm leading-relaxed text-krem-100/85">
                      <span className="block text-xs font-bold uppercase tracking-widest text-emas-300">Orang tua</span>
                      <span className="mt-1 block">{item.orangTua}</span>
                    </p>
                  )}
                </article>
              ))}
          </div>
        </section>

        {/* Ayat & doa */}
        <section id="ayat" data-tampil className="tampil scroll-mt-6 bg-krem-50 px-6 py-16 text-center">
          <p lang="ar" dir="rtl" className="font-serif text-3xl leading-relaxed text-emerald-900">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <h2 className="mt-8 font-serif text-3xl font-bold text-emerald-950 sm:text-4xl">
            Dengan Penuh Syukur
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-tintaLembut">
            Dengan memohon rahmat dan ridha Allah, kami mengundang Bapak, Ibu,
            dan Saudara/i untuk hadir dan mendoakan kami di hari bahagia ini.
          </p>
          <blockquote className="mx-auto mt-8 max-w-xl rounded-[2rem] border border-emas-300/50 bg-white/70 p-6">
            <p className="font-serif text-xl italic leading-relaxed text-emerald-950">
              “Semoga Allah memberkahi langkah ini dan menjadikannya awal
              keluarga yang sakinah, mawaddah, dan rahmah.”
            </p>
            <cite className="mt-3 block text-xs font-bold uppercase tracking-widest text-emas-600 not-italic">
              Doa kami
            </cite>
          </blockquote>
        </section>

        {/* Kisah perjalanan (v2): hanya tampil kalau ada babak atau video. */}
        {adaKisah && (
          <section id="kisah" data-tampil className="tampil scroll-mt-6 bg-emerald-950 px-6 py-16 text-krem-50">
            <p className="text-center text-xs font-bold uppercase tracking-[0.35em] text-emas-300">
              Kisah Kami
            </p>
            <h2 className="mt-3 text-center font-serif text-3xl font-bold">
              Perjalanan Kami Sampai Hari Ini
            </h2>
            {videoEmbed && (
              <div className="mx-auto mt-10 aspect-video max-w-2xl overflow-hidden rounded-[1.75rem] shadow-kacaLembut">
                <iframe
                  src={videoEmbed}
                  title="Video kisah kami"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            )}
            <ol className="mx-auto mt-10 max-w-xl space-y-8">
              {data.kisah.map((babak, indeks) => (
                <li key={`${babak.judul}-${indeks}`} className="relative border-l-2 border-emas-300/40 pl-6">
                  <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-emas-300" />
                  {babak.judul && (
                    <h3 className="font-serif text-2xl font-bold">{babak.judul}</h3>
                  )}
                  {babak.cerita && (
                    <p className="mt-2 text-[15px] leading-relaxed text-krem-100/85">{babak.cerita}</p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Acara: satu kartu utama, ditambah kartu kedua kalau diisi. */}
        <section id="acara" data-tampil className="tampil scroll-mt-6 bg-emerald-950 px-6 py-16 text-krem-50">
          <p className="text-center text-xs font-bold uppercase tracking-[0.35em] text-emas-300">
            Acara {data.jenisAcara}
          </p>
          <div className={`mx-auto mt-10 grid max-w-3xl gap-6 ${daftarAcara.length > 1 ? "sm:grid-cols-2" : "max-w-xl"}`}>
            {daftarAcara.map((acaraItem, indeks) => (
              <div key={`${acaraItem.judul}-${indeks}`} className="rounded-[2rem] border border-emas-300/30 bg-emerald-900/60 p-6 text-center sm:p-8">
                <h2 className="font-serif text-3xl font-bold">{acaraItem.judul}</h2>
                <p className="mt-4 font-bold">{formatTanggalIndonesia(data.tanggal)}</p>
                {acaraItem.waktu.trim() !== "" && (
                  <p className="mt-1 font-bold text-emas-300">{acaraItem.waktu}</p>
                )}
                <p className="mt-2 text-[15px] leading-relaxed text-krem-100/85">{acaraItem.lokasi}</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(acaraItem.lokasi)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-[48px] items-center rounded-full bg-krem-50 px-6 text-sm font-bold text-emerald-950 hover:bg-krem-100"
                  >
                    Google Maps
                  </a>
                  {indeks === 0 && (
                    <a
                      href={tautanKalender(data)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[48px] items-center rounded-full border-2 border-emas-300 px-6 text-sm font-bold text-emas-300 hover:bg-emas-300/10"
                    >
                      Simpan ke Google Calendar
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Hitung mundur */}
        <section id="hitung-mundur" data-tampil className="tampil scroll-mt-6 bg-krem-50 px-6 py-16 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-800">
            Menuju Hari Bahagia
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-emerald-950">
            Kami menghitung hari, menanti doa dan kehadiran Anda.
          </h2>
          {hitungMundur === null ? (
            <p className="mt-8 font-bold text-tintaLembut">Tanggal menyusul.</p>
          ) : hitungMundur.tiba ? (
            <p className="mt-8 font-serif text-2xl font-bold text-emerald-900">
              Hari ini adalah hari bahagianya!
            </p>
          ) : (
            <>
              {/* Angka berdetak tiap detik disembunyikan dari pembaca
                  layar (aria-hidden) supaya tidak dibacakan berulang;
                  sebagai gantinya ada ringkasan statis untuk pembaca
                  layar. Tanggal lengkap sudah ada di seksi Acara. */}
              <p className="sr-only">
                Hitung mundur menuju {formatTanggalIndonesia(data.tanggal)}.
              </p>
              <div aria-hidden="true" className="mx-auto mt-8 grid max-w-xl grid-cols-4 gap-3">
                {[
                  { nilai: hitungMundur.hari, label: "Hari" },
                  { nilai: hitungMundur.jam, label: "Jam" },
                  { nilai: hitungMundur.menit, label: "Menit" },
                  { nilai: hitungMundur.detik, label: "Detik" },
                ].map((kotak) => (
                  <div key={kotak.label} className="rounded-[1.5rem] bg-emerald-950 px-2 py-5 text-krem-50">
                    <p className="font-serif text-3xl font-bold tabular-nums sm:text-4xl">{kotak.nilai}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-widest text-emas-300">{kotak.label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Busana */}
        <section id="busana" data-tampil className="tampil scroll-mt-6 bg-emerald-950 px-6 py-16 text-center text-krem-50">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-emas-300">Busana</p>
          <h2 className="mt-3 font-serif text-3xl font-bold">Berpakaian Sopan & Nyaman</h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-krem-100/85">
            Dress code kami santai dan sopan: batik jadi pilihan utama, dan
            alas kaki yang nyaman sangat disarankan.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-5">
            {SWATCH_BUSANA.map((swatch) => (
              <div key={swatch.nama} className="flex flex-col items-center gap-2">
                <span
                  className="h-14 w-14 rounded-full border-2 border-krem-50/40"
                  style={{ backgroundColor: swatch.warna }}
                />
                <span className="text-xs font-bold">{swatch.nama}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-krem-100/75">
            Warna di atas hanya inspirasi, bukan ketentuan.
          </p>
        </section>

        {/* Galeri */}
        <section id="galeri" data-tampil className="tampil scroll-mt-6 bg-krem-50 px-6 py-16">
          <p className="text-center text-xs font-bold uppercase tracking-[0.35em] text-emerald-800">
            Galeri
          </p>
          <h2 className="mt-3 text-center font-serif text-3xl font-bold text-emerald-950">
            Momen Kami
          </h2>
          <p className="mt-3 text-center text-sm text-tintaLembut">
            Geser foto untuk melihat momen lainnya. Ketuk foto untuk memperbesar.
          </p>
          <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
            {galeri.map((src, indeks) => (
              <button
                key={`${src}-${indeks}`}
                type="button"
                onClick={() => setFotoAktif(indeks)}
                className="w-64 shrink-0 snap-center overflow-hidden rounded-[1.75rem] shadow-kacaLembut"
                aria-label={`Perbesar foto ${indeks + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Galeri ${indeks + 1}`} className="h-80 w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </section>

        {/* RSVP */}
        <section id="rsvp" data-tampil className="tampil scroll-mt-6 bg-emerald-950 px-6 py-16 text-krem-50">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-emas-300">
            RSVP
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold">Konfirmasi Kehadiran</h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-krem-100/85">
            {data.ringkasan.totalBalasan === 0
              ? "Belum ada yang mengonfirmasi. Jadilah yang pertama."
              : `${data.ringkasan.hadir} balasan hadir (${data.ringkasan.totalTamuHadir} tamu), ${data.ringkasan.ragu} masih ragu, ${data.ringkasan.tidak} tidak bisa hadir.`}
          </p>
          {data.rsvpTerkirim && (
            <p role="status" className="mt-5 max-w-xl rounded-2xl bg-daun-100 px-4 py-3 text-sm font-bold text-daun-700">
              Terima kasih! Konfirmasimu sudah tersimpan.
            </p>
          )}
          {data.pesanGalat && (
            <p role="alert" className="mt-5 max-w-xl rounded-2xl bg-terakota-100 px-4 py-3 text-sm font-bold text-tanah-700">
              {data.pesanGalat}
            </p>
          )}
          {data.statusAktif ? (
            <form action={kirimRsvp} className="mt-6 max-w-xl space-y-4">
              <input type="hidden" name="kode" value={data.kodeTamu} />
              <input type="hidden" name="waktu_muat" value={String(data.waktuMuat)} />
              <div aria-hidden="true" style={{ display: "none" }}>
                <label htmlFor="situs-web-zamrud">Situs web</label>
                <input id="situs-web-zamrud" name="situs_web" tabIndex={-1} autoComplete="off" />
              </div>
              <div>
                <label htmlFor="nama-zamrud" className="text-sm font-bold">Nama kamu</label>
                <input
                  id="nama-zamrud"
                  name="nama"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  placeholder="Tulis nama lengkapmu"
                  className="mt-2 min-h-[48px] w-full rounded-2xl border border-emerald-900/20 bg-white px-4 py-3 text-[15px] text-tinta"
                />
              </div>
              <fieldset>
                <legend className="text-sm font-bold">Kehadiran</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    { nilai: "Hadir", label: "Hadir" },
                    { nilai: "Ragu", label: "Masih ragu" },
                    { nilai: "Tidak", label: "Tidak bisa hadir" },
                  ].map((pilihan) => (
                    <label
                      key={pilihan.nilai}
                      className="flex min-h-[48px] cursor-pointer items-center gap-2 rounded-full border border-krem-50/30 bg-white/10 px-4 text-sm font-bold"
                    >
                      <input type="radio" name="kehadiran" value={pilihan.nilai} defaultChecked={pilihan.nilai === "Hadir"} />
                      {pilihan.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div>
                <label htmlFor="jumlah-zamrud" className="text-sm font-bold">Jumlah tamu (termasuk kamu)</label>
                <select
                  id="jumlah-zamrud"
                  name="jumlahTamu"
                  defaultValue="1"
                  aria-describedby="jumlah-keterangan-zamrud"
                  className="mt-2 min-h-[48px] w-full rounded-2xl border border-emerald-900/20 bg-white px-4 py-3 text-[15px] text-tinta"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((jumlah) => (
                    <option key={jumlah} value={jumlah}>{jumlah} orang</option>
                  ))}
                </select>
                <p id="jumlah-keterangan-zamrud" className="mt-1 text-sm text-krem-100/75">Maksimal 10 orang per balasan. Kalau memilih tidak bisa hadir, jumlah ini tidak dihitung.</p>
              </div>
              <div>
                <label htmlFor="pesan-zamrud" className="text-sm font-bold">Pesan atau doa (opsional)</label>
                <textarea
                  id="pesan-zamrud"
                  name="pesan"
                  maxLength={500}
                  rows={3}
                  placeholder="Tulis doa atau ucapan selamat di sini"
                  className="mt-2 w-full rounded-2xl border border-emerald-900/20 bg-white px-4 py-3 text-[15px] text-tinta"
                />
              </div>
              <button type="submit" className="min-h-[52px] w-full rounded-full bg-emas-500 text-sm font-bold text-emerald-950 hover:bg-emas-300">
                Kirim Konfirmasi & Ucapan
              </button>
              <p className="text-center text-sm text-krem-100/75">
                Kalau sudah pernah mengisi, kirim ulang saja dengan nama yang sama untuk memperbarui jawabanmu.
              </p>
            </form>
          ) : (
            <p className="mt-5 max-w-xl rounded-2xl bg-krem-200 px-4 py-3 text-sm font-bold text-tinta">
              Konfirmasi kehadiran untuk undangan ini sudah ditutup. Terima kasih atas doa dan perhatiannya.
            </p>
          )}
        </section>

        {/* Ucapan & doa */}
        {data.ucapan.length > 0 && (
          <section id="ucapan" data-tampil className="tampil scroll-mt-6 bg-krem-50 px-6 py-16">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-800">
              Ucapan & Doa
            </p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-emerald-950">
              Doa dari Para Tamu
            </h2>
            <ul className="mt-8 space-y-3">
              {data.ucapan.map((rsvp) => (
                <li key={rsvp.id} className="rounded-[1.75rem] border border-emas-300/40 bg-white/80 p-5">
                  <p className="flex flex-wrap items-center justify-between gap-2 font-bold text-tinta">
                    {rsvp.nama}
                    <span className="rounded-full bg-daun-100 px-3 py-1 text-xs font-bold text-daun-700">
                      {labelKehadiran(rsvp.kehadiran)}
                    </span>
                  </p>
                  <p className="mt-2 text-[15px] leading-relaxed text-tinta">{rsvp.pesan}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Tanda kasih (v2): hanya tampil kalau rekening atau alamat diisi. */}
        {adaTandaKasih && (
          <section id="tanda-kasih" data-tampil className="tampil scroll-mt-6 bg-krem-50 px-6 py-16">
            <p className="text-center text-xs font-bold uppercase tracking-[0.35em] text-emerald-800">
              Tanda Kasih
            </p>
            <h2 className="mt-3 text-center font-serif text-3xl font-bold text-emerald-950">
              Kirim Tanda Kasih
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-[15px] leading-relaxed text-tintaLembut">
              Kehadiranmu sudah jadi hadiah. Kalau mau memberi tanda kasih,
              silakan lewat rekening atau alamat di bawah ini.
            </p>
            <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-2">
              {data.rekeningNomor.trim() !== "" && (
                <div className="rounded-[1.75rem] border border-emas-300/40 bg-white/80 p-6 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-emas-600">Transfer</p>
                  {data.rekeningBank.trim() !== "" && (
                    <p className="mt-3 font-serif text-2xl font-bold text-emerald-950">{data.rekeningBank}</p>
                  )}
                  <p className="mt-2 font-mono text-lg font-bold tracking-wide text-tinta">{data.rekeningNomor}</p>
                  {data.rekeningNama.trim() !== "" && (
                    <p className="mt-1 text-sm text-tintaLembut">{data.rekeningNama}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => salinTeks(data.rekeningNomor, setTersalinRekening)}
                    className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-emerald-800 px-5 text-sm font-bold text-white hover:bg-emerald-900"
                  >
                    {tersalinRekening ? "Nomor tersalin!" : "Salin Nomor"}
                  </button>
                </div>
              )}
              {data.alamatKirim.trim() !== "" && (
                <div className="rounded-[1.75rem] border border-emas-300/40 bg-white/80 p-6 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-emas-600">Kirim Hadiah</p>
                  <p className="mt-3 text-[15px] leading-relaxed text-tinta">{data.alamatKirim}</p>
                  <button
                    type="button"
                    onClick={() => salinTeks(data.alamatKirim, setTersalinAlamat)}
                    className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-emerald-800 px-5 text-sm font-bold text-white hover:bg-emerald-900"
                  >
                    {tersalinAlamat ? "Alamat tersalin!" : "Salin Alamat"}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Penutup + bagikan */}
        <section id="penutup" data-tampil className="tampil scroll-mt-6 bg-emerald-950 px-6 py-16 text-center text-krem-50">
          <p className="font-script text-5xl leading-tight">{namaTampil(data)}</p>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-krem-100/85">
            Terima kasih atas doa, kehadiran, dan semua kebaikan yang menyertai
            kami. Semoga Allah membalasnya dengan yang lebih baik.
          </p>
          <p className="mt-6 font-bold">Wassalamu&apos;alaikum warahmatullahi wabarakatuh</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a
              href={buatTautanWhatsApp(pesanBagikan)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[48px] items-center rounded-full bg-emas-500 px-6 text-sm font-bold text-emerald-950 hover:bg-emas-300"
            >
              Bagikan via WhatsApp
            </a>
            <button
              type="button"
              onClick={salinTautan}
              className="inline-flex min-h-[48px] items-center rounded-full border-2 border-krem-50/40 px-6 text-sm font-bold hover:bg-white/10"
            >
              {tersalin ? "Tautan tersalin!" : "Salin Tautan"}
            </button>
          </div>
          <p className="mt-10 text-xs text-krem-100/70">
            Dibuat dengan{" "}
            <Link href="/" className="font-bold text-emas-300 underline underline-offset-4">
              UndanganKita
            </Link>
          </p>
        </section>
      </div>

      {/* Tombol mengambang: musik (kalau ada) + menu. Dipindah ke kanan
          atas karena bar konfirmasi kini menempati bawah layar; header
          platform sudah disembunyikan di halaman tamu, jadi pojok kanan
          atas bebas dan tidak menutupi konten maupun bar. */}
      <div className="fixed right-4 top-4 z-40 flex gap-2">
        {data.musikSrc && (
          <button
            type="button"
            onClick={alihMusik}
            aria-label={musikMain ? "Jeda musik" : "Putar musik"}
            className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-emerald-900 text-lg text-krem-50 shadow-kaca"
          >
            {musikMain ? "❚❚" : "♪"}
          </button>
        )}
        <button
          type="button"
          onClick={() => setMenuTerbuka(true)}
          aria-label="Buka menu"
          className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-emerald-900 text-lg font-bold text-krem-50 shadow-kaca"
        >
          ☰
        </button>
      </div>

      {/* Bar konfirmasi persisten (hanya setelah terbuka & RSVP dibuka). */}
      <BarKonfirmasi tampil={barTampil} />

      {/* Drawer menu */}
      {menuTerbuka && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setMenuTerbuka(false)}
          className="fixed inset-0 z-[75] bg-tinta/50"
        />
      )}
      <div
        className={`fixed inset-y-0 right-0 z-[80] flex w-72 max-w-[85vw] flex-col bg-krem-50 shadow-xl transition-transform duration-200 ${
          menuTerbuka ? "translate-x-0 visible" : "translate-x-full invisible"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <p className="font-serif text-xl font-bold text-emerald-950">Menu</p>
          <button
            type="button"
            onClick={() => setMenuTerbuka(false)}
            aria-label="Tutup menu"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-krem-300 text-lg font-bold"
          >
            ✕
          </button>
        </div>
        <nav aria-label="Menu undangan" className="flex-1 overflow-y-auto px-3 pb-4">
          <ul className="space-y-1">
            {data.statusAktif && (
              <li>
                <a
                  href="#rsvp"
                  onClick={() => setMenuTerbuka(false)}
                  className="block min-h-[48px] rounded-2xl bg-emas-500 px-4 py-3 text-center text-[15px] font-bold text-emerald-950"
                >
                  Konfirmasi Kehadiran
                </a>
              </li>
            )}
            {menuTampil.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setMenuTerbuka(false)}
                  className="block min-h-[48px] rounded-2xl px-4 py-3 text-[15px] font-bold text-tinta hover:bg-krem-100"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Lightbox galeri */}
      {fotoAktif !== null && (
        <div className="fixed inset-0 z-[90] flex flex-col bg-emerald-950/95 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-krem-50">
              {fotoAktif + 1} / {galeri.length}
            </p>
            <div className="flex gap-2">
              <a
                href={galeri[fotoAktif]}
                download
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/15 text-lg font-bold text-krem-50"
                aria-label="Unduh foto"
              >
                ⭳
              </a>
              <button
                type="button"
                onClick={() => setFotoAktif(null)}
                aria-label="Tutup foto"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/15 text-lg font-bold text-krem-50"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setFotoAktif((fotoAktif - 1 + galeri.length) % galeri.length)}
              aria-label="Foto sebelumnya"
              className="flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-full bg-white/15 text-xl font-bold text-krem-50"
            >
              ‹
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={galeri[fotoAktif]}
              alt={`Galeri ${fotoAktif + 1}`}
              className="max-h-[75vh] max-w-full rounded-[1.5rem] object-contain"
            />
            <button
              type="button"
              onClick={() => setFotoAktif((fotoAktif + 1) % galeri.length)}
              aria-label="Foto berikutnya"
              className="flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-full bg-white/15 text-xl font-bold text-krem-50"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
