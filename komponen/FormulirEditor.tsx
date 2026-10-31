"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Templat } from "@/data/templat";
import PratinjauUndangan from "./PratinjauUndangan";

// Editor sederhana dalam satu layar: formulir di kiri, pratinjau di kanan
// (di ponsel, pratinjau muncul tepat di bawah formulir, tanpa pindah halaman).
// Data hanya pratinjau lokal: tidak disimpan, tidak diunggah, dan hilang saat refresh.
export default function FormulirEditor({ daftar }: { daftar: Templat[] }) {
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
  // Menyimpan apakah URL foto dibuat dari berkas lokal, supaya bisa dibersihkan.
  const fotoLokalRef = useRef<string | null>(null);

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
    // Foto hanya dibuat URL pratinjaunya di perangkat ini, tidak dikirim ke server.
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
  }

  const gayaInput =
    "mt-2 min-h-[48px] w-full rounded-2xl border border-tanah-900/15 bg-white/80 px-4 py-3 text-[15px] text-tinta placeholder:text-tintaLembut/70";

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <section aria-label="Formulir data undangan" className="kartu-kaca rounded-[2rem] p-5 sm:p-7">
        <h2 className="font-serif text-2xl font-bold">Isi data acaramu</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-tintaLembut">
          Kolomnya sama untuk semua jenis acara, dari akad nikah sampai wisuda.
          Ketik, dan pratinjau di samping langsung berubah.
        </p>

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
            value={namaPertama}
            onChange={(acara) => setNamaPertama(acara.target.value)}
            placeholder="Contoh: Nadia Ayu Prameswari"
            className={gayaInput}
          />
        </div>

        <div className="mt-4">
          <label htmlFor="nama-kedua" className="text-sm font-bold">
            Nama kedua <span className="font-semibold text-tintaLembut">(opsional, kosongkan untuk acara satu nama)</span>
          </label>
          <input
            id="nama-kedua"
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
            type="file"
            accept="image/*"
            onChange={(acara) => unggahFoto(acara.target.files?.[0])}
            className="mt-2 block w-full cursor-pointer rounded-2xl border border-dashed border-tanah-900/25 bg-white/70 px-4 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-tanah-600 file:px-4 file:py-2 file:font-bold file:text-white"
          />
          <p className="mt-2 text-sm leading-relaxed text-tintaLembut">
            {namaBerkasFoto
              ? `Foto terpilih: ${namaBerkasFoto}. Foto hanya dipratinjau di perangkatmu.`
              : "Belum ada foto dipilih, pratinjau memakai foto placeholder. Foto yang kamu pilih tidak diunggah ke server."}
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
          Pratinjau ini hanya tersimpan di halaman ini. Muat ulang halaman, dan
          semua isian kembali ke contoh awal.
        </p>
      </section>

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
