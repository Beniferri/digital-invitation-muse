// Memindahkan data dari SQLite ke Postgres (Tahap 4).
//   SUMBER_DATABASE_URL="file:./dev.db" TUJUAN_DATABASE_URL="postgresql://pengguna:kata-sandi@host:5432/nama-db" npx tsx scripts/migrasi-ke-postgres.ts
// SUMBER default: DATABASE_URL kalau menunjuk berkas, atau file:./dev.db.
// TUJUAN wajib postgres:// atau postgresql://. Untuk pengujian, TUJUAN
// boleh "pg-mem://" (emulator di memori) — tapi datanya hilang begitu
// proses ini selesai, jadi hanya dipakai untuk memverifikasi logika
// migrasi, bukan untuk migrasi sungguhan.
// Aturan:
//   - Target harus KOSONG (semua tabel utama nol baris) — skrip menolak
//     menimpa data yang sudah ada.
//   - Urutan salin mengikuti foreign key: pengguna, templat, paket_harga,
//     undangan, pesanan, langganan, rsvp, percobaan_rsvp.
//   - Tabel sesi TIDAK ikut disalin (sesuai rencana: sesi lama hangus,
//     pengguna login ulang sekali). Jumlah sesi yang dilewati dicetak.
//   - Setelah salin, jumlah baris sumber vs tujuan dibandingkan per tabel
//     dan skrip gagal (exit 1) kalau ada yang tidak sama.
//   - Hash kata sandi ikut pindah apa adanya (format garam:hash tidak
//     tergantung engine database), jadi pengguna tidak perlu reset
//     kata sandi.
// Skrip ini TIDAK mengubah aplikasi yang sedang jalan: setelah migrasi,
// ganti DATABASE_URL di Coolify ke URL Postgres tujuan, lalu redeploy.

import { DatabaseSync } from "node:sqlite";
import { SKEMA } from "../lib/db";

const URUTAN_TABEL = [
  "pengguna",
  "templat",
  "paket_harga",
  "undangan",
  "pesanan",
  "langganan",
  "rsvp",
  "percobaan_rsvp",
] as const;

const sumberUrl = process.env.SUMBER_DATABASE_URL ?? process.env.DATABASE_URL ?? "file:./dev.db";
const tujuanUrl = process.env.TUJUAN_DATABASE_URL ?? "";
if (!tujuanUrl) {
  console.error("TUJUAN_DATABASE_URL wajib diisi (postgres://...).");
  process.exit(1);
}
if (sumberUrl.startsWith("postgres://") || sumberUrl.startsWith("postgresql://")) {
  console.error("SUMBER harus SQLite (file:...), bukan Postgres.");
  process.exit(1);
}

const sumberMentah = sumberUrl.startsWith("file:") ? sumberUrl.slice("file:".length) : sumberUrl;
const sumber = new DatabaseSync(sumberMentah, { readOnly: true });

interface KolamTarget {
  query: (teks: string, nilai: unknown[]) => Promise<{ rows: Array<Record<string, unknown>>; rowCount: number | null }>;
  end?: () => Promise<void>;
}

async function kolamTujuan(): Promise<KolamTarget> {
  if (tujuanUrl === "pg-mem://") {
    const { newDb } = await import("pg-mem");
    const mem = newDb();
    const { Pool } = mem.adapters.createPg();
    return new Pool() as unknown as KolamTarget;
  }
  const { Pool } = await import("pg");
  return new Pool({ connectionString: tujuanUrl });
}

async function utama() {
  const target = await kolamTujuan();
  try {
    // 1. Buat skema di target (satu pernyataan per query — pg tidak
    //    menerima banyak pernyataan sekaligus).
    for (const satu of SKEMA.split(";\n").map((s) => s.trim()).filter((s) => s.length > 0)) {
      await target.query(satu, []);
    }
    // 2. Tolak kalau target sudah berisi data.
    for (const tabel of URUTAN_TABEL) {
      const hasil = await target.query(`SELECT COUNT(*) AS jumlah FROM ${tabel}`, []);
      if (Number(hasil.rows[0]?.jumlah ?? 0) > 0) {
        console.error(`Target tidak kosong: tabel ${tabel} sudah berisi data. Migrasi dibatalkan.`);
        process.exit(1);
      }
    }
    // 3. Salin per tabel.
    for (const tabel of URUTAN_TABEL) {
      const barisSumber = sumber.prepare(`SELECT * FROM ${tabel}`).all() as Array<Record<string, unknown>>;
      for (const baris of barisSumber) {
        const kolom = Object.keys(baris);
        const placeholder = kolom.map((_, i) => `$${i + 1}`).join(", ");
        await target.query(
          `INSERT INTO ${tabel} (${kolom.join(", ")}) VALUES (${placeholder})`,
          kolom.map((k) => baris[k]),
        );
      }
      console.log(`${tabel}: ${barisSumber.length} baris disalin`);
    }
    // 4. Sesi dilewati (sengaja).
    const sesi = sumber.prepare("SELECT COUNT(*) AS jumlah FROM sesi").get() as { jumlah: number };
    console.log(`sesi: ${sesi.jumlah} baris DILEWATI (sesi lama hangus, pengguna login ulang)`);
    // 5. Verifikasi jumlah per tabel.
    for (const tabel of URUTAN_TABEL) {
      const asal = (sumber.prepare(`SELECT COUNT(*) AS jumlah FROM ${tabel}`).get() as { jumlah: number }).jumlah;
      const hasil = await target.query(`SELECT COUNT(*) AS jumlah FROM ${tabel}`, []);
      const tujuan = Number(hasil.rows[0]?.jumlah ?? 0);
      if (asal !== tujuan) {
        console.error(`VERIFIKASI GAGAL ${tabel}: sumber ${asal}, tujuan ${tujuan}`);
        process.exit(1);
      }
    }
    console.log("Migrasi selesai dan terverifikasi: semua jumlah baris sama.");
  } finally {
    await target.end?.();
  }
}

utama().catch((galat) => {
  console.error(galat);
  process.exit(1);
});
