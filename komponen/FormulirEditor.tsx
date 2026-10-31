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
const KUNCI_DRAF = "undangan-editor-draf";

interface DrafEditor {
  slug: string;
  namaPertama: string;
  namaKedua: string;
  tanggal: string;
  lokasi: string;
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
  const [tanggal, setTanggal] = useState(templatAwal?.contoh.tanggal ?? "");
  const [lokasi, setLokasi] = useState(templatAwal?.contoh.lokasi ?? "");
  const [fotoUrl, setFotoUrl] = useState(templatAwal?.fotoSampul ?? "https://picsum.photos/seed/undangan-editor/800/1000");
  const [namaBerkasFoto, setNamaBerkasFoto] = useState("");
  const [sudahDimuat, setSudahDimuat] = useState(false);
  const [drafDipulihkan, setDrafDipulihkan] = useState(false);
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
            setFotoUrl(templatDraf.fotoSampul ?? "https://picsum.photos/seed/undangan-editor/800/1000");
            // Catatan hanya tampil kalau draf benar-benar berbeda dari contoh,
            // supaya kunjungan pertama (draf berisi nilai contoh) tidak
            // menampilkan catatan yang membingungkan.
            if (
              namaPertamaDraf !== templatDraf.contoh.namaPertama ||
              namaKeduaDraf !== templatDraf.contoh.namaKedua ||
              tanggalDraf !== templatDraf.contoh.tanggal ||
              lokasiDraf !== templatDraf.contoh.lokasi
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
      };
      window.localStorage.setItem(KUNCI_DRAF, JSON.stringify(draf));
    } catch {
      // Penyimpanan perangkat penuh atau diblokir: editor tetap jalan.
    }
  }, [sudahDimuat, templatTerpilih, namaPertama, namaKedua, tanggal, lokasi]);

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
    if (fotoLokalRef.current) URL.revokeObjectURL(fotoLokalRef.current);
    fotoLokalRef.current = null;
    setNamaBerkasFoto("");
    setFotoUrl(templat.fotoSampul ?? "https://picsum.photos/seed/undangan-editor/800/1000");
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
    setDrafDipulihkan(false);
  }

  const gayaInput =
    "mt-2 min-h-[48px] w-full rounded-2xl border border-tanah-900/15 bg-white/80 px-4 py-3 text-[15px] text-tinta placeholder:text-tintaLembut/70";

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <form action={aksi} className="kartu-kaca rounded-[2rem] p-5 sm:p-7">
        <section aria-label="Formulir data undangan">
          <h2 className="font-serif text-2xl font-bold">Isi data acaramu</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-tintaLembut">
            Kolomnya sama untuk semua jenis acara, dari akad nikah sampai wisuda.
            Ketik, dan pratinjau di samping langsung berubah.
          </p>
          {drafDipulihkan && (
            <p role="status" className="mt-4 rounded-2xl bg-daun-100 px-4 py-3 text-sm font-bold text-daun-700">
              Draf dari kunjungan sebelumnya dipulihkan. Kalau undangan ini sudah
              kamu simpan, tekan Atur ulang di bawah untuk mulai dari contoh.
            </p>
          )}

          <input type="hidden" name="slugTemplat" value={templatTerpilih.slug} />

          <fieldset className="mt-6">
            <legend className="text-sm font-bold">Pilih templat</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {daftar.map((templat) => (
                <button
                  key={templat.slug}
                  type="button"
                  onClick={() => pilihTemplat(templat.slug)}
                  aria-pressed={templatTerpilih.slug === templat.slug}
                  className={`min-h-[48px] rounded-2xl border-2 px-2 py-3 text-sm font-bold ${
                    templatTerpilih.slug === templat.slug
                      ? "border-tanah-600 bg-tanah-600 text-white"
                      : "border-tanah-900/15 bg-white/70 text-tinta"
                  }`}
                >
                  {templat.nama}
                  <span className="block text-xs font-semibold opacity-80">{templat.jenisAcara}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-5">
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

          <div className="mt-5">
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

      <section aria-label="Pratinjau undangan" className="lg:sticky lg:top-28">
        <p className="mb-3 text-center text-sm font-bold text-tintaLembut">
          Pratinjau langsung · {templatTerpilih.nama} · {templatTerpilih.nuansa}
        </p>
        <div className="mx-auto max-w-md overflow-hidden rounded-[2rem] shadow-kaca">
          <PratinjauUndangan
            templat={templatTerpilih}
            data={{ namaPertama, namaKedua, tanggal, lokasi, fotoUrl }}
          />
        </div>
      </section>
    </div>
  );
}
