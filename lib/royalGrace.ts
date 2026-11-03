// Tipe + parser data khusus tema Royal Grace (halaman penuh).
// Polanya mengikuti kisah_json di lib/tokoData.ts: JSON rusak atau bukan
// array -> [] (seksi tersembunyi), jadi undangan lama tanpa data baru
// tetap tampil tanpa galat. Parser teks dipakai editor: satu baris per
// item, kolom dipisah "|", supaya editor tidak butuh formulir dinamis.

export interface ItemJadwal {
  waktu: string;
  judul: string;
  keterangan: string;
}

export interface ItemPraAcara {
  tanggal: string;
  waktu: string;
  judul: string;
  lokasi: string;
}

const MAKS_JADWAL = 8;
const MAKS_PRA_ACARA = 6;
const MAKS_WARNA = 8;

function teksBersih(nilai: unknown): string {
  return String(nilai ?? "").trim();
}

function hexValid(nilai: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(nilai);
}

/** Parse jadwal_json dengan aman: rusak/bukan array -> []. */
export function parseJadwalJson(nilai: unknown): ItemJadwal[] {
  try {
    const mentah = JSON.parse(String(nilai ?? "[]")) as unknown;
    if (!Array.isArray(mentah)) return [];
    return mentah
      .map((item) => ({
        waktu: teksBersih((item as { waktu?: unknown }).waktu),
        judul: teksBersih((item as { judul?: unknown }).judul),
        keterangan: teksBersih((item as { keterangan?: unknown }).keterangan),
      }))
      .filter((item) => item.waktu !== "" || item.judul !== "")
      .slice(0, MAKS_JADWAL);
  } catch {
    return [];
  }
}

/** Parse acara_pra_json dengan aman: rusak/bukan array -> []. */
export function parsePraAcaraJson(nilai: unknown): ItemPraAcara[] {
  try {
    const mentah = JSON.parse(String(nilai ?? "[]")) as unknown;
    if (!Array.isArray(mentah)) return [];
    return mentah
      .map((item) => ({
        tanggal: teksBersih((item as { tanggal?: unknown }).tanggal),
        waktu: teksBersih((item as { waktu?: unknown }).waktu),
        judul: teksBersih((item as { judul?: unknown }).judul),
        lokasi: teksBersih((item as { lokasi?: unknown }).lokasi),
      }))
      .filter((item) => item.judul !== "")
      .slice(0, MAKS_PRA_ACARA);
  } catch {
    return [];
  }
}

/** Parse dress_code_warna (JSON array hex): hanya hex valid yang lolos. */
export function parseWarnaJson(nilai: unknown): string[] {
  try {
    const mentah = JSON.parse(String(nilai ?? "[]")) as unknown;
    if (!Array.isArray(mentah)) return [];
    return mentah
      .map((item) => teksBersih(item))
      .filter((warna) => hexValid(warna))
      .slice(0, MAKS_WARNA);
  } catch {
    return [];
  }
}

/**
 * Parse textarea jadwal editor: satu baris per item dengan format
 * "waktu | judul | keterangan". Baris tanpa judul dan waktu dilewati.
 */
export function parseJadwalTeks(teks: string): ItemJadwal[] {
  return teks
    .split("\n")
    .map((baris) => {
      const [waktu = "", judul = "", keterangan = ""] = baris.split("|").map((bagian) => bagian.trim());
      return { waktu, judul, keterangan };
    })
    .filter((item) => item.waktu !== "" || item.judul !== "")
    .slice(0, MAKS_JADWAL);
}

/**
 * Parse textarea pra-acara editor: satu baris per item dengan format
 * "tanggal | waktu | judul | lokasi". Baris tanpa judul dilewati.
 */
export function parsePraAcaraTeks(teks: string): ItemPraAcara[] {
  return teks
    .split("\n")
    .map((baris) => {
      const [tanggal = "", waktu = "", judul = "", lokasi = ""] = baris.split("|").map((bagian) => bagian.trim());
      return { tanggal, waktu, judul, lokasi };
    })
    .filter((item) => item.judul !== "")
    .slice(0, MAKS_PRA_ACARA);
}

/** Parse warna dress code editor: hex dipisah koma, hanya yang valid. */
export function parseWarnaTeks(teks: string): string[] {
  return teks
    .split(",")
    .map((bagian) => bagian.trim())
    .filter((warna) => hexValid(warna))
    .slice(0, MAKS_WARNA);
}

/**
 * Jadwal yang tampil: jadwal_json kalau ada, kalau kosong susun dari
 * kolom acara lama (acara_waktu + acara kedua) supaya undangan yang
 * dibuat sebelum Royal Grace tetap punya timeline.
 */
export function jadwalEfektif(
  jadwal: ItemJadwal[],
  acaraWaktu: string,
  acaraKeduaJudul: string,
  acaraKeduaWaktu: string,
  acaraKeduaLokasi: string,
): ItemJadwal[] {
  if (jadwal.length > 0) return jadwal;
  const susun: ItemJadwal[] = [];
  if (acaraWaktu.trim() !== "") {
    susun.push({ waktu: acaraWaktu.trim(), judul: "Acara Utama", keterangan: "" });
  }
  if (acaraKeduaJudul.trim() !== "") {
    susun.push({ waktu: acaraKeduaWaktu.trim(), judul: acaraKeduaJudul.trim(), keterangan: acaraKeduaLokasi.trim() });
  }
  return susun;
}
