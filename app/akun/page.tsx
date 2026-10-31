import Link from "next/link";
import { redirect } from "next/navigation";
import { ambilSesiSaatIni } from "@/lib/sesi";
import { keluarPengguna } from "@/lib/aksiOtentikasi";
import { hapusUndanganPengguna, ubahStatusUndanganPengguna } from "@/lib/aksiPengguna";
import { bacaDaftarUndanganOlehPengguna, bacaRingkasanRsvp } from "@/lib/tokoData";
import {
  bacaDaftarPesananOlehPengguna,
  jumlahUndanganAktifPengguna,
  langgananAktifPengguna,
  periksaKedaluwarsaPengguna,
} from "@/lib/langganan";
import { formatTanggalIndonesia } from "@/lib/format";
import { formatRupiah } from "@/data/paketHarga";

export const dynamic = "force-dynamic";

// Pesan galat dari penegakan batas paket (lihat aksi pengguna): mengubah
// status jadi Aktif ditolak kalau tidak ada langganan aktif atau slotnya
// sudah penuh.
const pesanGalat: Record<string, string> = {
  "butuh-paket":
    "Untuk mengaktifkan undangan, kamu butuh langganan aktif. Pilih paket di bawah — membuat Draft tetap gratis.",
  "slot-habis":
    "Slot undangan aktif di paketmu sudah penuh. Nonaktifkan satu undangan dulu, atau naik ke paket yang lebih besar.",
};

// Dasbor pengguna: hanya undangan yang dibuat pengguna ini sendiri.
// Undangan admin lama (tanpa pemilik) tidak muncul di sini, dan undangan
// pengguna lain tidak bisa dibuka, diubah, atau dihapus dari halaman ini
// karena aksi pengguna selalu memeriksa kepemilikan di server.
const daftarStatus = ["Draft", "Aktif", "Selesai"] as const;

