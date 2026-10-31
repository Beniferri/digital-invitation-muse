// Server action pembayaran (Tahap 2).
// Alurnya: pengguna memilih paket + periode di /akun/paket, aksi ini
// membuat pesanan (Menunggu), meminta token Snap ke Midtrans, menyimpan
// token + redirect_url di pesanan, lalu mengarahkan ke halaman pembayaran.
// Kalau Midtrans gagal (kunci belum dipasang, jaringan, atau Midtrans
// menolak), pesanan TETAP tersimpan berstatus Menunggu dan pengguna
// diarahkan ke halaman pembayaran dengan galat — di sana ada tombol
// "Coba lagi" yang mengulang permintaan token tanpa membuat pesanan baru.
// Status Lunas HANYA diubah webhook (/api/midtrans/notifikasi), tidak
// pernah oleh aksi-aksi di sini.

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ambilSesiSaatIni, type SesiPengguna } from "./sesi";
import { buatTokenSnap, periodeBersih } from "./midtrans";
import {
  buatPesanan,
  cariPesananOlehIdDanPengguna,
  simpanTokenSnap,
} from "./langganan";

function teks(formulir: FormData, nama: string): string {
  return String(formulir.get(nama) ?? "").trim();
}

async function wajibPengguna(): Promise<SesiPengguna> {
  const sesi = await ambilSesiSaatIni();
  if (!sesi) redirect("/masuk?lanjut=/akun/paket");
  return sesi;
}

export async function buatPesananDanBayar(formulir: FormData) {
  const sesi = await wajibPengguna();
  const namaPaket = teks(formulir, "namaPaket");
  const periode = periodeBersih(teks(formulir, "periode"));
  let pesananId: string | null = null;
  try {
    const pesanan = await buatPesanan(sesi.id, namaPaket, periode);
    pesananId = pesanan.id;
    const { token, redirectUrl } = await buatTokenSnap(
      pesanan.orderId,
      pesanan.nominal,
      pesanan.namaPaket,
      pesanan.periode,
      sesi.email,
      sesi.nama,
    );
    await simpanTokenSnap(pesanan.id, token, redirectUrl);
  } catch {
    // Paket tidak ditemukan / nominal tidak valid: kembali ke halaman paket.
    // Midtrans gagal: pesanan sudah dibuat (kalau sempat), arahkan ke
    // halaman pembayarannya dengan galat supaya bisa dicoba lagi.
    if (!pesananId) redirect("/akun/paket?galat=paket");
    redirect(`/akun/pembayaran/${pesananId}?galat=midtrans`);
  }
  revalidatePath("/akun", "page");
  redirect(`/akun/pembayaran/${pesananId}`);
}

export async function cobaLagiToken(formulir: FormData) {
  const sesi = await wajibPengguna();
  const pesanan = await cariPesananOlehIdDanPengguna(teks(formulir, "id"), sesi.id);
  if (!pesanan || pesanan.status !== "Menunggu") redirect("/akun");
  try {
    const { token, redirectUrl } = await buatTokenSnap(
      pesanan.orderId,
      pesanan.nominal,
      pesanan.namaPaket,
      pesanan.periode,
      sesi.email,
      sesi.nama,
    );
    await simpanTokenSnap(pesanan.id, token, redirectUrl);
  } catch {
    redirect(`/akun/pembayaran/${pesanan.id}?galat=midtrans`);
  }
  redirect(`/akun/pembayaran/${pesanan.id}`);
}
