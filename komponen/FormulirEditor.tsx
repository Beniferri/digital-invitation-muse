"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Templat } from "@/data/templat";
import PratinjauUndangan from "./PratinjauUndangan";

// Editor sederhana dalam satu layar: formulir di kiri, pratinjau di kanan
// (di ponsel, pratinjau muncul tepat di bawah formulir, tanpa pindah halaman).
// Perilaku simpan (Tahap 1):
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
// - Header editor nempel (Prioritas 1, Nov 2026): nama undangan + lencana
//   Draft + indikator tersimpan otomatis + tombol Pratinjau (jangkar ke
//   seksi pratinjau) + Simpan (tombol submit luar formulir lewat atribut
//   form). Kalau belum masuk, Simpan diganti tautan Masuk.
// - Navigasi seksi: sidebar di desktop + daftar isi chip di ponsel,
//   menjangkar ke id bagian form (templat, detail, sampul, galeri,
//   kisah, tanda kasih). Tautan seksi khusus halaman penuh hanya tampil
//   kalau templat terpilih memang halaman penuh.
// - Pratinjau bisa diganti bingkainya (ponsel = bingkai gelap max-w-md,
//   lebar = penuh) dan dibuka layar penuh lewat Fullscreen API.
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
}

export default function FormulirEditor({
  daftar,
  sudahMasuk,
  aksi,
}: {
  daftar: Templat[];
  sudahMasuk: boolean;
  aksi: (formulir: FormData) => Promise<void>;
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
  const [namaBerkasGaleri, setNamaBerkasGaleri] = useState<string[]>([]);
  const [sudahDimuat, setSudahDimuat] = useState(false);
  const [drafDipulihkan, setDrafDipulihkan] = useState(false);
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
              (draf.alamatKirim ?? "") !== ""
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
      };
      window.localStorage.setItem(KUNCI_DRAF, JSON.stringify(draf));
      setTersimpanPada(
        new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      );
    } catch {
      // Penyimpanan perangkat penuh atau diblokir: editor tetap jalan.
    }
  }, [sudahDimuat, templatTerpilih, namaPertama, namaKedua, tanggal, lokasi, orangTuaPertama, orangTuaKedua, acaraWaktu, acaraKeduaJudul, acaraKeduaWaktu, acaraKeduaLokasi, kisahJudul, kisahCerita, videoKisah, rekeningBank, rekeningNomor, rekeningNama, alamatKirim]);

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
    { href: "#bagian-sampul", label: "Sampul" },
    ...(templatTerpilih.halamanPenuh
      ? [
          { href: "#bagian-galeri", label: "Foto & Galeri" },
          { href: "#bagian-kisah", label: "Kisah" },
          { href: "#bagian-tandakasih", label: "Tanda Kasih" },
        ]
      : []),
  ];

  function bukaLayarPenuh() {
    const elemen = pratinjauRef.current;
    if (elemen?.requestFullscreen) {
      elemen.requestFullscreen().catch(() => {});
    }
  }

  return (
    <>
      <div className="sticky top-4 z-30 mb-6 flex flex-wrap items-center gap-3 rounded-full kartu-kaca px-4 py-2">
        <p className="min-w-0 flex-1 truncate text-sm font-bold sm:text-[15px]">
          {namaUndangan || "Undangan baru"}
        </p>
        <span className="shrink-0 rounded-full bg-krem-200 px-3 py-1 text-xs font-bold text-tinta">
          Draft
        </span>
        <p className="hidden shrink-0 text-xs text-tintaLembut md:block">
          {tersimpanPada
            ? `Tersimpan otomatis • ${tersimpanPada}`
            : "Draf disimpan otomatis di perangkat ini"}
        </p>
        <a
          href="#pratinjau"
          className="flex min-h-[44px] shrink-0 items-center rounded-full border-2 border-tanah-600 px-4 text-sm font-bold text-tanah-700"
        >
          Pratinjau
        </a>
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
      </div>

      <nav aria-label="Bagian editor" className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {tautanSeksi.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex min-h-[44px] shrink-0 items-center rounded-full border border-tanah-900/15 bg-white/70 px-4 text-sm font-bold"
          >
            {item.label}
          </a>
        ))}
        <a
          href="/bantuan"
          className="flex min-h-[44px] shrink-0 items-center rounded-full border border-tanah-900/15 bg-white/70 px-4 text-sm font-bold text-tanah-600"
        >
          Butuh bantuan?
        </a>
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-[208px_minmax(0,1fr)]">
        <nav aria-label="Bagian editor" className="sticky top-24 hidden self-start lg:block">
          <p className="px-2 text-xs font-bold uppercase tracking-widest text-tintaLembut">Bagian</p>
          <ul className="mt-2 space-y-1">
            {tautanSeksi.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="block min-h-[44px] rounded-2xl px-3 py-3 text-sm font-bold text-tinta hover:bg-krem-100"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-krem-200 px-2 pt-4">
            <p className="text-sm font-bold">Butuh bantuan?</p>
            <Link
              href="/bantuan"
              className="mt-1 block text-sm font-bold text-tanah-600 underline underline-offset-4"
            >
              Lihat halaman Bantuan
            </Link>
          </div>
        </nav>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <form id="formulir-editor" action={aksi} className="kartu-kaca rounded-[2rem] p-5 sm:p-7">
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

          <fieldset id="bagian-templat" className="mt-6 scroll-mt-24">
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

          <div id="bagian-detail" className="mt-5 scroll-mt-24">
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

          <div id="bagian-sampul" className="mt-5 scroll-mt-24">
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
            <div id="bagian-galeri" className="mt-5 scroll-mt-24">
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
            <fieldset id="bagian-kisah" className="mt-6 scroll-mt-24">
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
            <fieldset id="bagian-tandakasih" className="mt-6 scroll-mt-24">
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

      <section id="pratinjau" aria-label="Pratinjau undangan" className="scroll-mt-24 lg:sticky lg:top-28">
        <p className="mb-3 text-center text-sm font-bold text-tintaLembut">
          Pratinjau langsung · {templatTerpilih.nama} · {templatTerpilih.nuansa}
        </p>
        <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
          <div className="flex rounded-full border border-tanah-900/15 bg-white/70 p-1" role="group" aria-label="Ukuran pratinjau">
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
            className="min-h-[44px] rounded-full border border-tanah-900/15 bg-white/70 px-4 text-sm font-bold"
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
              data={{ namaPertama, namaKedua, tanggal, lokasi, fotoUrl }}
            />
          </div>
        </div>
        <p className="mt-3 text-center text-xs leading-relaxed text-tintaLembut">
          Pratinjau memakai foto placeholder kalau belum ada foto dipilih.
        </p>
      </section>
        </div>
      </div>
    </>
  );
}
