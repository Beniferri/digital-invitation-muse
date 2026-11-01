"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Templat } from "@/data/templat";
import PratinjauUndangan from "./PratinjauUndangan";

// Bilah format kata-kata (B, I, Tautan): membungkus teks terpilih di
// textarea dengan markah (**tebal**, *miring*, [teks](https://tautan)).
// Tanpa seleksi, menyisipkan markah berisi kata ganti di posisi kursor.
function BilahFormat({
  target,
  nilai,
  atur,
}: {
  target: RefObject<HTMLTextAreaElement>;
  nilai: string;
  atur: (nilai: string) => void;
}) {
  function bungkus(pembuka: string, penutup: string, ganti: string) {
    const elemen = target.current;
    if (!elemen) return;
    const awal = elemen.selectionStart ?? nilai.length;
    const akhir = elemen.selectionEnd ?? nilai.length;
    const pilih = nilai.slice(awal, akhir);
    const sisip = pilih ? `${pembuka}${pilih}${penutup}` : `${pembuka}${ganti}${penutup}`;
    atur(nilai.slice(0, awal) + sisip + nilai.slice(akhir));
    const posisiAkhir = awal + pembuka.length + (pilih ? pilih.length : ganti.length);
    requestAnimationFrame(() => {
      elemen.focus();
      elemen.setSelectionRange(awal + pembuka.length, posisiAkhir);
    });
  }
  const gayaTombol =
    "flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-tanah-900/15 bg-white/80 px-2 text-xs font-bold text-tinta hover:bg-krem-100";
  return (
    <span className="flex gap-1">
      <button type="button" aria-label="Tebalkan teks terpilih" title="Tebal" onClick={() => bungkus("**", "**", "teks tebal")} className={gayaTombol}>
        <span className="font-bold">B</span>
      </button>
      <button type="button" aria-label="Miringkan teks terpilih" title="Miring" onClick={() => bungkus("*", "*", "teks miring")} className={gayaTombol}>
        <span className="italic">I</span>
      </button>
      <button type="button" aria-label="Jadikan teks terpilih sebagai tautan" title="Tautan" onClick={() => bungkus("[", "](https://)", "teks tautan")} className={gayaTombol}>
        Tautan
      </button>
    </span>
  );
}

// Editor tiga kolom gaya SAVENTIFY (Nov 2026): header aplikasi +
// sidebar navigasi (250px) + panel formulir + panel pratinjau (40%).
// Di ponsel, kolom menumpuk (sidebar jadi chip horizontal, pratinjau di
// bawah formulir). Perilaku simpan (Tahap 1):
// - Isian (kecuali foto) tersimpan otomatis di localStorage perangkat ini
//   dan dipulihkan saat pengguna kembali ke editor — jadi isian tidak hilang
//   kalau pengguna diminta masuk/daftar dulu sebelum menyimpan. Foto tidak
//   bisa disimpan di localStorage, jadi harus dipilih ulang setelah masuk.
// - Kalau pengguna sudah masuk, tombol Simpan mengirim formulir ke server
//   action (aksi) yang menyimpan undangan sebagai Draft milik pengguna itu.
// - Kalau belum masuk, tombol Simpan diganti kartu masuk/daftar dengan
//   tujuan kembali /editor, supaya setelah masuk ia kembali ke editor
//   dengan draf yang tadi masih utuh.
// - Draf yang dipulihkan sengaja tidak dihapus setelah simpan berhasil:
//   server action mengarahkan ke /akun dan tidak bisa membersihkan
//   localStorage. Sebagai gantinya, ada catatan draf dipulihkan dan tombol
//   Atur ulang yang mengembalikan isian ke contoh template (dan menimpa
//   draf dengan nilai contoh itu).
// - Header: brand + nama undangan live + lencana Draft + indikator
//   tersimpan otomatis + Pratinjau (layar penuh) + Simpan (tombol submit
//   luar formulir lewat atribut form) + Lanjut (pindah langkah). Kalau
//   belum masuk, Simpan diganti tautan Masuk.
// - Langkah (bukan kunci linear): Buat (gulir ke atas formulir),
//   Periksa (pratinjau layar penuh), Bagikan (gulir ke panel bagikan).
// - Navigasi seksi: sidebar dengan penanda aktif mengikuti seksi yang
//   terlihat (scroll-spy); tautan seksi khusus halaman penuh hanya tampil
//   kalau templat terpilih memang halaman penuh.
// - Pratinjau bisa diganti bingkainya (ponsel = bingkai gelap max-w-md,
//   lebar = penuh) dan dibuka layar penuh lewat Fullscreen API.
// - Kata-kata: sapaan pembuka + kata pengantar (markah **tebal**,
//   *miring*, [teks](https://tautan) dirender aman di halaman tamu
//   lewat TeksBerformat — tanpa dangerouslySetInnerHTML).
const KUNCI_DRAF = "undangan-editor-draf";

interface DrafEditor {
  slug: string;
  namaPertama: string;
  namaKedua: string;
  tanggal: string;
  lokasi: string;
  // Nama orang tua hanya dipakai templat halaman penuh (Zamrud).
  orangTuaPertama?: string;
  orangTuaKedua?: string;
  // Zamrud v2 — kolom form lengkap, juga hanya templat halaman penuh.
  // Foto galeri tidak ikut draf (seperti foto utama).
  acaraWaktu?: string;
  acaraKeduaJudul?: string;
  acaraKeduaWaktu?: string;
  acaraKeduaLokasi?: string;
  kisahJudul?: string[];
  kisahCerita?: string[];
  videoKisah?: string;
  rekeningBank?: string;
  rekeningNomor?: string;
  rekeningNama?: string;
  alamatKirim?: string;
  // Kata-kata editor (opsional; kosong = teks template).
  teksPembuka?: string;
  kataPengantar?: string;
}

