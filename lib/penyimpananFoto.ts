// Penyimpanan foto sampul template untuk fondasi ini.
// Folder unggahan bisa diatur lewat environment UNGGAHAN_DIR. Di
// pengembangan lokal (variabel tidak dipasang), foldernya
// public/unggahan seperti dulu. Di Coolify, image mengatur
// UNGGAHAN_DIR=/data/unggahan — di dalam volume persisten yang sama
// dengan database — sehingga foto tidak hilang saat redeploy, tanpa
// perlu volume tambahan. Jalur publiknya TETAP /unggahan/<nama> di semua
// kasus: route /api/unggahan melayani berkas dari folder itu (lihat
// next.config.mjs, rewrite beforeFiles), dengan fallback ke
// public/unggahan untuk berkas lama yang masih tersisa di sana.
// Untuk produksi serverless murni (tanpa volume sama sekali), ganti
// fungsi simpanFoto di berkas ini dengan penyimpanan objek (misalnya
// Supabase Storage atau S3) tanpa mengubah pemanggilnya: pemanggil
// hanya butuh jalur hasil (string) yang bisa dibuka publik.

import { promises as berkas } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const BATAS_UKURAN_BAIT = 5 * 1024 * 1024; // 5 MB
const TIPE_DIIZINKAN = ["image/jpeg", "image/png", "image/webp"];

/** Folder tempat foto ditulis dan dibaca. */
export function folderUnggahan(): string {
  const dariEnv = process.env.UNGGAHAN_DIR?.trim();
  return dariEnv ? dariEnv : path.join(process.cwd(), "public", "unggahan");
}

function namaAman(namaAsli: string): string {
  const dasar = path.basename(namaAsli).toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  return dasar || "foto";
}

// Menyimpan satu berkas foto dari formulir, mengembalikan jalur publiknya.
// Mengembalikan null kalau berkas kosong, terlalu besar, atau bukan gambar.
export async function simpanFoto(berkasFoto: File | null): Promise<string | null> {
  if (!berkasFoto || berkasFoto.size === 0) return null;
  if (berkasFoto.size > BATAS_UKURAN_BAIT) return null;
  if (!TIPE_DIIZINKAN.includes(berkasFoto.type)) return null;

  const folder = folderUnggahan();
  await berkas.mkdir(folder, { recursive: true });
  const namaBerkas = `${randomUUID()}-${namaAman(berkasFoto.name)}`;
  const buffer = Buffer.from(await berkasFoto.arrayBuffer());
  await berkas.writeFile(path.join(folder, namaBerkas), buffer);
  return `/unggahan/${namaBerkas}`;
}
