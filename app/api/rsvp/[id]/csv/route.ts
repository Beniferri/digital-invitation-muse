// Unduh CSV RSVP satu undangan (Tahap 3). Tautan dipakai tombol "Unduh
// CSV" di halaman detail admin dan pengguna.
// Otorisasi: admin boleh mengunduh RSVP undangan mana pun; pengguna biasa
// hanya RSVP undangannya sendiri. Tanpa sesi, pengguna diarahkan ke
// halaman masuk (perilaku tautan unduhan di peramban, bukan JSON error).
// Isi CSV selalu SEMUA balasan (tidak mengikuti filter layar), supaya
// jumlah barisnya sama dengan total balasan di dasbor. Urutan baris sama
// dengan dasbor (terbaru dulu) karena memakai bacaDaftarRsvp yang sama.

import { NextResponse } from "next/server";
import { ambilSesiSaatIni } from "@/lib/sesi";
import { bacaDaftarRsvp, cariUndanganOlehId } from "@/lib/tokoData";
import { bangunCsvRsvp } from "@/lib/csvRsvp";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const sesi = await ambilSesiSaatIni();
  if (!sesi) {
    return NextResponse.redirect(new URL("/masuk", request.url));
  }
  const undangan = await cariUndanganOlehId(params.id);
  if (!undangan) {
    return new NextResponse("Undangan tidak ditemukan.", { status: 404 });
  }
  const boleh = sesi.peran === "admin" || undangan.penggunaId === sesi.id;
  if (!boleh) {
    return new NextResponse("Kamu tidak punya akses ke RSVP undangan ini.", { status: 403 });
  }
  const daftar = await bacaDaftarRsvp(undangan.id);
  const namaBerkas = `rsvp-${undangan.kodeTamu || undangan.id.slice(0, 8)}.csv`;
  return new NextResponse(bangunCsvRsvp(daftar), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${namaBerkas}"`,
    },
  });
}
