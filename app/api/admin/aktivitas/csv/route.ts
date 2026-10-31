// Unduh CSV aktivitas dasbor admin (pola yang sama dengan CSV RSVP
// Tahap 3). Otorisasi: hanya admin. Tanpa sesi -> diarahkan ke halaman
// masuk admin; sesi bukan admin -> 403. Parameter cari/jenis sama
// dengan filter tabel di /admin, supaya isi CSV = isi tabel.
import { NextResponse } from "next/server";
import { ambilSesiSaatIni } from "@/lib/sesi";
import { bacaAktivitas, bangunCsvAktivitas, type JenisAktivitas } from "@/lib/dasborAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sesi = await ambilSesiSaatIni();
  if (!sesi) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (sesi.peran !== "admin") {
    return new NextResponse("Hanya admin yang boleh mengunduh aktivitas.", { status: 403 });
  }
  const parameter = new URL(request.url).searchParams;
  const cari = parameter.get("cari") ?? "";
  const jenisMentah = parameter.get("jenis") ?? "";
  const jenis: JenisAktivitas | null =
    jenisMentah === "pembayaran" || jenisMentah === "langganan" || jenisMentah === "akun"
      ? jenisMentah
      : null;
  const daftar = await bacaAktivitas(cari, jenis, 500);
  return new NextResponse(bangunCsvAktivitas(daftar), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="aktivitas-admin.csv"',
    },
  });
}
