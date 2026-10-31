// Server action RSVP tamu (publik, tanpa login).
// Tamu mengisi nama, kehadiran, jumlah tamu, dan pesan/doa untuk satu
// undangan yang statusnya Aktif. Satu nama yang sama di undangan yang sama
// hanya punya satu balasan: kirim ulang memperbarui jawaban lama, bukan
// menambah balasan baru, supaya hitungan tamu tidak mengganda.

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { idBaru, jalankan, satuBaris, sekarangIso, type Baris } from "./db";
import type { KehadiranRsvp } from "./tokoData";

function teks(formulir: FormData, nama: string): string {
  return String(formulir.get(nama) ?? "").trim();
}

export async function kirimRsvp(formulir: FormData) {
  const kode = teks(formulir, "kode");
  const tujuan = `/u/${kode}`;
  const undangan = kode
    ? satuBaris<Baris>("SELECT id, status FROM undangan WHERE kode_tamu = ?", kode)
    : null;
  if (!undangan || String(undangan.status) !== "Aktif") redirect(`${tujuan}?galat=tutup`);

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
  const undanganId = String(undangan.id);
  const sekarang = sekarangIso();

  const sudahAda = satuBaris<Baris>(
    "SELECT id FROM rsvp WHERE undangan_id = ? AND lower(nama) = lower(?)",
    undanganId,
    nama,
  );
  if (sudahAda) {
    jalankan(
      "UPDATE rsvp SET kehadiran = ?, jumlah_tamu = ?, pesan = ?, diubah_pada = ? WHERE id = ?",
      kehadiran,
      jumlahTamu,
      pesan,
      sekarang,
      String(sudahAda.id),
    );
  } else {
    jalankan(
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
