// Server action RSVP tamu (publik, tanpa login).
// Tamu mengisi nama, kehadiran, jumlah tamu, dan pesan/doa untuk satu
// undangan yang statusnya Aktif. Satu nama yang sama di undangan yang sama
// hanya punya satu balasan: kirim ulang memperbarui jawaban lama, bukan
// menambah balasan baru, supaya hitungan tamu tidak mengganda.

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { idBaru, jalankan, satuBaris, sekarangIso, type Baris } from "./db";
import { cekBatasRsvp, JEDA_MINIMUM_RSVP_MS } from "./antiSpam";
import type { KehadiranRsvp } from "./tokoData";

function teks(formulir: FormData, nama: string): string {
  return String(formulir.get(nama) ?? "").trim();
}

export async function kirimRsvp(formulir: FormData) {
  const kode = teks(formulir, "kode");
  const tujuan = `/u/${kode}`;
  const undangan = kode
    ? await satuBaris<Baris>("SELECT id, status FROM undangan WHERE kode_tamu = ?", kode)
    : null;
  if (!undangan || String(undangan.status) !== "Aktif") redirect(`${tujuan}?galat=tutup`);
  const undanganId = String(undangan.id);

  // Pengaman spam Tahap 4 (urutan penting: yang murah dulu, yang menulis
  // ke database terakhir). Pesan galat sengaja netral untuk honeypot dan
  // jeda, supaya tidak mengajari bot lapis mana yang menangkapnya.
  // 1. Honeypot: kolom tersembunyi "situs_web" hanya diisi bot.
  if (teks(formulir, "situs_web") !== "") redirect(`${tujuan}?galat=robot`);
  // 2. Jeda minimum: kiriman < 3 detik setelah halaman dirender ditolak.
  //    Formulir lama tanpa kolom waktu_muat (cache) tidak diblokir — hanya
  //    kiriman yang TERBUKTI terlalu cepat yang ditolak.
  const waktuMuat = Number(formulir.get("waktu_muat"));
  if (Number.isFinite(waktuMuat) && Date.now() - waktuMuat < JEDA_MINIMUM_RSVP_MS) {
    redirect(`${tujuan}?galat=cepat`);
  }
  // 3. Batas kirim: maks 20 percobaan per jam per IP per undangan.
  if (!(await cekBatasRsvp(undanganId)).boleh) redirect(`${tujuan}?galat=batas`);

  const nama = teks(formulir, "nama");
  if (nama.length < 2 || nama.length > 100) redirect(`${tujuan}?galat=nama`);

  const kehadiranMentah = teks(formulir, "kehadiran");
  const kehadiran: KehadiranRsvp =
    kehadiranMentah === "Tidak" || kehadiranMentah === "Ragu" ? kehadiranMentah : "Hadir";

  // Tamu yang tidak bisa hadir tidak menyumbang hitungan tamu.
  const jumlahMentah = Number(formulir.get("jumlahTamu"));
  const jumlahTamu =
    kehadiran === "Tidak" ? 0 : Number.isFinite(jumlahMentah) ? Math.min(10, Math.max(1, Math.floor(jumlahMentah))) : 1;

  const pesan = teks(formulir, "pesan").slice(0, 500);
  const sekarang = sekarangIso();

  const sudahAda = await satuBaris<Baris>(
    "SELECT id FROM rsvp WHERE undangan_id = ? AND lower(nama) = lower(?)",
    undanganId,
    nama,
  );
  if (sudahAda) {
    await jalankan(
      "UPDATE rsvp SET kehadiran = ?, jumlah_tamu = ?, pesan = ?, diubah_pada = ? WHERE id = ?",
      kehadiran,
      jumlahTamu,
      pesan,
      sekarang,
      String(sudahAda.id),
    );
  } else {
    await jalankan(
      "INSERT INTO rsvp (id, undangan_id, nama, kehadiran, jumlah_tamu, pesan, dibuat_pada, diubah_pada) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      idBaru(),
      undanganId,
      nama,
      kehadiran,
      jumlahTamu,
      pesan,
      sekarang,
      sekarang,
    );
  }

  revalidatePath(`/admin/undangan`, "page");
  redirect(`${tujuan}?rsvp=terkirim`);
}
