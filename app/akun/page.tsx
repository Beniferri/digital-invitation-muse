import { redirect } from "next/navigation";
import { ambilSesiSaatIni } from "@/lib/sesi";
import { keluarPengguna } from "@/lib/aksiOtentikasi";

// Halaman akun minimal untuk fondasi: membuktikan sesi pengguna jalan
// (bukan sekadar cookie), dan memberi titik awal untuk tahap berikutnya
// saat undangan pengguna sudah bisa disimpan.
export default async function Akun() {
  const sesi = await ambilSesiSaatIni();
  if (!sesi) redirect("/masuk");
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="kartu-kaca rounded-[2rem] p-6 sm:p-8">
        <h1 className="font-serif text-3xl font-bold">Akun Saya</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-tintaLembut">
          Kamu masuk sebagai <strong>{sesi.nama || sesi.email}</strong>
          {sesi.nama ? ` (${sesi.email})` : ""} dengan peran{" "}
          <strong>{sesi.peran}</strong>.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-tintaLembut">
          Di tahap berikutnya, halaman ini akan menampilkan daftar undangan
          yang kamu simpan dari editor. Untuk sekarang, editor masih berupa
          pratinjau lokal seperti sebelumnya.
        </p>
        <form action={keluarPengguna} className="mt-6">
          <button type="submit" className="tombol-utama border-2 border-tanah-600 text-sm text-tanah-700 hover:bg-krem-100">
            Keluar
          </button>
        </form>
      </div>
    </div>
  );
}
