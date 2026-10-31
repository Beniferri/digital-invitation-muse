import Link from "next/link";

// Kaki halaman yang singkat. Tidak ada tautan palsu ke halaman yang belum ada.
export default function KakiHalaman() {
  return (
    <footer className="relative mt-20 overflow-hidden bg-tanah-900 text-krem-100">
      <div className="cahaya-hangat -top-16 right-10 h-56 w-56 bg-emas-500/30" />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="font-serif text-2xl font-bold">UndanganKita</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-krem-200">
          Undangan digital untuk akad nikah, aqiqah, wisuda, sampai syukuran
          keluarga. Dibuat supaya kamu bisa berbagi kabar bahagia dalam
          beberapa menit, tanpa ribet.
        </p>
        <div className="mt-8 flex flex-wrap gap-6 text-sm font-semibold">
          <Link href="/" className="hover:text-white">Beranda</Link>
          <Link href="/katalog" className="hover:text-white">Katalog Template</Link>
          <Link href="/editor" className="hover:text-white">Editor</Link>
        </div>
        <p className="mt-8 border-t border-white/15 pt-6 text-xs text-krem-200">
          Prototipe demo (MVP). Belum ada pembayaran sungguhan, akun pengguna,
          atau penyimpanan foto ke server. Data editor hanya pratinjau lokal.
        </p>
      </div>
    </footer>
  );
}
