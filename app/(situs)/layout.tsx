import Navigasi from "@/komponen/Navigasi";
import KakiHalaman from "@/komponen/KakiHalaman";

// Tata letak grup (situs): SATU-SATUNYA tempat header + footer situs
// dipasang. Grup rute (tanda kurung) tidak mengubah URL — halaman di
// dalam folder ini tetap beralamat /, /katalog, /bantuan, dan
// seterusnya — tapi hanya halaman-halaman inilah yang mendapat chrome
// situs. Halaman di luar grup (admin, /akun, /editor, /u, /undangan)
// memakai tata letak akar yang polos. Jangan memindahkan halaman
// aplikasi ke grup ini, dan jangan memasang chrome lewat pengecekan
// pathname: struktur folder inilah yang menjamin pemisahannya.
export default function TataLetakSitus({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigasi />
      {children}
      <KakiHalaman />
    </>
  );
}