export default function FormulirEditor({
  daftar,
  sudahMasuk,
  aksi,
  galat,
}: {
  daftar: Templat[];
  sudahMasuk: boolean;
  aksi: (formulir: FormData) => Promise<void>;
  galat?: string;
}) {
  const parameterPencarian = useSearchParams();
  const slugDariTautan = parameterPencarian.get("templat");
  const templatAwal =
    daftar.find((templat) => templat.slug === slugDariTautan) ?? daftar[0];

  const [templatTerpilih, setTemplatTerpilih] = useState(templatAwal);
  const [namaPertama, setNamaPertama] = useState(templatAwal?.contoh.namaPertama ?? "");
  const [namaKedua, setNamaKedua] = useState(templatAwal?.contoh.namaKedua ?? "");
  const [orangTuaPertama, setOrangTuaPertama] = useState("");
  const [orangTuaKedua, setOrangTuaKedua] = useState("");
  const [tanggal, setTanggal] = useState(templatAwal?.contoh.tanggal ?? "");
  const [lokasi, setLokasi] = useState(templatAwal?.contoh.lokasi ?? "");
  const [fotoUrl, setFotoUrl] = useState(templatAwal?.fotoSampul ?? "https://picsum.photos/seed/undangan-editor/800/1000");
  const [namaBerkasFoto, setNamaBerkasFoto] = useState("");
  // Zamrud v2 — kolom form lengkap (hanya dipakai templat halaman penuh).
  const [acaraWaktu, setAcaraWaktu] = useState("");
  const [acaraKeduaJudul, setAcaraKeduaJudul] = useState("");
  const [acaraKeduaWaktu, setAcaraKeduaWaktu] = useState("");
  const [acaraKeduaLokasi, setAcaraKeduaLokasi] = useState("");
  const [kisahJudul, setKisahJudul] = useState<string[]>(["", "", ""]);
  const [kisahCerita, setKisahCerita] = useState<string[]>(["", "", ""]);
  const [videoKisah, setVideoKisah] = useState("");
  const [rekeningBank, setRekeningBank] = useState("");
  const [rekeningNomor, setRekeningNomor] = useState("");
  const [rekeningNama, setRekeningNama] = useState("");
  const [alamatKirim, setAlamatKirim] = useState("");
  // Kata-kata editor: sapaan pembuka + kata pengantar (markah ringan).
  const [teksPembuka, setTeksPembuka] = useState("");
  const [kataPengantar, setKataPengantar] = useState("");
  const teksPembukaRef = useRef<HTMLTextAreaElement>(null);
  const kataPengantarRef = useRef<HTMLTextAreaElement>(null);
  const [namaBerkasGaleri, setNamaBerkasGaleri] = useState<string[]>([]);
  const [sudahDimuat, setSudahDimuat] = useState(false);
  const [drafDipulihkan, setDrafDipulihkan] = useState(false);
  // Langkah aktif (penanda, bukan kunci): buat / periksa / bagikan.
  const [langkahAktif, setLangkahAktif] = useState<"buat" | "periksa" | "bagikan">("buat");
  // Penanda seksi sidebar mengikuti seksi yang terlihat (scroll-spy).
  const [bagianAktif, setBagianAktif] = useState("#bagian-templat");
  // Kontainer gulir panel tengah (dipakai tombol langkah Buat).
  const panelRef = useRef<HTMLElement>(null);
  // Jam terakhir draf tersimpan otomatis (format HH:MM). Kosong sebelum
  // penyimpanan pertama di sesi ini — header menampilkan teks pengganti.
  const [tersimpanPada, setTersimpanPada] = useState("");
  // Bingkai pratinjau: "ponsel" (bingkai gelap max-w-md, sesuai mayoritas
  // tamu yang membuka dari HP) atau "lebar" (penuh). Layar penuh memakai
  // Fullscreen API pada pembungkus pratinjau.
  const [modePratinjau, setModePratinjau] = useState<"ponsel" | "lebar">("ponsel");
  const pratinjauRef = useRef<HTMLDivElement>(null);
  // Menyimpan apakah URL foto dibuat dari berkas lokal, supaya bisa dibersihkan.
  const fotoLokalRef = useRef<string | null>(null);

  // Pulihkan draf dari kunjungan sebelumnya, kecuali pengguna datang lewat
  // tautan template yang eksplisit (?templat=...) — pilihan template yang
  // eksplisit menang atas draf, karena itu yang baru saja ia klik.
  useEffect(() => {
    if (!slugDariTautan) {
      try {
        const mentah = window.localStorage.getItem(KUNCI_DRAF);
        if (mentah) {
          const draf = JSON.parse(mentah) as Partial<DrafEditor>;
          const templatDraf = daftar.find((item) => item.slug === draf.slug);
          if (templatDraf) {
            const namaPertamaDraf = draf.namaPertama ?? templatDraf.contoh.namaPertama;
            const namaKeduaDraf = draf.namaKedua ?? templatDraf.contoh.namaKedua;
            const tanggalDraf = draf.tanggal ?? templatDraf.contoh.tanggal;
            const lokasiDraf = draf.lokasi ?? templatDraf.contoh.lokasi;
            setTemplatTerpilih(templatDraf);
            setNamaPertama(namaPertamaDraf);
            setNamaKedua(namaKeduaDraf);
            setTanggal(tanggalDraf);
            setLokasi(lokasiDraf);
            setOrangTuaPertama(draf.orangTuaPertama ?? "");
            setOrangTuaKedua(draf.orangTuaKedua ?? "");
            setAcaraWaktu(draf.acaraWaktu ?? "");
            setAcaraKeduaJudul(draf.acaraKeduaJudul ?? "");
            setAcaraKeduaWaktu(draf.acaraKeduaWaktu ?? "");
            setAcaraKeduaLokasi(draf.acaraKeduaLokasi ?? "");
            setKisahJudul(Array.isArray(draf.kisahJudul) && draf.kisahJudul.length === 3 ? draf.kisahJudul : ["", "", ""]);
            setKisahCerita(Array.isArray(draf.kisahCerita) && draf.kisahCerita.length === 3 ? draf.kisahCerita : ["", "", ""]);
            setVideoKisah(draf.videoKisah ?? "");
            setRekeningBank(draf.rekeningBank ?? "");
            setRekeningNomor(draf.rekeningNomor ?? "");
            setRekeningNama(draf.rekeningNama ?? "");
            setAlamatKirim(draf.alamatKirim ?? "");
            setTeksPembuka(draf.teksPembuka ?? "");
            setKataPengantar(draf.kataPengantar ?? "");
            setFotoUrl(templatDraf.fotoSampul ?? "https://picsum.photos/seed/undangan-editor/800/1000");
            // Catatan hanya tampil kalau draf benar-benar berbeda dari contoh,
            // supaya kunjungan pertama (draf berisi nilai contoh) tidak
            // menampilkan catatan yang membingungkan.
            if (
              namaPertamaDraf !== templatDraf.contoh.namaPertama ||
              namaKeduaDraf !== templatDraf.contoh.namaKedua ||
              tanggalDraf !== templatDraf.contoh.tanggal ||
              lokasiDraf !== templatDraf.contoh.lokasi ||
              (draf.orangTuaPertama ?? "") !== "" ||
              (draf.orangTuaKedua ?? "") !== "" ||
              (draf.acaraWaktu ?? "") !== "" ||
              (draf.acaraKeduaJudul ?? "") !== "" ||
              (draf.acaraKeduaWaktu ?? "") !== "" ||
              (draf.acaraKeduaLokasi ?? "") !== "" ||
              (draf.kisahJudul ?? []).some((nilai) => nilai !== "") ||
              (draf.kisahCerita ?? []).some((nilai) => nilai !== "") ||
              (draf.videoKisah ?? "") !== "" ||
              (draf.rekeningBank ?? "") !== "" ||
              (draf.rekeningNomor ?? "") !== "" ||
              (draf.rekeningNama ?? "") !== "" ||
              (draf.alamatKirim ?? "") !== "" ||
              (draf.teksPembuka ?? "") !== "" ||
              (draf.kataPengantar ?? "") !== ""
            ) {
              setDrafDipulihkan(true);
            }
          }
        }
      } catch {
        // localStorage tidak tersedia atau draf rusak: abaikan, pakai contoh.
      }
    }
    setSudahDimuat(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simpan draf setiap kali isian berubah (setelah pemulihan awal selesai).
  useEffect(() => {
    if (!sudahDimuat) return;
    try {
      const draf: DrafEditor = {
        slug: templatTerpilih.slug,
        namaPertama,
        namaKedua,
        tanggal,
        lokasi,
        orangTuaPertama,
        orangTuaKedua,
        acaraWaktu,
        acaraKeduaJudul,
        acaraKeduaWaktu,
        acaraKeduaLokasi,
        kisahJudul,
        kisahCerita,
        videoKisah,
        rekeningBank,
        rekeningNomor,
        rekeningNama,
        alamatKirim,
        teksPembuka,
        kataPengantar,
      };
      window.localStorage.setItem(KUNCI_DRAF, JSON.stringify(draf));
      setTersimpanPada(
        new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      );
    } catch {
      // Penyimpanan perangkat penuh atau diblokir: editor tetap jalan.
    }
  }, [sudahDimuat, templatTerpilih, namaPertama, namaKedua, tanggal, lokasi, orangTuaPertama, orangTuaKedua, acaraWaktu, acaraKeduaJudul, acaraKeduaWaktu, acaraKeduaLokasi, kisahJudul, kisahCerita, videoKisah, rekeningBank, rekeningNomor, rekeningNama, alamatKirim, teksPembuka, kataPengantar]);

  // Scroll-spy sidebar: seksi yang melewati pita atas layar jadi aktif.
  // Root dibiarkan viewport supaya jalan di panel tengah (desktop)
  // maupun gulir halaman (ponsel).
  useEffect(() => {
    const seksi = Array.from(document.querySelectorAll("[data-bagian]"));
    const pengamat = new IntersectionObserver(
      (entri) => {
        for (const item of entri) {
          if (item.isIntersecting) setBagianAktif(`#${item.target.id}`);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    seksi.forEach((el) => pengamat.observe(el));
    return () => pengamat.disconnect();
  }, [templatTerpilih.halamanPenuh]);

  // Bersihkan object URL saat komponen dilepas, supaya tidak membebani peramban.
  useEffect(() => {
    return () => {
      if (fotoLokalRef.current) URL.revokeObjectURL(fotoLokalRef.current);
    };
  }, []);

  function pilihTemplat(slug: string) {
    const templat = daftar.find((item) => item.slug === slug);
    if (!templat) return;
    setTemplatTerpilih(templat);
    setNamaPertama(templat.contoh.namaPertama);
    setNamaKedua(templat.contoh.namaKedua);
    setTanggal(templat.contoh.tanggal);
    setLokasi(templat.contoh.lokasi);
    setOrangTuaPertama("");
    setOrangTuaKedua("");
    setAcaraWaktu("");
    setAcaraKeduaJudul("");
    setAcaraKeduaWaktu("");
    setAcaraKeduaLokasi("");
    setKisahJudul(["", "", ""]);
    setKisahCerita(["", "", ""]);
    setVideoKisah("");
    setRekeningBank("");
    setRekeningNomor("");
    setRekeningNama("");
    setAlamatKirim("");
    setTeksPembuka("");
    setKataPengantar("");
    setNamaBerkasGaleri([]);
    if (fotoLokalRef.current) URL.revokeObjectURL(fotoLokalRef.current);
    fotoLokalRef.current = null;
    setNamaBerkasFoto("");
    setFotoUrl(templat.fotoSampul ?? "https://picsum.photos/seed/undangan-editor/800/1000");
  }

  function aturKisahJudul(indeks: number, nilai: string) {
    setKisahJudul((sebelum) => sebelum.map((item, i) => (i === indeks ? nilai : item)));
  }

  function aturKisahCerita(indeks: number, nilai: string) {
    setKisahCerita((sebelum) => sebelum.map((item, i) => (i === indeks ? nilai : item)));
  }

  function unggahFoto(berkas: File | undefined) {
    if (!berkas) return;
    // Foto hanya dibuat URL pratinjaunya di perangkat ini; berkas aslinya
    // baru dikirim ke server saat formulir disimpan (input file di bawah).
    if (fotoLokalRef.current) URL.revokeObjectURL(fotoLokalRef.current);
    const urlLokal = URL.createObjectURL(berkas);
    fotoLokalRef.current = urlLokal;
    setFotoUrl(urlLokal);
    setNamaBerkasFoto(berkas.name);
  }

  function aturUlang() {
    if (fotoLokalRef.current) URL.revokeObjectURL(fotoLokalRef.current);
    fotoLokalRef.current = null;
    setFotoUrl(templatTerpilih.fotoSampul ?? "https://picsum.photos/seed/undangan-editor/800/1000");
    setNamaBerkasFoto("");
    setNamaPertama(templatTerpilih.contoh.namaPertama);
    setNamaKedua(templatTerpilih.contoh.namaKedua);
    setTanggal(templatTerpilih.contoh.tanggal);
    setLokasi(templatTerpilih.contoh.lokasi);
    setOrangTuaPertama("");
    setOrangTuaKedua("");
    setAcaraWaktu("");
    setAcaraKeduaJudul("");
    setAcaraKeduaWaktu("");
    setAcaraKeduaLokasi("");
    setKisahJudul(["", "", ""]);
    setKisahCerita(["", "", ""]);
    setVideoKisah("");
    setRekeningBank("");
    setRekeningNomor("");
    setRekeningNama("");
    setAlamatKirim("");
    setTeksPembuka("");
    setKataPengantar("");
    setNamaBerkasGaleri([]);
    setDrafDipulihkan(false);
  }

  const gayaInput =
    "mt-2 min-h-[48px] w-full rounded-2xl border border-tanah-900/15 bg-white/80 px-4 py-3 text-[15px] text-tinta placeholder:text-tintaLembut/70";

  // Nama yang tampil di header editor (ikut berubah saat mengetik).
  const namaUndangan = namaKedua ? `${namaPertama} dan ${namaKedua}` : namaPertama;
  // Urutan tautan mengikuti urutan seksi di formulir. Seksi khusus
  // halaman penuh hanya ditautkan kalau templat terpilih memang punya
  // seksi itu, supaya tidak ada tautan yang mengarah ke tempat kosong.
  const tautanSeksi = [
    { href: "#bagian-templat", label: "Templat" },
    { href: "#bagian-detail", label: "Detail Acara" },
    { href: "#bagian-kata-kata", label: "Kata-kata" },
    { href: "#bagian-sampul", label: "Sampul" },
    ...(templatTerpilih.halamanPenuh
      ? [
          { href: "#bagian-galeri", label: "Foto & Galeri" },
          { href: "#bagian-kisah", label: "Kisah" },
          { href: "#bagian-tandakasih", label: "Tanda Kasih" },
        ]
      : []),
  ];
  const tautanOpsi = [{ href: "#bagian-bagikan", label: "Bagikan & Terbitkan" }];

  function bukaLayarPenuh() {
    const elemen = pratinjauRef.current;
    if (elemen?.requestFullscreen) {
      elemen.requestFullscreen().catch(() => {});
    }
  }

  // Langkah (penanda, bukan kunci): klik memindahkan fokus, tidak
  // mengunci urutan — pengguna bebas melompat ke langkah mana pun.
  function keLangkah(langkah: "buat" | "periksa" | "bagikan") {
    setLangkahAktif(langkah);
    if (langkah === "buat") {
      document.getElementById("bagian-templat")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (langkah === "periksa") {
      bukaLayarPenuh();
    } else {
      document.getElementById("bagian-bagikan")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function lanjut() {
    if (langkahAktif === "buat") keLangkah("periksa");
    else keLangkah("bagikan");
  }

  // Item sidebar: chip di ponsel, baris + penanda aktif di desktop
  // (latar lebih gelap + bilah kiri terakota, ala referensi).
  function kelasItemSidebar(href: string) {
    const aktif = bagianAktif === href;
    return `flex min-h-[44px] shrink-0 items-center rounded-full border px-4 text-sm font-bold lg:rounded-2xl lg:rounded-l-none lg:border-y-0 lg:border-r-0 lg:border-l-2 lg:px-3 lg:py-3 ${
      aktif
        ? "border-tanah-600 bg-tanah-600 text-white lg:border-tanah-600 lg:bg-[#EDE8E1] lg:text-tinta"
        : "border-tanah-900/15 bg-white/70 text-tinta lg:border-transparent lg:bg-transparent hover:lg:bg-krem-100"
    }`;
  }

  return (
    <div className="flex h-dvh flex-col bg-[#F9F8F6]">
      {/* Header aplikasi ala referensi: brand | judul + DRAFT |
          tersimpan | Pratinjau | Simpan | Lanjut. */}
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-stone-200 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="BETA Storia — Beranda">
          <Image src="/logo/betastoria-web.png" alt="BETA Storia" width={1500} height={500} className="h-8 w-auto" />
        </Link>
        <p className="min-w-0 flex-1 truncate text-sm font-bold sm:text-[15px]">
          {namaUndangan || "Undangan baru"}{" "}
          <span className="ml-1 rounded-full bg-krem-200 px-2 py-1 text-[11px] font-bold text-tinta">
            DRAFT
          </span>
        </p>
        <p className="hidden shrink-0 text-xs text-tintaLembut md:block">
          ✓{" "}
          {tersimpanPada
            ? `Tersimpan otomatis • ${tersimpanPada}`
            : "Draf disimpan otomatis di perangkat ini"}
        </p>
        <button
          type="button"
          onClick={() => keLangkah("periksa")}
          className="flex min-h-[44px] shrink-0 items-center rounded-full border-2 border-tanah-600 px-4 text-sm font-bold text-tanah-700"
        >
          Pratinjau
        </button>
        {sudahMasuk ? (
          <button
            type="submit"
            form="formulir-editor"
            className="tombol-utama shrink-0 bg-tanah-600 text-sm text-white hover:bg-tanah-700"
          >
            Simpan
          </button>
        ) : (
          <Link
            href="/masuk?lanjut=/editor"
            className="tombol-utama shrink-0 bg-tanah-600 text-sm text-white hover:bg-tanah-700"
          >
            Masuk
          </Link>
        )}
        <button
          type="button"
          onClick={lanjut}
          className="tombol-utama shrink-0 bg-tanah-600 text-sm text-white hover:bg-tanah-700"
        >
          Lanjut →
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {/* Sidebar: chip horizontal di ponsel, daftar di desktop. */}
        <aside className="shrink-0 border-b border-stone-200 lg:flex lg:h-full lg:w-64 lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="px-4 pt-4 lg:px-5 lg:pt-5">
            {sudahMasuk ? (
              <Link href="/akun" className="text-sm font-bold text-tanah-600 underline underline-offset-4">
                ← Kembali ke dasbor
              </Link>
            ) : (
              <p className="text-sm font-bold">
                <Link href="/daftar?lanjut=/editor" className="text-tanah-600 underline underline-offset-4">Daftar</Link>
                {" atau "}
                <Link href="/masuk?lanjut=/editor" className="text-tanah-600 underline underline-offset-4">Masuk</Link>
              </p>
            )}
          </div>
          <nav aria-label="Bagian editor" className="flex gap-2 overflow-x-auto px-4 py-3 lg:flex-col lg:overflow-visible lg:px-3 lg:py-4">
            <p className="hidden px-3 text-xs font-bold uppercase tracking-widest text-tintaLembut lg:block">Design</p>
            {tautanSeksi.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setBagianAktif(item.href)} className={kelasItemSidebar(item.href)}>
                {item.label}
              </a>
            ))}
            <p className="mt-2 hidden px-3 text-xs font-bold uppercase tracking-widest text-tintaLembut lg:block">Opsi</p>
            {tautanOpsi.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setBagianAktif(item.href)} className={kelasItemSidebar(item.href)}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-auto hidden border-t border-stone-200 px-5 py-4 lg:block">
            <p className="text-sm font-bold">Butuh bantuan?</p>
            <Link href="/bantuan" className="mt-1 block text-sm font-bold text-tanah-600 underline underline-offset-4">
              Lihat artikel bantuan
            </Link>
          </div>
        </aside>

        {/* Panel tengah: langkah + formulir. */}
        <main ref={panelRef} className="min-w-0 flex-1 bg-white lg:h-full lg:overflow-y-auto">
          <div className="sticky top-0 z-20 border-b border-stone-200 bg-white px-5 py-3 sm:px-8">
            <ol className="flex items-center gap-4 text-sm font-bold sm:gap-6">
              {([
                { kunci: "buat", label: "1. Buat" },
                { kunci: "periksa", label: "2. Periksa" },
                { kunci: "bagikan", label: "3. Bagikan" },
              ] as const).map((langkah) => (
                <li key={langkah.kunci}>
                  <button
                    type="button"
                    onClick={() => keLangkah(langkah.kunci)}
                    aria-current={langkahAktif === langkah.kunci ? "step" : undefined}
                    className={langkahAktif === langkah.kunci ? "text-tanah-700 underline decoration-tanah-600 decoration-2 underline-offset-8" : "text-tintaLembut"}
                  >
                    {langkah.label}
                  </button>
                </li>
              ))}
            </ol>
          </div>
          {galat && (
            <p role="alert" className="mx-5 mt-5 rounded-2xl bg-terakota-100 px-4 py-3 text-sm font-bold text-tanah-700 sm:mx-8">
              {galat}
            </p>
          )}
          <form id="formulir-editor" action={aksi} className="p-5 sm:p-8">
        <section aria-label="Formulir data undangan">
          <h2 className="font-serif text-2xl font-bold">Isi data acaramu</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-tintaLembut">
            Kolomnya sama untuk semua jenis acara, dari akad nikah sampai wisuda.
            Ketik, dan pratinjau langsung berubah.
          </p>
          {drafDipulihkan && (
            <p role="status" className="mt-4 rounded-2xl bg-daun-100 px-4 py-3 text-sm font-bold text-daun-700">
              Draf dari kunjungan sebelumnya dipulihkan. Kalau undangan ini sudah
              kamu simpan, tekan Atur ulang di bawah untuk mulai dari contoh.
            </p>
          )}

          <input type="hidden" name="slugTemplat" value={templatTerpilih.slug} />

          <fieldset id="bagian-templat" data-bagian className="mt-6 scroll-mt-24">
            <legend className="text-sm font-bold">Pilih templat</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {daftar.map((templat) => (
                <button
                  key={templat.slug}
                  type="button"
                  onClick={() => pilihTemplat(templat.slug)}
                  aria-pressed={templatTerpilih.slug === templat.slug}
                  className={`min-h-[48px] rounded-2xl border-2 px-2 py-3 text-xs font-bold sm:text-sm ${
                    templatTerpilih.slug === templat.slug
                      ? "border-tanah-600 bg-tanah-600 text-white"
                      : "border-tanah-900/15 bg-white/70 text-tinta"
                  }`}
                >
                  {templat.nama}
                  <span className="block text-[11px] font-semibold opacity-80 sm:text-xs">{templat.jenisAcara}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div id="bagian-detail" data-bagian className="mt-5 scroll-mt-24">
            <label htmlFor="nama-pertama" className="text-sm font-bold">
              Nama mempelai / tuan rumah (baris pertama)
            </label>
            <input
              id="nama-pertama"
              name="namaPertama"
              value={namaPertama}
              onChange={(acara) => setNamaPertama(acara.target.value)}
              placeholder="Contoh: Nadia Ayu Prameswari"
              required
              className={gayaInput}
            />
          </div>

          <div className="mt-4">
            <label htmlFor="nama-kedua" className="text-sm font-bold">
              Nama kedua <span className="font-semibold text-tintaLembut">(opsional, kosongkan untuk acara satu nama)</span>
            </label>
            <input
              id="nama-kedua"
              name="namaKedua"
              value={namaKedua}
              onChange={(acara) => setNamaKedua(acara.target.value)}
              placeholder="Contoh: Arka Pradana Wijaya"
              className={gayaInput}
            />
          </div>

          {templatTerpilih.halamanPenuh && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="orang-tua-pertama" className="text-sm font-bold">
                  Nama orang tua pertama <span className="font-semibold text-tintaLembut">(opsional)</span>
                </label>
                <input
                  id="orang-tua-pertama"
                  name="orangTuaPertama"
                  value={orangTuaPertama}
                  onChange={(acara) => setOrangTuaPertama(acara.target.value)}
                  placeholder="Contoh: Bapak Ahmad Fauzan dan Ibu Siti Rahmawati"
                  className={gayaInput}
                />
              </div>
              <div>
                <label htmlFor="orang-tua-kedua" className="text-sm font-bold">
                  Nama orang tua kedua <span className="font-semibold text-tintaLembut">(opsional)</span>
                </label>
                <input
                  id="orang-tua-kedua"
                  name="orangTuaKedua"
                  value={orangTuaKedua}
                  onChange={(acara) => setOrangTuaKedua(acara.target.value)}
                  placeholder="Contoh: Bapak H. Abdul Hakim dan Ibu Hj. Nur Aini"
                  className={gayaInput}
                />
              </div>
            </div>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tanggal-acara" className="text-sm font-bold">
                Tanggal acara
              </label>
              <input
                id="tanggal-acara"
                name="tanggal"
                type="date"
                value={tanggal}
                onChange={(acara) => setTanggal(acara.target.value)}
                className={gayaInput}
              />
            </div>
            <div>
              <label htmlFor="lokasi-acara" className="text-sm font-bold">
                Lokasi acara
              </label>
              <input
                id="lokasi-acara"
                name="lokasi"
                value={lokasi}
                onChange={(acara) => setLokasi(acara.target.value)}
                placeholder="Contoh: Pendopo Seruni, Sleman"
                className={gayaInput}
              />
            </div>
          </div>

          {templatTerpilih.halamanPenuh && (
            <fieldset className="mt-6">
              <legend className="text-sm font-bold">Waktu & acara kedua</legend>
              <p className="mt-1 text-sm leading-relaxed text-tintaLembut">
                Waktu tampil di kartu acara. Kosongkan acara kedua kalau hanya
                ada satu acara.
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="acara-waktu" className="text-sm font-bold">
                    Waktu acara utama <span className="font-semibold text-tintaLembut">(opsional)</span>
                  </label>
                  <input
                    id="acara-waktu"
                    name="acaraWaktu"
                    value={acaraWaktu}
                    onChange={(acara) => setAcaraWaktu(acara.target.value)}
                    placeholder="Contoh: 10.00 WIB"
                    className={gayaInput}
                  />
                </div>
                <div>
                  <label htmlFor="acara-kedua-judul" className="text-sm font-bold">
                    Judul acara kedua <span className="font-semibold text-tintaLembut">(opsional)</span>
                  </label>
                  <input
                    id="acara-kedua-judul"
                    name="acaraKeduaJudul"
                    value={acaraKeduaJudul}
                    onChange={(acara) => setAcaraKeduaJudul(acara.target.value)}
                    placeholder="Contoh: Resepsi"
                    className={gayaInput}
                  />
                </div>
                <div>
                  <label htmlFor="acara-kedua-waktu" className="text-sm font-bold">
                    Waktu acara kedua <span className="font-semibold text-tintaLembut">(opsional)</span>
                  </label>
                  <input
                    id="acara-kedua-waktu"
                    name="acaraKeduaWaktu"
                    value={acaraKeduaWaktu}
                    onChange={(acara) => setAcaraKeduaWaktu(acara.target.value)}
                    placeholder="Contoh: 13.00 WIB"
                    className={gayaInput}
                  />
                </div>
                <div>
                  <label htmlFor="acara-kedua-lokasi" className="text-sm font-bold">
                    Lokasi acara kedua <span className="font-semibold text-tintaLembut">(opsional, kosong = lokasi yang sama)</span>
                  </label>
                  <input
                    id="acara-kedua-lokasi"
                    name="acaraKeduaLokasi"
                    value={acaraKeduaLokasi}
                    onChange={(acara) => setAcaraKeduaLokasi(acara.target.value)}
                    placeholder="Contoh: Gedung Serbaguna"
                    className={gayaInput}
                  />
                </div>
              </div>
            </fieldset>
          )}

          <fieldset id="bagian-kata-kata" data-bagian className="mt-6 scroll-mt-24">
            <legend className="text-sm font-bold">Kata-kata undangan</legend>
            <p className="mt-1 text-sm leading-relaxed text-tintaLembut">
              Ubah kata-kata undanganmu di sini. Kosongkan sapaan atau
              pengantar untuk memakai teks bawaan template. Markah
              **tebal**, *miring*, dan [tautan](https://...) tampil di
              halaman tamu.
            </p>
            <div className="mt-4">
              <label htmlFor="gaya-kata" className="text-sm font-bold">
                Gaya
              </label>
              <select
                id="gaya-kata"
                value={templatTerpilih.slug}
                onChange={(acara) => pilihTemplat(acara.target.value)}
                className={gayaInput}
              >
                {daftar.map((templat) => (
                  <option key={templat.slug} value={templat.slug}>
                    {templat.nama} · {templat.nuansa}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-tintaLembut">
                Gaya sama dengan template yang dipilih di atas — menggantinya
                di sini mengisi ulang contoh template.
              </p>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="teks-pembuka" className="text-sm font-bold">
                  Sapaan pembuka <span className="font-semibold text-tintaLembut">(opsional)</span>
                </label>
                <BilahFormat target={teksPembukaRef} nilai={teksPembuka} atur={setTeksPembuka} />
              </div>
              <textarea
                id="teks-pembuka"
                ref={teksPembukaRef}
                name="teksPembuka"
                value={teksPembuka}
                onChange={(acara) => setTeksPembuka(acara.target.value)}
                rows={2}
                maxLength={200}
                placeholder="Contoh: Dengan penuh syukur, kami mengundangmu hadir"
                className={gayaInput}
              />
            </div>
            <div className="mt-4">
              <label className="text-sm font-bold">
                Judul acara
              </label>
              <p className="mt-2 rounded-2xl border border-tanah-900/15 bg-krem-50 px-4 py-3 text-[15px] font-bold text-tinta">
                {namaUndangan || "Isi nama di Detail Acara"}
              </p>
              <p className="mt-1 text-sm text-tintaLembut">
                Judul mengikuti nama di Detail Acara —{" "}
                <a href="#bagian-detail" className="font-bold text-tanah-600 underline underline-offset-4">ubah di sana</a>.
              </p>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="tanggal-kata" className="text-sm font-bold">
                  Tanggal acara
                </label>
                <input
                  id="tanggal-kata"
                  type="date"
                  value={tanggal}
                  onChange={(acara) => setTanggal(acara.target.value)}
                  className={gayaInput}
                />
              </div>
              <div>
                <label htmlFor="lokasi-kata" className="text-sm font-bold">
                  Lokasi acara
                </label>
                <input
                  id="lokasi-kata"
                  value={lokasi}
                  onChange={(acara) => setLokasi(acara.target.value)}
                  placeholder="Contoh: Pendopo Seruni, Sleman"
                  className={gayaInput}
                />
              </div>
            </div>
            <p className="mt-1 text-sm text-tintaLembut">
              Tanggal dan lokasi ini sama dengan isian Detail Acara — mengubah
              di sini mengubah di sana juga.
            </p>
            <div className="mt-4">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="kata-pengantar" className="text-sm font-bold">
                  Kata pengantar <span className="font-semibold text-tintaLembut">(opsional)</span>
                </label>
                <BilahFormat target={kataPengantarRef} nilai={kataPengantar} atur={setKataPengantar} />
              </div>
              <textarea
                id="kata-pengantar"
                ref={kataPengantarRef}
                name="kataPengantar"
                value={kataPengantar}
                onChange={(acara) => setKataPengantar(acara.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Contoh: Kehadiranmu adalah hadiah terindah bagi kami"
                className={gayaInput}
              />
            </div>
          </fieldset>

          <div id="bagian-sampul" data-bagian className="mt-5 scroll-mt-24">
            <label htmlFor="foto-acara" className="text-sm font-bold">
              Foto undangan
            </label>
            <input
              id="foto-acara"
              name="foto"
              type="file"
              accept="image/*"
              onChange={(acara) => unggahFoto(acara.target.files?.[0])}
              className="mt-2 block w-full cursor-pointer rounded-2xl border border-dashed border-tanah-900/25 bg-white/70 px-4 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-tanah-600 file:px-4 file:py-2 file:font-bold file:text-white"
            />
            <p className="mt-2 text-sm leading-relaxed text-tintaLembut">
              {namaBerkasFoto
                ? `Foto terpilih: ${namaBerkasFoto}. ${sudahMasuk ? "Foto akan diunggah saat kamu menekan Simpan (maks 5 MB, JPG/PNG/WebP)." : "Foto hanya dipratinjau di perangkatmu dan tidak ikut tersimpan di draf — pilih ulang setelah kamu masuk."}`
                : "Belum ada foto dipilih, pratinjau memakai foto placeholder. Tanpa foto, undangan yang disimpan memakai foto sampul template."}
            </p>
          </div>

          {templatTerpilih.halamanPenuh && (
            <div id="bagian-galeri" data-bagian className="mt-5 scroll-mt-24">
              <label htmlFor="galeri-acara" className="text-sm font-bold">
                Galeri foto tambahan
              </label>
              <input
                id="galeri-acara"
                name="galeri"
                type="file"
                accept="image/*"
                multiple
                onChange={(acara) => setNamaBerkasGaleri(Array.from(acara.target.files ?? []).map((berkas) => berkas.name))}
                className="mt-2 block w-full cursor-pointer rounded-2xl border border-dashed border-tanah-900/25 bg-white/70 px-4 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-tanah-600 file:px-4 file:py-2 file:font-bold file:text-white"
              />
              <p className="mt-2 text-sm leading-relaxed text-tintaLembut">
                {namaBerkasGaleri.length > 0
                  ? `${namaBerkasGaleri.length} foto terpilih: ${namaBerkasGaleri.join(", ")}. Foto-foto ini tampil di galeri setelah foto utama, maksimal 6 foto, masing-masing 5 MB.`
                  : "Belum ada foto galeri dipilih. Galeri memakai foto utama (kalau ada) ditambah foto bawaan template. Seperti foto utama, foto galeri tidak ikut tersimpan di draf — pilih ulang setelah kamu masuk."}
              </p>
            </div>
          )}

          {templatTerpilih.halamanPenuh && (
            <fieldset id="bagian-kisah" data-bagian className="mt-6 scroll-mt-24">
              <legend className="text-sm font-bold">Kisah perjalanan</legend>
              <p className="mt-1 text-sm leading-relaxed text-tintaLembut">
                Tiga babak opsional. Babak yang judul dan ceritanya kosong tidak
                tampil. Video hanya tampil kalau tautannya video YouTube.
              </p>
              {[0, 1, 2].map((indeks) => (
                <div key={indeks} className="mt-4">
                  <label htmlFor={`kisah-judul-${indeks + 1}`} className="text-sm font-bold">
                    Judul babak {indeks + 1} <span className="font-semibold text-tintaLembut">(opsional)</span>
                  </label>
                  <input
                    id={`kisah-judul-${indeks + 1}`}
                    name={`kisahJudul${indeks + 1}`}
                    value={kisahJudul[indeks]}
                    onChange={(acara) => aturKisahJudul(indeks, acara.target.value)}
                    placeholder={`Contoh: Babak ${indeks + 1}`}
                    className={gayaInput}
                  />
                  <label htmlFor={`kisah-cerita-${indeks + 1}`} className="mt-3 block text-sm font-bold">
                    Cerita babak {indeks + 1} <span className="font-semibold text-tintaLembut">(opsional)</span>
                  </label>
                  <textarea
                    id={`kisah-cerita-${indeks + 1}`}
                    name={`kisahCerita${indeks + 1}`}
                    value={kisahCerita[indeks]}
                    onChange={(acara) => aturKisahCerita(indeks, acara.target.value)}
                    rows={3}
                    placeholder="Tulis cerita singkat babak ini"
                    className={gayaInput}
                  />
                </div>
              ))}
              <div className="mt-4">
                <label htmlFor="video-kisah" className="text-sm font-bold">
                  Video kisah <span className="font-semibold text-tintaLembut">(tautan YouTube, opsional)</span>
                </label>
                <input
                  id="video-kisah"
                  name="videoKisah"
                  value={videoKisah}
                  onChange={(acara) => setVideoKisah(acara.target.value)}
                  placeholder="Contoh: https://www.youtube.com/watch?v=..."
                  className={gayaInput}
                />
              </div>
            </fieldset>
          )}

          {templatTerpilih.halamanPenuh && (
            <fieldset id="bagian-tandakasih" data-bagian className="mt-6 scroll-mt-24">
              <legend className="text-sm font-bold">Tanda kasih</legend>
              <p className="mt-1 text-sm leading-relaxed text-tintaLembut">
                Kalau nomor rekening atau alamat diisi, undangan menampilkan
                seksi Tanda Kasih dengan tombol salin.
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="rekening-bank" className="text-sm font-bold">
                    Bank <span className="font-semibold text-tintaLembut">(opsional)</span>
                  </label>
                  <input
                    id="rekening-bank"
                    name="rekeningBank"
                    value={rekeningBank}
                    onChange={(acara) => setRekeningBank(acara.target.value)}
                    placeholder="Contoh: BCA"
                    className={gayaInput}
                  />
                </div>
                <div>
                  <label htmlFor="rekening-nomor" className="text-sm font-bold">
                    Nomor rekening <span className="font-semibold text-tintaLembut">(opsional)</span>
                  </label>
                  <input
                    id="rekening-nomor"
                    name="rekeningNomor"
                    value={rekeningNomor}
                    onChange={(acara) => setRekeningNomor(acara.target.value)}
                    placeholder="Contoh: 1234567890"
                    className={gayaInput}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="rekening-nama" className="text-sm font-bold">
                  Nama pemilik rekening <span className="font-semibold text-tintaLembut">(opsional)</span>
                </label>
                <input
                  id="rekening-nama"
                  name="rekeningNama"
                  value={rekeningNama}
                  onChange={(acara) => setRekeningNama(acara.target.value)}
                  placeholder="Contoh: a.n. Nadia Ayu Prameswari"
                  className={gayaInput}
                />
              </div>
              <div className="mt-4">
                <label htmlFor="alamat-kirim" className="text-sm font-bold">
                  Alamat kirim hadiah <span className="font-semibold text-tintaLembut">(opsional)</span>
                </label>
                <textarea
                  id="alamat-kirim"
                  name="alamatKirim"
                  value={alamatKirim}
                  onChange={(acara) => setAlamatKirim(acara.target.value)}
                  rows={2}
                  placeholder="Contoh: Jl. Kenanga No. 12, Yogyakarta"
                  className={gayaInput}
                />
              </div>
            </fieldset>
          )}

          {sudahMasuk ? (
            <>
              <button
                type="submit"
                className="tombol-utama mt-6 w-full bg-tanah-600 text-sm text-white hover:bg-tanah-700"
              >
                Simpan sebagai Undangan Saya
              </button>
              <p className="mt-3 text-center text-xs leading-relaxed text-tintaLembut">
                Tersimpan sebagai Draft di dasbor saya. Ubah statusnya jadi Aktif
                dari dasbor supaya tamu bisa membuka tautan dan mengisi RSVP.
              </p>
            </>
          ) : (
            <div className="mt-6 rounded-[1.5rem] bg-krem-100 p-4">
              <p className="text-sm font-bold">Simpan butuh akun</p>
              <p className="mt-1 text-sm leading-relaxed text-tintaLembut">
                Isianmu (kecuali foto) sudah tersimpan otomatis di perangkat ini,
                jadi tetap ada saat kamu kembali setelah masuk.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/daftar?lanjut=/editor" className="tombol-utama bg-tanah-600 text-sm text-white hover:bg-tanah-700">
                  Daftar gratis
                </Link>
                <Link href="/masuk?lanjut=/editor" className="tombol-utama border-2 border-tanah-600 text-sm text-tanah-700 hover:bg-krem-100">
                  Masuk
                </Link>
              </div>
            </div>
          )}

          <div id="bagian-bagikan" data-bagian className="mt-8 scroll-mt-24 rounded-[1.5rem] border border-tanah-900/15 bg-krem-50 p-5">
            <h3 className="font-serif text-xl font-bold">Bagikan & terbitkan</h3>
            <p className="mt-2 text-sm leading-relaxed text-tintaLembut">
              Tiga langkah dari draf ke undangan yang bisa dibuka tamu.
            </p>
            <ol className="mt-4 space-y-3 text-sm leading-relaxed">
              <li>
                <span className="font-bold">1. Simpan.</span> Tekan Simpan di
                header atau di atas — undangan tersimpan sebagai Draft di
                dasbor saya.
              </li>
              <li>
                <span className="font-bold">2. Aktifkan.</span> Dari dasbor,
                ubah statusnya jadi Aktif (perlu paket aktif dan slot
                tersisa).{" "}
                <Link href="/akun" className="font-bold text-tanah-600 underline underline-offset-4">Buka dasbor saya</Link>
                {" · "}
                <Link href="/akun/paket" className="font-bold text-tanah-600 underline underline-offset-4">Lihat paket</Link>
              </li>
              <li>
                <span className="font-bold">3. Bagikan.</span> Setelah Aktif,
                tautan tamu dan tombol WhatsApp tersedia di dasbor — bagikan
                ke grup atau kirim personal.
              </li>
            </ol>
            <p className="mt-3 text-xs leading-relaxed text-tintaLembut">
              Tautan tamu baru ada setelah undangan disimpan — panel ini tidak
              membuat tautan palsu.
            </p>
          </div>

          <button
            type="button"
            onClick={aturUlang}
            className="tombol-utama mt-6 w-full border-2 border-tanah-600 text-sm text-tanah-700 hover:bg-krem-100"
          >
            Atur ulang ke contoh awal
          </button>
          <p className="mt-3 text-center text-xs leading-relaxed text-tintaLembut">
            Isianmu tersimpan otomatis di perangkat ini (kecuali foto) dan
            dipulihkan saat kamu kembali, selama kamu memakai perangkat dan
            peramban yang sama.
          </p>
        </section>
      </form>

      </main>

      {/* Panel kanan: pratinjau live dalam bingkai ponsel / lebar. */}
      <aside aria-label="Pratinjau undangan" className="shrink-0 bg-[#F1ECE6] px-4 py-6 sm:px-6 lg:h-full lg:w-[40%] lg:overflow-y-auto">
        <p className="text-center text-sm font-bold text-tintaLembut">
          Pratinjau langsung · {templatTerpilih.nama} · {templatTerpilih.nuansa}
        </p>
        <div className="mb-4 mt-3 flex flex-wrap items-center justify-center gap-2">
          <div className="flex rounded-full border border-stone-200 bg-white p-1" role="group" aria-label="Ukuran pratinjau">
            <button
              type="button"
              onClick={() => setModePratinjau("ponsel")}
              aria-pressed={modePratinjau === "ponsel"}
              className={`min-h-[44px] rounded-full px-4 text-sm font-bold ${
                modePratinjau === "ponsel" ? "bg-tanah-600 text-white" : "text-tinta"
              }`}
            >
              Ponsel
            </button>
            <button
              type="button"
              onClick={() => setModePratinjau("lebar")}
              aria-pressed={modePratinjau === "lebar"}
              className={`min-h-[44px] rounded-full px-4 text-sm font-bold ${
                modePratinjau === "lebar" ? "bg-tanah-600 text-white" : "text-tinta"
              }`}
            >
              Lebar
            </button>
          </div>
          <button
            type="button"
            onClick={bukaLayarPenuh}
            className="min-h-[44px] rounded-full border border-stone-200 bg-white px-4 text-sm font-bold"
          >
            Layar penuh
          </button>
        </div>
        <div
          ref={pratinjauRef}
          className={
            modePratinjau === "ponsel"
              ? "mx-auto max-w-md rounded-[2.5rem] bg-tinta p-2 shadow-kaca"
              : "rounded-[2rem] shadow-kaca"
          }
        >
          <div className="overflow-hidden rounded-[2rem]">
            <PratinjauUndangan
              templat={templatTerpilih}
              data={{ namaPertama, namaKedua, tanggal, lokasi, fotoUrl, teksPembuka, kataPengantar }}
            />
          </div>
        </div>
        <p className="mt-3 text-center text-xs leading-relaxed text-tintaLembut">
          Pratinjau memakai foto placeholder kalau belum ada foto dipilih.
        </p>
      </aside>
    </div>
  </div>
  );
}
