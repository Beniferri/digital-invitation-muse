// Healthcheck (Tahap 4): dipakai Coolify/Docker untuk memastikan aplikasi
// hidup DAN databasenya bisa dijangkau. Sengaja tanpa login — endpoint
// ini hanya mengungkapkan "hidup/tidak", bukan data apa pun. Kalau query
// database gagal, responsnya 500 supaya healthcheck menandainya tidak sehat.

import { satuBaris, type Baris } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const baris = await satuBaris<Baris>("SELECT 1 AS satu");
    if (Number(baris?.satu) !== 1) throw new Error("query kesehatan gagal");
    return Response.json({ status: "ok", waktu: new Date().toISOString() });
  } catch (galat) {
    // Log ke server (tidak ke respons) supaya penyebab tidak sehat bisa
    // dilacak dari log container, bukan cuma dari status 500.
    console.error("Healthcheck gagal:", galat);
    return Response.json({ status: "galat" }, { status: 500 });
  }
}