export default async function Akun({
  searchParams,
}: {
  searchParams?: { dari?: string; galat?: string };
}) {
  const sesi = await ambilSesiSaatIni();
  if (!sesi) redirect("/masuk");

  // Kedaluwarsa diperiksa malas di sini: langganan yang sudah lewat
  // tanggalnya (dan undangan Aktif di bawahnya) diubah jadi Selesai
  // sebelum dasbor dibaca, supaya angka di bawah tidak pernah
  // menampilkan langganan yang sebenarnya sudah habis.
  periksaKedaluwarsaPengguna(sesi.id);
  const langganan = langgananAktifPengguna(sesi.id);
  const daftarPesanan = bacaDaftarPesananOlehPengguna(sesi.id);
  const galat = searchParams?.galat ? pesanGalat[searchParams.galat] : undefined;

  const daftarDasar = await bacaDaftarUndanganOlehPengguna(sesi.id);
  const daftar = await Promise.all(
    daftarDasar.map(async (undangan) => ({
      ...undangan,
      ringkasan: await bacaRingkasanRsvp(undangan.id),
    })),
  );
  const totalBalasan = daftar.reduce((jumlah, item) => jumlah + item.ringkasan.totalBalasan, 0);
  const totalTamuHadir = daftar.reduce((jumlah, item) => jumlah + item.ringkasan.totalTamuHadir, 0);
  const jumlahAktif = daftar.filter((item) => item.status === "Aktif").length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-bold">Dasbor Saya</h1>
          <p className="mt-2 max-w-2xl text-[17px] leading-relaxed text-tintaLembut">
            Kamu masuk sebagai <strong>{sesi.nama || sesi.email}</strong>
            {sesi.nama ? ` (${sesi.email})` : ""}. Di bawah ini hanya undangan
            yang kamu buat sendiri — lengkap dengan tautan tamu dan ringkasan RSVP-nya.
          </p>
          {sesi.peran === "admin" && (
            <p className="mt-2 text-[15px] text-tintaLembut">
              Kamu juga admin: semua undangan (termasuk yang bukan milikmu) dikelola di{" "}
              <Link href="/admin" className="font-bold text-tanah-600 underline underline-offset-4">Dasbor Admin</Link>.
            </p>
          )}
        </div>
        <form action={keluarPengguna}>
          <button type="submit" className="min-h-[44px] rounded-full border-2 border-tanah-600 px-4 text-sm font-bold text-tanah-700">
            Keluar
          </button>
        </form>
      </div>

      {searchParams?.dari === "editor" && (
        <p role="status" className="mt-6 rounded-2xl bg-daun-100 px-4 py-3 text-sm font-bold text-daun-700">
          Undangan dari editor tersimpan sebagai Draft. Ubah statusnya jadi Aktif
          di bawah supaya tamu bisa membuka tautan dan mengisi RSVP, lalu bagikan
          tautan tamunya.
        </p>
      )}
      {galat && (
        <p role="alert" className="mt-6 rounded-2xl bg-terakota-100 px-4 py-3 text-sm font-bold text-tanah-700">
          {galat}
        </p>
      )}

      <section className="kartu-kaca mt-8 rounded-[1.75rem] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-bold">Langganan Saya</h2>
            {langganan ? (
              <p className="mt-1 text-[15px] leading-relaxed text-tintaLembut">
                Paket <strong>{langganan.namaPaket}</strong> · aktif sampai{" "}
                {formatTanggalIndonesia(langganan.berakhirPada)} ·{" "}
                {jumlahUndanganAktifPengguna(sesi.id)} dari {langganan.maksUndanganAktif} slot undangan aktif terpakai.
              </p>
            ) : (
              <p className="mt-1 text-[15px] leading-relaxed text-tintaLembut">
                Belum ada langganan aktif. Membuat undangan (Draft) tetap gratis;
                untuk mengaktifkannya supaya tamu bisa RSVP, kamu butuh paket.
              </p>
            )}
          </div>
          <Link href="/akun/paket" className="tombol-utama shrink-0 bg-tanah-600 text-sm text-white hover:bg-tanah-700">
            {langganan ? "Perpanjang / Ganti Paket" : "Beli Paket"}
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-2xl font-bold">Riwayat Pembayaran</h2>
        {daftarPesanan.length === 0 ? (
          <p className="mt-3 text-[15px] text-tintaLembut">Belum ada pembayaran.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {daftarPesanan.map((pesanan) => (
              <li key={pesanan.id} className="kartu-kaca flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] p-4">
                <p className="text-[15px]">
                  <strong>Paket {pesanan.namaPaket}</strong> ({pesanan.periode === "bulanan" ? "bulanan" : "tahunan"}) ·{" "}
                  {formatRupiah(pesanan.nominal)} ·{" "}
                  {pesanan.status === "Lunas" ? "Lunas" : pesanan.status === "Gagal" ? "Gagal" : "Menunggu"} ·{" "}
                  {pesanan.dibuatPada}
                </p>
                <Link href={`/akun/pembayaran/${pesanan.id}`} className="text-sm font-bold text-tanah-600 underline underline-offset-4">
                  Lihat pembayaran
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { judul: "Undangan saya", nilai: String(daftar.length), keterangan: `${jumlahAktif} berstatus Aktif.` },
          { judul: "Balasan RSVP", nilai: String(totalBalasan), keterangan: "Dari semua undangan saya." },
          { judul: "Tamu konfirmasi hadir", nilai: `${totalTamuHadir} tamu`, keterangan: "Total dari balasan hadir." },
        ].map((kartu) => (
          <div key={kartu.judul} className="kartu-kaca rounded-[1.75rem] p-5">
            <p className="text-sm font-bold text-tintaLembut">{kartu.judul}</p>
            <p className="mt-1 font-serif text-3xl font-bold">{kartu.nilai}</p>
            <p className="mt-1 text-sm text-tintaLembut">{kartu.keterangan}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-serif text-3xl font-bold">Undangan Saya</h2>
        <Link href="/akun/undangan/baru" className="tombol-utama bg-tanah-600 text-sm text-white hover:bg-tanah-700">
          Buat Undangan Baru
        </Link>
      </div>

      <div className="mt-6 grid gap-4">
        {daftar.map((undangan) => (
          <article key={undangan.id} className="kartu-kaca rounded-[1.75rem] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-2xl font-bold">
                  {undangan.namaPertama}
                  {undangan.namaKedua ? ` dan ${undangan.namaKedua}` : ""}
                </h3>
                <p className="mt-1 text-sm text-tintaLembut">
                  {undangan.jenisAcara} · {formatTanggalIndonesia(undangan.tanggal)} · {undangan.lokasi}
                </p>
                <p className="mt-1 text-sm text-tintaLembut">
                  RSVP: {undangan.ringkasan.totalBalasan} balasan · {undangan.ringkasan.hadir} hadir ({undangan.ringkasan.totalTamuHadir} tamu) · Tautan tamu: /u/{undangan.kodeTamu}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-daun-100 px-3 py-1 text-xs font-bold text-daun-700">
                {undangan.status}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href={`/u/${undangan.kodeTamu}`} className="min-h-[44px] text-sm font-bold text-tanah-600 underline underline-offset-4">
                Halaman tamu
              </Link>
              <Link href={`/akun/undangan/${undangan.id}`} className="min-h-[44px] text-sm font-bold text-tanah-600 underline underline-offset-4">
                Lihat RSVP
              </Link>
              <form action={ubahStatusUndanganPengguna} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={undangan.id} />
                <label htmlFor={`status-${undangan.id}`} className="text-sm font-bold">Ubah status:</label>
                <select
                  id={`status-${undangan.id}`}
                  name="status"
                  defaultValue={undangan.status}
                  className="min-h-[44px] rounded-full border border-tanah-900/15 bg-white/80 px-3 text-sm font-bold"
                >
                  {daftarStatus.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <button type="submit" className="min-h-[44px] rounded-full border-2 border-tanah-600 px-4 text-sm font-bold text-tanah-700">
                  Simpan status
                </button>
              </form>
              <form action={hapusUndanganPengguna}>
                <input type="hidden" name="id" value={undangan.id} />
                <button type="submit" className="min-h-[44px] rounded-full bg-terakota-100 px-4 text-sm font-bold text-tanah-700">
                  Hapus
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
      {daftar.length === 0 && (
        <p className="kartu-kaca mt-6 rounded-[2rem] p-6 text-center text-tintaLembut">
          Belum ada undangan atas namamu. Buat yang pertama dari tombol di atas, lalu ubah statusnya
          jadi Aktif supaya tamu bisa membuka tautan dan mengisi RSVP.
        </p>
      )}
    </div>
  );
}
