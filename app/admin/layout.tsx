import { ambilSesiSaatIni } from "@/lib/sesi";
import { satuBaris, type Baris } from "@/lib/db";
import ShellAdmin from "@/komponen/ShellAdmin";

// Tata letak dasbor admin: sidebar + topbar (komponen ShellAdmin).
// Halaman login (/admin/login) tidak memakai kerangka ini: tanpa sesi
// admin, anak halaman dirender polos supaya formulir masuk tetap bisa
// tampil. Tiap halaman admin tetap memanggil wajibAdmin() sendiri.
// Lencana "perlu perhatian" = pesanan Menunggu + Gagal; mengetuknya
// membuka daftar pesanan. Kalau database belum siap, lencana = 0.
export default async function TataLetakAdmin({ children }: { children: React.ReactNode }) {
  const sesi = await ambilSesiSaatIni();
  if (!sesi || sesi.peran !== "admin") {
    return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>;
  }
  let perhatian = 0;
  try {
    perhatian = Number(
      (
        await satuBaris<Baris>(
          "SELECT COUNT(*) AS jumlah FROM pesanan WHERE status IN ('Menunggu', 'Gagal')",
        )
      )?.jumlah ?? 0,
    );
  } catch {
    perhatian = 0;
  }
  return (
    <ShellAdmin email={sesi.email} perhatian={perhatian}>
      {children}
    </ShellAdmin>
  );
}
