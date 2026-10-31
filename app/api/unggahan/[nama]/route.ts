// Melayani berkas foto unggahan (Tahap 4). Jalur publik foto tetap
// /unggahan/<nama> seperti dulu, tapi sejak Tahap 4 permintaan itu
// di-rewrite (beforeFiles, lihat next.config.mjs) ke route ini, bukan
// dilayani langsung dari public/. Alasannya: folder unggahan produksi
// (UNGGAHAN_DIR, di Coolify = /data/unggahan di dalam volume persisten)
// berada di luar public/, jadi Next tidak bisa melayaninya sendiri.
// Keamanan: nama berkas dibatasi pola ketat (tanpa garis miring dan
// tanpa ..) dan hanya ekstensi gambar yang dilayani, supaya route ini
// tidak bisa dipakai membaca berkas lain. Urutan baca: UNGGAHAN_DIR
// dulu, lalu public/unggahan sebagai fallback untuk berkas lama.

import { promises as berkas } from "fs";
import path from "path";
import { folderUnggahan } from "@/lib/penyimpananFoto";

export const dynamic = "force-dynamic";

const TIPE_PER_EKSTENSI: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function jalurAman(folder: string, nama: string): string | null {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(nama)) return null;
  const ekstensi = path.extname(nama).toLowerCase();
  if (!(ekstensi in TIPE_PER_EKSTENSI)) return null;
  const gabung = path.resolve(folder, nama);
  if (!gabung.startsWith(path.resolve(folder) + path.sep)) return null;
  return gabung;
}

export async function GET(_request: Request, { params }: { params: { nama: string } }) {
  const ekstensi = path.extname(params.nama).toLowerCase();
  const tipe = TIPE_PER_EKSTENSI[ekstensi];
  if (!tipe) return new Response("Tidak ditemukan.", { status: 404 });
  const kandidat = [
    jalurAman(folderUnggahan(), params.nama),
    jalurAman(path.join(process.cwd(), "public", "unggahan"), params.nama),
  ];
  for (const jalur of kandidat) {
    if (!jalur) continue;
    try {
      const isi = await berkas.readFile(jalur);
      return new Response(isi, {
        headers: {
          "Content-Type": tipe,
          // Nama berkas mengandung UUID acak, jadi isinya tidak akan
          // berubah — cache lama aman dipakai.
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      // Lanjut ke kandidat berikutnya (fallback).
    }
  }
  return new Response("Tidak ditemukan.", { status: 404 });
}
