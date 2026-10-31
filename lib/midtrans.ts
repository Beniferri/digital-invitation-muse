// Lapisan Midtrans Snap Redirect (Tahap 2) — tanpa pustaka eksternal.
// Alur yang dipakai: server membuat transaksi Snap lewat API Midtrans,
// pelanggan diarahkan ke halaman bayar Midtrans (redirect_url), lalu status
// resmi pesanan HANYA diubah lewat webhook HTTP notification ke
// /api/midtrans/notifikasi — tidak pernah dari callback peramban, sesuai
// anjuran Midtrans. Kunci hanya dibaca dari environment variable; berkas
// ini tidak pernah berisi kunci apa pun.
// Referensi yang dipakai saat menulis ini (docs.midtrans.com, diakses
// 31 Okt 2026): endpoint Snap, notifikasi HTTP POST dengan signature_key,
// dan aturan idempotensi (order_id sebagai kunci).
//   - Snap Redirect: createTransaction mengembalikan redirect_url.
//   - Notifikasi: signature_key = SHA512(order_id + status_code +
//     gross_amount + ServerKey); sukses = status_code 200, fraud_status
//     ACCEPT (kalau ada), transaction_status settlement atau capture.
//   - Penanganan notifikasi harus idempotent karena Midtrans bisa mengirim
//     notifikasi yang sama lebih dari sekali.

import { createHash, timingSafeEqual } from "crypto";

export type PeriodePembayaran = "bulanan" | "tahunan";

export type StatusPesanan = "Menunggu" | "Lunas" | "Gagal";

/** Durasi langganan menurut periode bayar. Satu-satunya tempat yang
 *  menentukan ini — kalau aturan durasi berubah (mis. durasi per paket),
 *  ubah fungsi ini saja, bukan tiap pemanggil. */
export function durasiHariPeriode(periode: PeriodePembayaran): number {
  return periode === "tahunan" ? 365 : 30;
}

export function periodeBersih(nilai: string): PeriodePembayaran {
  return nilai === "tahunan" ? "tahunan" : "bulanan";
}

interface KonfigurasiMidtrans {
  serverKey: string;
  snapBaseUrl: string;
  isProduction: boolean;
}

/**
 * Konfigurasi dari environment. Mengembalikan null kalau Server Key belum
 * dipasang — pemanggil harus menampilkan galat yang jelas, bukan crash.
 * MIDTRANS_SNAP_BASE_URL hanya untuk pengujian lokal (mock server); di
 * produksi biarkan kosong supaya default Sandbox/Production yang dipakai.
 */
export function konfigurasiMidtrans(): KonfigurasiMidtrans | null {
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
  if (!serverKey) return null;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const snapBaseUrl =
    process.env.MIDTRANS_SNAP_BASE_URL ??
    (isProduction ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com");
  return { serverKey, snapBaseUrl, isProduction };
}

export interface PermintaanSnap {
  url: string;
  badan: Record<string, unknown>;
}

/**
 * Badan permintaan Snap Redirect. Fungsi murni (tidak ada jaringan) supaya
 * bisa dites tanpa kunci dan tanpa memanggil Midtrans sungguhan.
 * order_id dibuat pemanggil dan harus unik; gross_amount harus sama persis
 * dengan nominal pesanan di database, karena webhook nanti dicocokkan
 * dengan nominal itu juga.
 */
export function bangunPermintaanSnap(
  orderId: string,
  nominal: number,
  namaPaket: string,
  periode: PeriodePembayaran,
  email: string,
  nama: string | null,
  snapBaseUrl: string,
): PermintaanSnap {
  return {
    url: `${snapBaseUrl}/snap/v1/transactions`,
    badan: {
      transaction_details: { order_id: orderId, gross_amount: nominal },
      item_details: [
        {
          id: `${namaPaket}-${periode}`,
          price: nominal,
          quantity: 1,
          name: `Paket ${namaPaket} (${periode === "bulanan" ? "bulanan" : "tahunan"})`,
        },
      ],
      customer_details: {
        first_name: nama || email,
        email,
      },
    },
  };
}

/** Membuat transaksi Snap dan mengembalikan token + redirect_url. */
export async function buatTokenSnap(
  orderId: string,
  nominal: number,
  namaPaket: string,
  periode: PeriodePembayaran,
  email: string,
  nama: string | null,
): Promise<{ token: string; redirectUrl: string }> {
  const konfigurasi = konfigurasiMidtrans();
  if (!konfigurasi) {
    throw new Error("Kunci server Midtrans belum dipasang di environment.");
  }
  const permintaan = bangunPermintaanSnap(
    orderId,
    nominal,
    namaPaket,
    periode,
    email,
    nama,
    konfigurasi.snapBaseUrl,
  );
  const otorisasi = Buffer.from(`${konfigurasi.serverKey}:`).toString("base64");
  const respons = await fetch(permintaan.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${otorisasi}`,
    },
    body: JSON.stringify(permintaan.badan),
  });
  const hasil = (await respons.json()) as Record<string, unknown>;
  if (!respons.ok || typeof hasil.token !== "string" || typeof hasil.redirect_url !== "string") {
    const pesan = Array.isArray(hasil.error_messages)
      ? hasil.error_messages.join("; ")
      : `Midtrans mengembalikan status ${respons.status}.`;
    throw new Error(pesan);
  }
  return { token: hasil.token, redirectUrl: hasil.redirect_url };
}

/** SHA512(order_id + status_code + gross_amount + ServerKey). gross_amount
 *  harus string persis seperti yang dikirim Midtrans (mis. "99000.00"),
 *  bukan angka yang diformat ulang — selisih satu karakter saja membuat
 *  tanda tangan tidak cocok. */
export function hitungTandaTangan(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
): string {
  return createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
}

/** Memeriksa signature_key notifikasi dengan perbandingan waktu-konstan. */
export function verifikasiTandaTangan(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string,
  serverKey: string,
): boolean {
  const hitung = hitungTandaTangan(orderId, statusCode, grossAmount, serverKey);
  if (hitung.length !== signatureKey.length) return false;
  return timingSafeEqual(Buffer.from(hitung), Buffer.from(signatureKey));
}

/**
 * Memetakan status notifikasi Midtrans ke status pesanan lokal.
 * Mengembalikan null untuk status yang harus diabaikan (refund/chargeback:
 * pembatalan dana diurus manual lewat admin, bukan dengan mengubah status
 * pesanan yang sudah lunas secara otomatis).
 */
export function statusPesananDariNotifikasi(
  transactionStatus: string,
  fraudStatus: string | null,
): StatusPesanan | null {
  if (transactionStatus === "settlement" || transactionStatus === "capture") {
    if (fraudStatus === "challenge" || fraudStatus === "deny") return "Menunggu";
    return "Lunas";
  }
  if (transactionStatus === "pending" || transactionStatus === "authorize") return "Menunggu";
  if (
    transactionStatus === "deny" ||
    transactionStatus === "cancel" ||
    transactionStatus === "expire" ||
    transactionStatus === "failure"
  ) {
    return "Gagal";
  }
  return null;
}
