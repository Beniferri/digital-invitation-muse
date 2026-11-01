import Image from "next/image";
import Link from "next/link";

// Kaki halaman yang singkat. Tautan legal (Tahap 5) mengarah ke halaman
// yang benar-benar ada. Klaim "belum ada pembayaran sungguhan" dari era
// MVP sudah dihapus — sejak Tahap 2, pembayaran lewat Midtrans sudah
// menjadi bagian produk (aktivasi Production-nya ada di checklist
// peluncuran, bukan di teks footer).
// Komponen ini komponen server biasa: ia hanya dirender oleh tata letak
// grup (situs), jadi tidak pernah muncul di halaman aplikasi/tamu.
export default function KakiHalaman() {
  return (
    <footer className="relative mt-20 overflow-hidden bg-tanah-900 text-krem-100">
      <div className="cahaya-hangat -top-16 right-10 h-56 w-56 bg-emas-500/30" />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="inline-flex rounded-2xl bg-krem-50 px-4 py-2">
          <Image src="/logo/betastoria-web.png" alt="BETA Storia" width={1500} height={500} className="h-10 w-auto" />
        </div>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-krem-200">
          Undangan digital untuk akad nikah, aqiqah, wisuda, sampai syukuran
          keluarga. Dibuat supaya kamu bisa berbagi kabar bahagia dalam
          beberapa menit, tanpa ribet.
        </p>
        <div className="mt-8 flex flex-wrap gap-6 text-sm font-semibold">
          <Link href="/" className="hover:text-white">Beranda</Link>
          <Link href="/katalog" className="hover:text-white">Katalog Template</Link>
          <Link href="/editor" className="hover:text-white">Editor</Link>
          <Link href="/bantuan" className="hover:text-white">Bantuan</Link>
          <Link href="/syarat" className="hover:text-white">Syarat &amp; Ketentuan</Link>
          <Link href="/privasi" className="hover:text-white">Kebijakan Privasi</Link>
        </div>
        <p className="mt-8 border-t border-white/15 pt-6 text-xs text-krem-200">
          BETA Storia dalam pengembangan aktif. Undangan bisa dibuat dari
          editor atau dasbor pengguna, lalu dibagikan lewat tautan tamu.
          Pembayaran diproses lewat Midtrans.
        </p>
      </div>
    </footer>
  );
}
