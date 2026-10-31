// Penyimpanan foto sampul template untuk fondasi ini.
// Implementasi bawaan: berkas ditulis ke public/unggahan/ di server yang
// menjalankan aplikasi (cocok untuk VPS atau perangkat sendiri).
// BATAS: di platform serverless dengan sistem berkas sementara, unggahan
// bisa hilang saat deployment ulang. Untuk produksi di platform seperti itu,
// ganti fungsi simpanFoto di berkas ini dengan penyimpanan objek
// (misalnya Supabase Storage atau S3) tanpa mengubah pemanggilnya:
// pemanggil hanya butuh jalur hasil (string) yang bisa dibuka publik.

import { promises as berkas } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const BATAS_UKURAN_BAIT = 5 * 1024 * 1024; // 5 MB
const TIPE_DIIZINKAN = ["image/jpeg", "image/png", "image/webp"];

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

  const folder = path.join(process.cwd(), "public", "unggahan");
  await berkas.mkdir(folder, { recursive: true });
  const namaBerkas = `${randomUUID()}-${namaAman(berkasFoto.name)}`;
  const buffer = Buffer.from(await berkasFoto.arrayBuffer());
  await berkas.writeFile(path.join(folder, namaBerkas), buffer);
  return `/unggahan/${namaBerkas}`;
}
