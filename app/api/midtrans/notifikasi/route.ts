// Webhook Midtrans (HTTP notification) — satu-satunya jalur resmi yang
// mengubah status pesanan dan mengaktifkan langganan. Callback peramban
// (Snap popup/redirect) TIDAK PERNAH mengubah status, sesuai anjuran
// Midtrans, karena callback itu bisa dipalsukan.
// Keamanan dan idempotensi:
//   - signature_key diverifikasi dengan Server Key sebelum apa pun diubah.
//   - gross_amount dicocokkan dengan nominal pesanan di database.
//   - Pesanan yang tidak dikenal atau status yang tidak dipetakan
//     (mis. refund) diabaikan dengan respons 200 supaya Midtrans tidak
//     mengulanginya tanpa henti.
//   - Aktivasi langganan idempotent: notifikasi yang sama dua kali tidak
//     membuat dua langganan (lihat aktifkanLanggananDariPesanan).
// Handler ini sengaja cepat (tanpa panggilan eksternal) karena Midtrans
// hanya menunggu 15 detik sebelum menganggap pengiriman gagal.

import { NextResponse } from "next/server";
import { konfigurasiMidtrans, statusPesananDariNotifikasi, verifikasiTandaTangan } from "@/lib/midtrans";
import {
  aktifkanLanggananDariPesanan,
  cariPesananOlehOrderId,
  ubahStatusPesanan,
} from "@/lib/langganan";

export async function POST(request: Request) {
  let notifikasi: Record<string, unknown>;
  try {
    notifikasi = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ diterima: false, alasan: "badan bukan JSON" }, { status: 400 });
  }

  const orderId = typeof notifikasi.order_id === "string" ? notifikasi.order_id : "";
  const statusCode = String(notifikasi.status_code ?? "");
  const grossMentah = notifikasi.gross_amount;
  const grossAmount =
    typeof grossMentah === "string" ? grossMentah : Number(grossMentah).toFixed(2);
  const signatureKey = typeof notifikasi.signature_key === "string" ? notifikasi.signature_key : "";
  const transactionStatus =
    typeof notifikasi.transaction_status === "string" ? notifikasi.transaction_status : "";
  const fraudStatus =
    typeof notifikasi.fraud_status === "string" ? notifikasi.fraud_status : null;
  const paymentType =
    typeof notifikasi.payment_type === "string" ? notifikasi.payment_type : null;

  if (!orderId || !statusCode || !signatureKey || !transactionStatus) {
    return NextResponse.json({ diterima: false, alasan: "kolom tidak lengkap" }, { status: 400 });
  }

  const konfigurasi = konfigurasiMidtrans();
  if (!konfigurasi) {
    // Kunci belum dipasang: kembalikan 500 supaya Midtrans mengulang nanti
    // setelah kunci dipasang, bukan menganggap notifikasi sudah diproses.
    return NextResponse.json({ diterima: false, alasan: "kunci Midtrans belum dipasang" }, { status: 500 });
  }

  if (!verifikasiTandaTangan(orderId, statusCode, grossAmount, signatureKey, konfigurasi.serverKey)) {
    return NextResponse.json({ diterima: false, alasan: "tanda tangan tidak cocok" }, { status: 400 });
  }

  const pesanan = await cariPesananOlehOrderId(orderId);
  if (!pesanan) {
    return NextResponse.json({ diterima: true, alasan: "pesanan tidak dikenal, diabaikan" });
  }

  // Nominal harus sama persis dengan yang dibuat saat checkout; kalau
  // berbeda, notifikasi ini tidak boleh mengubah pesanan (indikasi
  // manipulasi atau order_id yang dipakai ulang).
  if (Number(grossAmount) !== pesanan.nominal) {
    return NextResponse.json({ diterima: true, alasan: "nominal tidak cocok, diabaikan" });
  }

  const statusBaru = statusPesananDariNotifikasi(transactionStatus, fraudStatus);
  if (!statusBaru) {
    return NextResponse.json({ diterima: true, alasan: "status tidak dipetakan, diabaikan" });
  }

  const diperbarui = await ubahStatusPesanan(orderId, statusBaru, paymentType);
  if (diperbarui && statusBaru === "Lunas") {
    await aktifkanLanggananDariPesanan(diperbarui);
  }
  return NextResponse.json({ diterima: true, status: statusBaru });
}
